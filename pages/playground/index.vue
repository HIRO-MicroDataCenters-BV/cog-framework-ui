<script setup lang="ts">
/**
 * Playground: ask every model an inference service exposes the same
 * question and compare the answers side by side.
 *
 * An LLM service that carries LoRA adapters answers under several model
 * names (the base plus one per adapter). The page lists those names via
 * `GET /models-serving/{isvc}/models`, then fires one
 * `POST /models-serving/{isvc}/completions` per name in parallel and renders
 * each answer in its own column — so a freshly fine-tuned adapter can be
 * eyeballed against its base without leaving the platform.
 *
 * An exact NTK fine-tune is served as its own service, and the single GPU
 * hosts one service at a time. Comparing base vs NTK therefore spans two
 * services: ask the base, pin its answers, replace the service with the NTK
 * one, ask again. Pinned answers sit in their own panel to the left of the
 * live columns, survive service switches and page reloads (localStorage),
 * and are cleared explicitly.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';
import { useApi } from '@/composables/api';
import type {
  ModelServing,
  ServedCompletionData,
  ServedModelsData,
} from '~/types/model.types';

const { setPage } = useApp();
const { t } = useI18n();
const { getModelsServing, getServedModels, postServedCompletion } = useApi();

setPage({
  section: 'playground',
});

/** Defaults that make base-vs-adapter comparisons reproducible. */
const DEFAULT_MAX_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0;
/** Stops a Q/A-tuned model from hallucinating the next question. */
const STOP_SEQUENCES = ['Question:'];

/** Quick-fill requests that match the Pulumi-for-Kubernetes demo dataset. */
const EXAMPLE_REQUESTS = [
  'Deploy nginx:1.27 on port 80 with 2 replicas in namespace web, exposed as a ClusterIP service.',
  'Create a namespace "jobs" and run a CronJob every 15 minutes using busybox that prints the date.',
  'Deploy redis:7 as a StatefulSet with 3 replicas and a 5Gi PersistentVolumeClaim per pod, plus a headless service.',
];

// --- inference services -----------------------------------------------------

const services = ref<ModelServing[]>([]);
const servicesLoading = ref(false);
// True when the list had rows but none were ready: the picker then shows all
// of them and a hint explains why an Ask may fail.
const noneReady = ref(false);
const selectedIsvc = ref('');

const loadServices = async () => {
  servicesLoading.value = true;
  try {
    // The backend list route takes no filters — narrow client-side.
    const res = await getModelsServing({});
    const rows = Array.isArray(res?.data) ? (res.data as ModelServing[]) : [];
    const ready = rows.filter(
      (row) => (row.status || '').toLowerCase() === 'ready',
    );
    noneReady.value = rows.length > 0 && ready.length === 0;
    services.value = ready.length ? ready : rows;
  } catch (err) {
    console.error('Failed to load inference services', err);
    services.value = [];
    noneReady.value = false;
  } finally {
    servicesLoading.value = false;
    // Services come and go between the two halves of a comparison (the base
    // service is deleted before the fine-tuned one is served). A selection
    // that no longer exists falls back to "select a service" rather than
    // leaving a dead name in the picker.
    if (
      selectedIsvc.value &&
      !services.value.some((svc) => svc.isvc_name === selectedIsvc.value)
    ) {
      selectedIsvc.value = '';
    }
  }
};

// --- served model names -----------------------------------------------------

const servedModels = ref<string[]>([]);
const servedModelsLoading = ref(false);
// Monotonic token: a quick service switch can leave an earlier names request
// in flight; only the latest may apply its result.
let servedModelsLoadId = 0;

const loadServedModels = async (isvcName: string) => {
  const loadId = ++servedModelsLoadId;
  servedModels.value = [];
  answers.value = [];
  if (!isvcName) return;
  servedModelsLoading.value = true;
  try {
    const res = await getServedModels(isvcName);
    if (loadId !== servedModelsLoadId) return;
    const data = res?.data as ServedModelsData | undefined;
    servedModels.value = Array.isArray(data?.models)
      ? data.models.filter((name) => typeof name === 'string' && name)
      : [];
  } catch (err) {
    if (loadId !== servedModelsLoadId) return;
    console.error('Failed to load served model names', err);
    servedModels.value = [];
  } finally {
    if (loadId === servedModelsLoadId) servedModelsLoading.value = false;
  }
};

watch(selectedIsvc, (isvcName) => {
  void loadServedModels(isvcName);
});

// --- request ----------------------------------------------------------------

const requestText = ref('');
const wrapAsQa = ref(true);
const maxTokens = ref<number | string>(DEFAULT_MAX_TOKENS);
const temperature = ref<number | string>(DEFAULT_TEMPERATURE);
const advancedOpen = ref(false);

const fillExample = (text: string) => {
  requestText.value = text;
};

/**
 * Turn the free-text request into the `Question: …\nAnswer:` shape the
 * fine-tune dataset uses, unless the user already wrote it that way or
 * switched wrapping off.
 */
const buildPrompt = (raw: string) => {
  const text = raw.trim();
  if (!wrapAsQa.value || /^Question:/i.test(text)) return text;
  return `Question: ${text}\nAnswer:`;
};

// Coerce-then-validate: the Input wrapper emits raw strings.
const numberOr = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// --- answers ----------------------------------------------------------------

interface AnswerCard {
  /** Service the answer came from — pinned cards keep it after a switch. */
  isvc: string;
  /** The raw request text (before Q/A wrapping) the answer replies to. */
  request: string;
  model: string;
  pending: boolean;
  text: string | null;
  error: string | null;
  latencyMs: number | null;
  completionTokens: number | null;
}

const answers = ref<AnswerCard[]>([]);
const asking = ref(false);

const canAsk = computed(
  () =>
    !!selectedIsvc.value &&
    servedModels.value.length > 0 &&
    requestText.value.trim().length > 0 &&
    !asking.value,
);

const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

const askOne = async (
  isvcName: string,
  model: string,
  request: string,
  prompt: string,
): Promise<AnswerCard> => {
  const started = now();
  const card: AnswerCard = {
    isvc: isvcName,
    request,
    model,
    pending: false,
    text: null,
    error: null,
    latencyMs: null,
    completionTokens: null,
  };
  try {
    const res = await postServedCompletion(isvcName, {
      model,
      prompt,
      max_tokens: Math.max(
        1,
        Math.round(numberOr(maxTokens.value, DEFAULT_MAX_TOKENS)),
      ),
      temperature: Math.max(
        0,
        numberOr(temperature.value, DEFAULT_TEMPERATURE),
      ),
      stop: STOP_SEQUENCES,
    });
    card.latencyMs = Math.round(now() - started);
    // request() returns null (and has already toasted, when enabled) on any
    // HTTP/network failure — surface that inline in the card instead.
    const data = res?.data as ServedCompletionData | undefined;
    if (!data) {
      card.error = t('hint.playground_request_failed');
      return card;
    }
    card.text = data.choices?.[0]?.text ?? '';
    const tokens = data.usage?.completion_tokens;
    card.completionTokens = typeof tokens === 'number' ? tokens : null;
  } catch (err) {
    card.latencyMs = Math.round(now() - started);
    card.error =
      err instanceof Error && err.message
        ? err.message
        : t('hint.playground_request_failed');
  }
  return card;
};

const ask = async () => {
  if (!canAsk.value) return;
  const isvcName = selectedIsvc.value;
  const models = [...servedModels.value];
  const request = requestText.value.trim();
  const prompt = buildPrompt(requestText.value);
  asking.value = true;
  answers.value = models.map((model) => ({
    isvc: isvcName,
    request,
    model,
    pending: true,
    text: null,
    error: null,
    latencyMs: null,
    completionTokens: null,
  }));
  try {
    // One request per served name, all in flight together, so the columns
    // land at roughly the same time and the latencies are comparable.
    const results = await Promise.all(
      models.map((model) => askOne(isvcName, model, request, prompt)),
    );
    // Only apply if the service hasn't changed underneath us.
    if (selectedIsvc.value === isvcName) answers.value = results;
  } finally {
    asking.value = false;
  }
};

// One to three columns; more cards than that wrap onto the next row.
const gridColsFor = (n: number) => {
  if (n <= 1) return 'grid-cols-1';
  if (n === 2) return 'grid-cols-1 md:grid-cols-2';
  return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
};

const answerGridClass = computed(() => gridColsFor(answers.value.length));

// --- pinned answers ---------------------------------------------------------

/** A finished answer frozen for comparison against a later service. */
interface PinnedAnswer {
  id: string;
  isvc: string;
  model: string;
  request: string;
  text: string;
  latencyMs: number | null;
  completionTokens: number | null;
  /** ISO timestamp of the pin, shown as a local time on the card. */
  pinnedAt: string;
}

const PINS_STORAGE_KEY = 'playground.pins';

const pinned = ref<PinnedAnswer[]>([]);

const pinnedGridClass = computed(() => gridColsFor(pinned.value.length));

// Shape check for what comes back out of storage: anything else (an older
// layout, a hand-edited value) is dropped rather than rendered half-empty.
const isPinnedAnswer = (value: unknown): value is PinnedAnswer => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.isvc === 'string' &&
    typeof v.model === 'string' &&
    typeof v.request === 'string' &&
    typeof v.text === 'string' &&
    typeof v.pinnedAt === 'string'
  );
};

// Storage access is wrapped: it is absent during SSR and throws in browsers
// that block site data, and neither must break the page — pins then simply
// live for the session.
const readPins = (): PinnedAnswer[] => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(PINS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPinnedAnswer) : [];
  } catch {
    return [];
  }
};

const writePins = (pins: PinnedAnswer[]) => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (pins.length) {
      localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pins));
    } else {
      localStorage.removeItem(PINS_STORAGE_KEY);
    }
  } catch {
    /* storage blocked — pins stay in memory for this session */
  }
};

const newPinId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Move a finished live answer into the pinned panel. */
const pinAnswer = (index: number) => {
  const card = answers.value[index];
  if (!card || card.pending || card.text === null) return;
  pinned.value = [
    ...pinned.value,
    {
      id: newPinId(),
      isvc: card.isvc,
      model: card.model,
      request: card.request,
      text: card.text,
      latencyMs: card.latencyMs,
      completionTokens: card.completionTokens,
      pinnedAt: new Date().toISOString(),
    },
  ];
  answers.value = answers.value.filter((_, i) => i !== index);
  writePins(pinned.value);
};

const unpinAnswer = (id: string) => {
  pinned.value = pinned.value.filter((pin) => pin.id !== id);
  writePins(pinned.value);
};

const clearPinned = () => {
  pinned.value = [];
  writePins(pinned.value);
};

const formatPinnedAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  pinned.value = readPins();
  void loadServices();
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <div>
        <h1 class="text-xl font-semibold">{{ t('title.playground') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('description.playground') }}
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Service + served names -->
      <div class="grid gap-4 md:grid-cols-[minmax(0,380px)_1fr] items-start">
        <div class="space-y-2">
          <Label for="pg-service">{{ t('label.inference_service') }}</Label>
          <div class="flex items-center gap-2">
            <Select v-model="selectedIsvc">
              <SelectTrigger id="pg-service" class="w-full">
                <SelectValue
                  :placeholder="t('placeholder.select_inference_service')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="svc in services"
                  :key="svc.isvc_name"
                  :value="svc.isvc_name"
                >
                  {{ svc.isvc_name }}
                  <span
                    v-if="(svc.status || '').toLowerCase() !== 'ready'"
                    class="ml-1 text-xs text-muted-foreground"
                  >
                    ({{ svc.status }})
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <!-- Services change between the two halves of a comparison. -->
            <Button
              type="button"
              variant="outline"
              size="icon"
              class="shrink-0 cursor-pointer"
              :disabled="servicesLoading"
              :title="t('action.refresh')"
              :aria-label="t('action.refresh')"
              data-testid="refresh-services"
              @click="loadServices"
            >
              <Spinner v-if="servicesLoading" class="size-4" />
              <Icon v-else name="lucide:refresh-cw" class="size-4" />
            </Button>
          </div>
          <p
            v-if="!servicesLoading && services.length === 0"
            class="text-sm text-muted-foreground"
          >
            {{ t('hint.playground_no_services') }}
          </p>
          <p
            v-else-if="noneReady"
            class="text-sm text-muted-foreground"
            data-testid="none-ready-hint"
          >
            {{ t('hint.playground_none_ready') }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>{{ t('label.served_models') }}</Label>
          <div class="flex flex-wrap items-center gap-2 min-h-9">
            <Spinner v-if="servedModelsLoading" class="size-4" />
            <template v-else-if="servedModels.length">
              <span
                v-for="name in servedModels"
                :key="name"
                class="inline-flex items-center rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs"
                data-testid="served-model"
              >
                {{ name }}
              </span>
            </template>
            <p v-else class="text-sm text-muted-foreground">
              {{
                selectedIsvc
                  ? t('hint.playground_no_models')
                  : t('hint.playground_select_service')
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Request -->
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Label for="pg-request">{{ t('label.request') }}</Label>
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-muted-foreground mr-1">
              {{ t('label.examples') }}:
            </span>
            <button
              v-for="(example, i) in EXAMPLE_REQUESTS"
              :key="i"
              type="button"
              class="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer max-w-[260px] truncate"
              :title="example"
              data-testid="example-chip"
              @click="fillExample(example)"
            >
              {{ example }}
            </button>
          </div>
        </div>
        <Textarea
          id="pg-request"
          v-model="requestText"
          :rows="4"
          :placeholder="t('placeholder.playground_request')"
          class="font-mono text-sm"
        />
        <div class="flex flex-wrap items-center gap-4">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox v-model="wrapAsQa" data-testid="wrap-qa" />
            {{ t('label.wrap_qa') }}
          </label>

          <Collapsible v-model:open="advancedOpen" class="flex-1 min-w-[240px]">
            <CollapsibleTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-xs cursor-pointer"
              >
                <Icon
                  :name="
                    advancedOpen
                      ? 'lucide:chevron-down'
                      : 'lucide:chevron-right'
                  "
                  class="size-3.5 mr-1"
                />
                {{ t('label.advanced') }}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="grid grid-cols-2 gap-3 max-w-md mt-2">
                <div class="space-y-1">
                  <Label for="pg-max-tokens" class="text-xs">
                    {{ t('label.max_tokens') }}
                  </Label>
                  <Input
                    id="pg-max-tokens"
                    v-model="maxTokens"
                    type="number"
                    min="1"
                    step="1"
                  />
                </div>
                <div class="space-y-1">
                  <Label for="pg-temperature" class="text-xs">
                    {{ t('label.temperature') }}
                  </Label>
                  <Input
                    id="pg-temperature"
                    v-model="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            :disabled="!canAsk"
            class="ml-auto cursor-pointer"
            data-testid="ask"
            @click="ask"
          >
            <Spinner v-if="asking" class="size-3 mr-2" />
            <Icon v-else name="lucide:send" class="size-4 mr-2" />
            {{ t('action.ask') }}
          </Button>
        </div>
      </div>

      <!-- Pinned answers (left) next to the live answers (right). Stacked on
           narrow screens, side by side from xl up. -->
      <div
        v-if="pinned.length || answers.length"
        class="flex flex-col xl:flex-row gap-4 items-start"
      >
        <section
          v-if="pinned.length"
          class="w-full xl:w-auto xl:max-w-[60%] shrink-0 rounded-lg border border-dashed p-3 space-y-3"
          data-testid="pinned-panel"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="flex items-center gap-1.5 text-sm font-medium">
                <Icon name="lucide:pin" class="size-4" />
                {{ t('label.pinned') }} ({{ pinned.length }})
              </span>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ t('hint.playground_pinned') }}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-xs cursor-pointer"
              data-testid="clear-pinned"
              @click="clearPinned"
            >
              <Icon name="lucide:x" class="size-3.5 mr-1" />
              {{ t('action.clear_pinned') }}
            </Button>
          </div>

          <div :class="['grid gap-3', pinnedGridClass]">
            <Card
              v-for="pin in pinned"
              :key="pin.id"
              class="min-w-0 bg-muted/20"
              data-testid="pinned-card"
            >
              <CardHeader class="pb-2">
                <CardTitle class="flex flex-col gap-1 text-sm">
                  <span class="flex items-center justify-between gap-2">
                    <span
                      class="font-mono truncate"
                      :title="pin.model"
                      data-testid="pinned-model"
                    >
                      {{ pin.model }}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      class="size-6 shrink-0 cursor-pointer"
                      :title="t('action.unpin')"
                      :aria-label="t('action.unpin')"
                      data-testid="unpin"
                      @click="unpinAnswer(pin.id)"
                    >
                      <Icon name="lucide:pin-off" class="size-3.5" />
                    </Button>
                  </span>
                  <span
                    class="flex flex-wrap items-center gap-x-2 text-xs font-normal text-muted-foreground"
                  >
                    <span
                      class="inline-flex items-center gap-1 truncate"
                      :title="pin.isvc"
                      data-testid="pinned-service"
                    >
                      <Icon name="lucide:server" class="size-3 shrink-0" />
                      {{ pin.isvc }}
                    </span>
                    <span
                      v-if="formatPinnedAt(pin.pinnedAt)"
                      :title="`${t('label.pinned_at')}: ${pin.pinnedAt}`"
                      data-testid="pinned-time"
                    >
                      {{ formatPinnedAt(pin.pinnedAt) }}
                    </span>
                    <span v-if="pin.latencyMs !== null">
                      {{ t('label.latency') }}: {{ pin.latencyMs }} ms
                    </span>
                    <span v-if="pin.completionTokens !== null">
                      {{ t('label.completion_tokens') }}:
                      {{ pin.completionTokens }}
                    </span>
                  </span>
                  <span
                    class="block truncate text-xs font-normal text-muted-foreground"
                    :title="pin.request"
                    data-testid="pinned-request"
                  >
                    {{ pin.request }}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre
                  class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed max-h-[480px] overflow-auto rounded-md bg-muted/40 p-3"
                  data-testid="pinned-text"
                  >{{ pin.text }}</pre
                >
              </CardContent>
            </Card>
          </div>
        </section>

        <!-- Live answers: one column per served model name -->
        <div
          v-if="answers.length"
          :class="['flex-1 min-w-0 w-full grid gap-4', answerGridClass]"
        >
          <Card
            v-for="(card, index) in answers"
            :key="card.model"
            class="min-w-0"
            data-testid="answer-card"
          >
            <CardHeader class="pb-2">
              <CardTitle
                class="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span class="font-mono truncate" :title="card.model">
                  {{ card.model }}
                </span>
                <span
                  v-if="!card.pending"
                  class="flex items-center gap-2 text-xs font-normal text-muted-foreground"
                >
                  <span v-if="card.latencyMs !== null" data-testid="latency">
                    {{ t('label.latency') }}: {{ card.latencyMs }} ms
                  </span>
                  <span
                    v-if="card.completionTokens !== null"
                    data-testid="completion-tokens"
                  >
                    {{ t('label.completion_tokens') }}:
                    {{ card.completionTokens }}
                  </span>
                  <Button
                    v-if="card.text !== null"
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="h-6 px-2 text-xs cursor-pointer"
                    data-testid="pin"
                    @click="pinAnswer(index)"
                  >
                    <Icon name="lucide:pin" class="size-3.5 mr-1" />
                    {{ t('action.pin') }}
                  </Button>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                v-if="card.pending"
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Spinner class="size-3" />
                {{ t('hint.playground_waiting') }}
              </div>
              <p
                v-else-if="card.error"
                class="text-sm text-destructive flex items-start gap-1"
                data-testid="answer-error"
              >
                <Icon
                  name="lucide:alert-circle"
                  class="size-4 mt-0.5 shrink-0"
                />
                <span>{{ card.error }}</span>
              </p>
              <pre
                v-else
                class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed max-h-[480px] overflow-auto rounded-md bg-muted/40 p-3"
                data-testid="answer-text"
                >{{ card.text }}</pre
              >
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
