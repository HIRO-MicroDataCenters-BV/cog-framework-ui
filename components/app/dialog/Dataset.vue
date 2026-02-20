<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      class="sm:max-w-[780px] gap-0 p-0 overflow-hidden"
      @interact-outside.prevent
    >
      <!-- Header -->
      <div class="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold">
            {{ t('title.add_dataset') }}
          </DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground">
            {{ t('dialog.add_dataset_description') }}
          </DialogDescription>
        </DialogHeader>

        <!-- Step Indicator -->
        <nav class="flex items-center mt-5" aria-label="Progress">
          <template v-for="(step, i) in stepsMeta" :key="step.id">
            <button
              type="button"
              class="flex items-center gap-2 text-sm transition-colors whitespace-nowrap"
              :class="[
                i <= currentStep
                  ? 'text-foreground'
                  : 'text-muted-foreground/60',
              ]"
              :disabled="i > furthestStep"
              @click="goToStep(i)"
            >
              <span
                class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all duration-200"
                :class="stepCircleClass(i)"
              >
                <Icon
                  v-if="i < currentStep"
                  name="lucide:check"
                  class="w-3.5 h-3.5"
                />
                <span v-else>{{ i + 1 }}</span>
              </span>
              <span class="hidden sm:inline font-medium">
                {{ step.label }}
              </span>
            </button>
            <Separator
              v-if="i < stepsMeta.length - 1"
              class="flex-1 mx-3 transition-colors duration-200"
              :class="i < currentStep ? 'bg-primary!' : 'bg-border!'"
            />
          </template>
        </nav>
      </div>

      <Separator />

      <!-- Step Content -->
      <div class="px-6 py-6 min-h-[340px] max-h-[420px] overflow-y-auto">
        <form @submit.prevent>
          <!-- Step 0: Type Selection -->
          <div v-show="currentStep === 0" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                v-for="dtype in datasetTypesRow1"
                :key="dtype.value"
                type="button"
                class="group relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="
                  selectedType === dtype.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border'
                "
                @click="selectType(dtype.value)"
              >
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
                  :class="
                    selectedType === dtype.value
                      ? typeIconColors[dtype.color].selected
                      : typeIconColors[dtype.color].default
                  "
                >
                  <Icon :name="dtype.icon" class="h-5 w-5" />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ dtype.label }}</p>
                  <p class="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {{ dtype.description }}
                  </p>
                </div>
                <div
                  v-if="selectedType === dtype.value"
                  class="absolute top-2.5 right-2.5"
                >
                  <div
                    class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Icon name="lucide:check" class="h-3 w-3" />
                  </div>
                </div>
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-start-2 flex justify-center">
                <button
                  v-for="dtype in datasetTypesRow2"
                  :key="dtype.value"
                  type="button"
                  class="group relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full sm:w-auto sm:min-w-[200px]"
                  :class="
                    selectedType === dtype.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border'
                  "
                  @click="selectType(dtype.value)"
                >
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
                    :class="
                      selectedType === dtype.value
                        ? typeIconColors[dtype.color].selected
                        : typeIconColors[dtype.color].default
                    "
                  >
                    <Icon :name="dtype.icon" class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">{{ dtype.label }}</p>
                    <p
                      class="mt-1 text-xs text-muted-foreground leading-relaxed"
                    >
                      {{ dtype.description }}
                    </p>
                  </div>
                  <div
                    v-if="selectedType === dtype.value"
                    class="absolute top-2.5 right-2.5"
                  >
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Icon name="lucide:check" class="h-3 w-3" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Step 1: Metadata -->
          <div v-show="currentStep === 1" class="space-y-5">
            <FormField v-slot="{ componentField }" name="metadata.name">
              <FormItem>
                <FormLabel>{{ t('label.name') }}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    v-bind="componentField"
                    :placeholder="t('placeholder.dataset_name')"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="metadata.description">
              <FormItem>
                <FormLabel>{{ t('label.description') }}</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    :placeholder="t('placeholder.dataset_description')"
                    class="resize-none"
                    :rows="3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="dataset_type">
              <FormItem>
                <FormLabel>{{ t('label.dataset_type') }}</FormLabel>
                <Select v-bind="componentField">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('placeholder.dataset_type')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="0">{{ t('label.train') }}</SelectItem>
                    <SelectItem :value="1">
                      {{ t('label.inference') }}
                    </SelectItem>
                    <SelectItem :value="2">
                      {{ t('label.train_and_inference') }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Step 2: Source Settings -->
          <div v-show="currentStep === 2">
            <!-- File Source -->
            <div v-if="selectedType === 'file'" class="space-y-5">
              <FormField name="source_settings.dataset_file">
                <FormItem>
                  <button
                    type="button"
                    class="w-full rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    @click="triggerFileInput"
                  >
                    <div
                      class="flex flex-col items-center gap-3 text-muted-foreground"
                    >
                      <div
                        class="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
                      >
                        <Icon
                          name="lucide:cloud-upload"
                          class="h-6 w-6 text-muted-foreground"
                        />
                      </div>
                      <p class="text-sm font-medium text-foreground">
                        {{ selectedFileName || 'Upload Dataset File' }}
                      </p>
                    </div>
                  </button>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept=".csv,.json,.xlsx,.xls"
                    class="hidden"
                    @change="handleFileChange"
                  />
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- Table Source -->
            <div v-if="selectedType === 'table'" class="space-y-5">
              <FormField
                v-slot="{ componentField }"
                name="source_settings.db_url"
              >
                <FormItem>
                  <FormLabel>{{ t('label.db_url') }}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-bind="componentField"
                      :placeholder="t('placeholder.db_url')"
                    />
                  </FormControl>
                  <FormDescription>
                    {{ getDbUrlHint(componentField.modelValue as string) }}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div class="grid grid-cols-2 gap-4">
                <FormField
                  v-slot="{ componentField }"
                  name="source_settings.table_name"
                >
                  <FormItem>
                    <FormLabel>{{ t('label.table_name') }}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        :placeholder="t('placeholder.table_name')"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField
                  v-slot="{ componentField }"
                  name="source_settings.selected_fields"
                >
                  <FormItem>
                    <FormLabel>{{ t('label.selected_fields') }}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        :placeholder="t('placeholder.selected_fields')"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                @click="testConnection"
              >
                <Icon name="lucide:plug-zap" class="h-4 w-4 mr-1.5" />
                {{ t('action.test_connection') }}
              </Button>
            </div>

            <!-- Time Series Source -->
            <div v-if="selectedType === 'time_series'" class="space-y-5">
              <FormField
                v-slot="{ componentField }"
                name="source_settings.connection_type"
              >
                <FormItem>
                  <FormLabel>{{ t('label.connection_type') }}</FormLabel>
                  <FormControl>
                    <Textarea
                      v-bind="componentField"
                      :placeholder="t('placeholder.connection_type')"
                      class="font-mono text-xs resize-none"
                      :rows="3"
                    />
                  </FormControl>
                  <FormDescription>
                    {{ t('hint.json_format') }}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField
                v-slot="{ componentField }"
                name="source_settings.connection_parameter"
              >
                <FormItem>
                  <FormLabel>{{ t('label.connection_parameter') }}</FormLabel>
                  <FormControl>
                    <Textarea
                      v-bind="componentField"
                      :placeholder="t('placeholder.connection_parameter')"
                      class="font-mono text-xs resize-none"
                      :rows="3"
                    />
                  </FormControl>
                  <FormDescription>
                    {{ t('hint.json_format') }}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField
                v-slot="{ componentField }"
                name="source_settings.metric_list"
              >
                <FormItem>
                  <FormLabel>{{ t('label.metric_list') }}</FormLabel>
                  <FormControl>
                    <Textarea
                      v-bind="componentField"
                      :placeholder="t('placeholder.metric_list')"
                      class="font-mono text-xs resize-none"
                      :rows="3"
                    />
                  </FormControl>
                  <FormDescription>
                    {{ t('hint.json_format') }}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField
                v-slot="{ componentField }"
                name="source_settings.feature_list"
              >
                <FormItem>
                  <FormLabel>{{ t('label.feature_list') }}</FormLabel>
                  <FormControl>
                    <Textarea
                      v-bind="componentField"
                      :placeholder="t('placeholder.feature_list')"
                      class="font-mono text-xs resize-none"
                      :rows="3"
                    />
                  </FormControl>
                  <FormDescription>
                    {{ t('hint.json_format') }}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- Data Stream Source -->
            <div v-if="selectedType === 'data_stream'" class="space-y-5">
              <!-- Broker Section -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 text-sm font-medium">
                  <Icon
                    name="lucide:server"
                    class="h-4 w-4 text-muted-foreground"
                  />
                  Broker Configuration
                </div>

                <FormField
                  v-slot="{ componentField }"
                  name="source_settings.broker_selection"
                >
                  <FormItem class="space-y-2">
                    <FormControl>
                      <RadioGroup
                        class="flex gap-4"
                        v-bind="componentField"
                        orientation="horizontal"
                      >
                        <div class="flex items-center space-x-2">
                          <RadioGroupItem value="existing" />
                          <FormLabel class="font-normal cursor-pointer">
                            Existing Broker
                          </FormLabel>
                        </div>
                        <div class="flex items-center space-x-2">
                          <RadioGroupItem value="new" />
                          <FormLabel class="font-normal cursor-pointer">
                            New Broker
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                </FormField>

                <!-- Existing Broker -->
                <div v-if="brokerSelection === 'existing'">
                  <FormField
                    v-slot="{ componentField }"
                    name="source_settings.broker_id"
                  >
                    <FormItem>
                      <FormLabel>{{ t('label.broker_name') }}</FormLabel>
                      <Select v-bind="componentField">
                        <SelectTrigger>
                          <SelectValue
                            :placeholder="t('placeholder.select_broker')"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="opt in brokerOptions"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>

                <!-- New Broker -->
                <div v-else class="space-y-4">
                  <FormField
                    v-slot="{ componentField }"
                    name="source_settings.broker_name"
                  >
                    <FormItem>
                      <FormLabel>{{ t('label.broker_name') }}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          v-bind="componentField"
                          :placeholder="t('placeholder.broker_name')"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <div class="grid grid-cols-2 gap-4 items-start">
                    <FormField
                      v-slot="{ componentField }"
                      name="source_settings.broker_ip_address"
                    >
                      <FormItem>
                        <FormLabel>
                          {{ t('label.broker_ip_address') }}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            v-bind="componentField"
                            :placeholder="t('placeholder.broker_ip_address')"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <FormField
                      v-slot="{ componentField }"
                      name="source_settings.broker_port"
                    >
                      <FormItem>
                        <FormLabel>{{ t('label.broker_port') }}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            v-bind="componentField"
                            :placeholder="t('placeholder.broker_port')"
                            class="broker-port-input"
                            min="0"
                            max="65535"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </div>
                </div>
              </div>

              <Separator />

              <!-- Topic Section -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 text-sm font-medium">
                  <Icon
                    name="lucide:message-square"
                    class="h-4 w-4 text-muted-foreground"
                  />
                  Topic Configuration
                </div>

                <FormField
                  v-slot="{ componentField }"
                  name="source_settings.topic_selection"
                >
                  <FormItem class="space-y-2">
                    <FormControl>
                      <RadioGroup
                        class="flex gap-4"
                        v-bind="componentField"
                        orientation="horizontal"
                      >
                        <div
                          class="flex items-center space-x-2"
                          :class="{
                            'opacity-50 cursor-not-allowed':
                              brokerSelection === 'new',
                          }"
                        >
                          <RadioGroupItem
                            value="existing"
                            :disabled="brokerSelection === 'new'"
                          />
                          <FormLabel
                            class="font-normal"
                            :class="
                              brokerSelection === 'new'
                                ? 'cursor-not-allowed'
                                : 'cursor-pointer'
                            "
                          >
                            Existing Topic
                          </FormLabel>
                        </div>
                        <div class="flex items-center space-x-2">
                          <RadioGroupItem value="new" />
                          <FormLabel class="font-normal cursor-pointer">
                            New Topic
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <p
                      v-if="brokerSelection === 'new'"
                      class="text-xs text-muted-foreground"
                    >
                      New broker requires a new topic
                    </p>
                  </FormItem>
                </FormField>

                <!-- Existing Topic -->
                <div v-if="topicSelection === 'existing'">
                  <FormField
                    v-slot="{ componentField }"
                    name="source_settings.topic_id"
                  >
                    <FormItem>
                      <FormLabel>{{ t('label.topic_name') }}</FormLabel>
                      <Select v-bind="componentField">
                        <SelectTrigger>
                          <SelectValue
                            :placeholder="t('placeholder.select_topic')"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="opt in topicOptions"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>

                <!-- New Topic -->
                <div v-else class="space-y-4">
                  <FormField
                    v-slot="{ componentField }"
                    name="source_settings.topic_name"
                  >
                    <FormItem>
                      <FormLabel>{{ t('label.topic_name') }}</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          v-bind="componentField"
                          :placeholder="t('placeholder.topic_name')"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField
                    v-slot="{ componentField }"
                    name="source_settings.topic_schema"
                  >
                    <FormItem>
                      <FormLabel>{{ t('label.topic_schema') }}</FormLabel>
                      <FormControl>
                        <Textarea
                          v-bind="componentField"
                          :placeholder="t('placeholder.topic_schema')"
                          class="font-mono text-xs resize-none"
                          :rows="3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </div>

              <Separator />

              <!-- Data Source Type -->
              <FormField v-slot="{ componentField }" name="data_source_type">
                <FormItem>
                  <FormLabel>{{ t('label.data_source_type') }}</FormLabel>
                  <Select v-bind="componentField">
                    <SelectTrigger>
                      <SelectValue
                        :placeholder="t('placeholder.data_source_type')"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="10">Kafka</SelectItem>
                      <SelectItem :value="11">NATS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
          </div>

          <!-- Step 3: Review -->
          <div v-show="currentStep === 3" class="space-y-5">
            <!-- General Info -->
            <div>
              <h4
                class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
              >
                General Information
              </h4>
              <div class="rounded-lg border bg-muted/30 divide-y">
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-sm text-muted-foreground">
                    {{ t('label.type') }}
                  </span>
                  <Badge variant="secondary">{{ displayType }}</Badge>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-sm text-muted-foreground">
                    {{ t('label.name') }}
                  </span>
                  <span class="text-sm font-medium">
                    {{ form.values.metadata?.name || '—' }}
                  </span>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-sm text-muted-foreground">
                    {{ t('label.description') }}
                  </span>
                  <span
                    class="text-sm font-medium max-w-[280px] truncate text-right"
                  >
                    {{ form.values.metadata?.description || '—' }}
                  </span>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-sm text-muted-foreground">
                    {{ t('label.dataset_type') }}
                  </span>
                  <span class="text-sm font-medium">
                    {{ displayDatasetType }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Source Info -->
            <div>
              <h4
                class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
              >
                Source Configuration
              </h4>
              <div class="rounded-lg border bg-muted/30 divide-y">
                <!-- File review -->
                <template v-if="selectedType === 'file'">
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.data_source') }}
                    </span>
                    <span class="text-sm font-medium">
                      {{ fileDisplayName }}
                    </span>
                  </div>
                </template>

                <!-- Table review -->
                <template v-if="selectedType === 'table'">
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.db_url') }}
                    </span>
                    <span
                      class="text-sm font-medium font-mono max-w-[280px] truncate"
                    >
                      {{ sourceSettings?.db_url || '—' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.table_name') }}
                    </span>
                    <span class="text-sm font-medium">
                      {{ sourceSettings?.table_name || '—' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.selected_fields') }}
                    </span>
                    <span class="text-sm font-medium">
                      {{ sourceSettings?.selected_fields || '—' }}
                    </span>
                  </div>
                </template>

                <!-- Stream review -->
                <template v-if="selectedType === 'data_stream'">
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.data_source_type') }}
                    </span>
                    <Badge variant="outline">
                      {{
                        form.values.data_source_type === 10 ? 'Kafka' : 'NATS'
                      }}
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground"> Broker </span>
                    <span class="text-sm font-medium">
                      {{ reviewBrokerDisplay }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground"> Topic </span>
                    <span class="text-sm font-medium">
                      {{ reviewTopicDisplay }}
                    </span>
                  </div>
                </template>

                <!-- Time Series review -->
                <template v-if="selectedType === 'time_series'">
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.connection_type') }}
                    </span>
                    <span
                      class="text-sm font-medium font-mono max-w-[280px] truncate"
                    >
                      {{ sourceSettings?.connection_type ? 'Configured' : '—' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.connection_parameter') }}
                    </span>
                    <span
                      class="text-sm font-medium font-mono max-w-[280px] truncate"
                    >
                      {{
                        sourceSettings?.connection_parameter
                          ? 'Configured'
                          : '—'
                      }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.metric_list') }}
                    </span>
                    <span
                      class="text-sm font-medium font-mono max-w-[280px] truncate"
                    >
                      {{ sourceSettings?.metric_list ? 'Configured' : '—' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3">
                    <span class="text-sm text-muted-foreground">
                      {{ t('label.feature_list') }}
                    </span>
                    <span
                      class="text-sm font-medium font-mono max-w-[280px] truncate"
                    >
                      {{ sourceSettings?.feature_list ? 'Configured' : '—' }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Separator />

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4">
        <Button variant="ghost" size="sm" @click="handleClose">
          {{ t('action.cancel') }}
        </Button>
        <div class="flex gap-2">
          <Button
            v-if="currentStep > 0"
            variant="outline"
            size="sm"
            @click="prevStep"
          >
            <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
            {{ t('action.back') }}
          </Button>
          <Button
            v-if="currentStep < totalSteps - 1"
            size="sm"
            :disabled="!canProceed"
            @click="nextStep"
          >
            {{ t('action.next') }}
            <Icon name="lucide:arrow-right" class="h-4 w-4 ml-1" />
          </Button>
          <Button
            v-else
            size="sm"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <Icon
              v-if="isSubmitting"
              name="lucide:loader-2"
              class="h-4 w-4 mr-1 animate-spin"
            />
            {{ t('action.submit') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { datasetFormSchema } from '@/schemas/dataset-form.schema';
import { useApi } from '@/composables/api';
import type { FormValues } from '~/types/form.types';

const { t } = useI18n();
const toaster = useToaster();
const { getBrokerDetails, getTopicDetails } = useApi();
const { submitDatasetForm } = useDatasetForm();

// ──── Props / Emits ────
const props = withDefaults(defineProps<{ open?: boolean }>(), { open: false });
const emit = defineEmits<{
  (e: 'on-close'): void;
}>();

// ──── State ────
const currentStep = ref(0);
const furthestStep = ref(0);
const isSubmitting = ref(false);
const totalSteps = 4;

// ──── Step Metadata ────
const stepsMeta = computed(() => [
  { id: 'type', label: t('step.type') },
  { id: 'metadata', label: t('step.metadata') },
  { id: 'source', label: t('step.source_settings') },
  { id: 'review', label: t('step.review') },
]);

// ──── Dataset Type Options (Row 1: File, Table, Data Stream | Row 2: Time Series in between) ────
const typeIconColors: Record<string, { default: string; selected: string }> = {
  file: {
    default: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200/80',
    selected: 'bg-blue-500 text-white',
  },
  table: {
    default: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200/80',
    selected: 'bg-emerald-500 text-white',
  },
  data_stream: {
    default: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200/80',
    selected: 'bg-amber-500 text-white',
  },
  time_series: {
    default: 'bg-violet-100 text-violet-600 group-hover:bg-violet-200/80',
    selected: 'bg-violet-500 text-white',
  },
};
const datasetTypesRow1 = computed(() => [
  {
    value: 'file' as const,
    label: t('label.file'),
    description: t('label_subtitle.file'),
    icon: 'lucide:file-up',
    color: 'file',
  },
  {
    value: 'table' as const,
    label: t('label.table'),
    description: t('label_subtitle.table'),
    icon: 'lucide:database',
    color: 'table',
  },
  {
    value: 'data_stream' as const,
    label: t('label.data_stream'),
    description: t('label_subtitle.data_stream'),
    icon: 'lucide:radio',
    color: 'data_stream',
  },
]);
const datasetTypesRow2 = computed(() => [
  {
    value: 'time_series' as const,
    label: t('label.time_series'),
    description: t('label_subtitle.time_series'),
    icon: 'lucide:chart-line',
    color: 'time_series',
  },
]);

// ──── Form Setup ────
const form = useForm<FormValues>({
  validationSchema: datasetFormSchema,
  initialValues: {
    source_settings: {
      broker_selection: 'existing',
      topic_selection: 'existing',
    },
  },
});

// ──── Computed Helpers ────
const selectedType = computed(() => form.values.type as string | undefined);
const sourceSettings = computed(
  () => form.values.source_settings as Record<string, unknown> | undefined,
);
const brokerSelection = computed(
  () => (sourceSettings.value?.broker_selection as string) || 'existing',
);
const topicSelection = computed(
  () => (sourceSettings.value?.topic_selection as string) || 'existing',
);

const displayType = computed(() => {
  const labels: Record<string, string> = {
    file: t('label.file'),
    table: t('label.table'),
    data_stream: t('label.data_stream'),
    time_series: t('label.time_series'),
  };
  return selectedType.value
    ? labels[selectedType.value] || selectedType.value
    : '—';
});

const displayDatasetType = computed(() => {
  const val = form.values.dataset_type;
  const labels: Record<number, string> = {
    0: t('label.train'),
    1: t('label.inference'),
    2: t('label.train_and_inference'),
  };
  return typeof val === 'number' ? labels[val] || '—' : '—';
});

const fileDisplayName = computed(() => {
  const file = sourceSettings.value?.dataset_file;
  if (
    file &&
    typeof file === 'object' &&
    'name' in (file as Record<string, unknown>)
  ) {
    return (file as { name: string }).name;
  }
  return '—';
});

const reviewBrokerDisplay = computed(() => {
  if (brokerSelection.value === 'existing') {
    const id = sourceSettings.value?.broker_id;
    const opt = brokerOptions.value.find((o) => o.value === id);
    return opt?.label || `Broker #${id}`;
  }
  const name = sourceSettings.value?.broker_name || '';
  const ip = sourceSettings.value?.broker_ip_address || '';
  const port = sourceSettings.value?.broker_port || '';
  return `${name} (${ip}:${port})`;
});

const reviewTopicDisplay = computed(() => {
  if (topicSelection.value === 'existing') {
    const id = sourceSettings.value?.topic_id;
    const opt = topicOptions.value.find((o) => o.value === id);
    return opt?.label || `Topic #${id}`;
  }
  return (sourceSettings.value?.topic_name as string) || '—';
});

// ──── Step Validation ────
const stepFieldNames: Record<number, () => string[]> = {
  0: () => [], // Type is validated via canProceed (card selection, no FormField)
  1: () => ['metadata.name', 'metadata.description', 'dataset_type'],
  2: () => {
    if (selectedType.value === 'file') {
      return ['source_settings.dataset_file'];
    }
    if (selectedType.value === 'table') {
      return [
        'source_settings.db_url',
        'source_settings.table_name',
        'source_settings.selected_fields',
      ];
    }
    if (selectedType.value === 'data_stream') {
      const fields = ['data_source_type'];
      if (brokerSelection.value === 'existing') {
        fields.push('source_settings.broker_id');
      } else {
        fields.push(
          'source_settings.broker_name',
          'source_settings.broker_ip_address',
          'source_settings.broker_port',
        );
      }
      if (topicSelection.value === 'existing') {
        fields.push('source_settings.topic_id');
      } else {
        fields.push('source_settings.topic_name');
      }
      return fields;
    }
    if (selectedType.value === 'time_series') {
      return [
        'source_settings.connection_type',
        'source_settings.connection_parameter',
        'source_settings.metric_list',
        'source_settings.feature_list',
      ];
    }
    return [];
  },
  3: () => [],
};

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return !!selectedType.value;
  }
  return true;
});

const validateCurrentStep = async (): Promise<boolean> => {
  const fields = stepFieldNames[currentStep.value]?.() || [];
  if (fields.length === 0) return true;
  const results = await Promise.all(fields.map((f) => form.validateField(f)));
  return results.every((r) => r.valid);
};

// ──── Step Navigation ────
const selectType = (type: string) => {
  form.setFieldValue('type', type);
};

const goToStep = (step: number) => {
  if (step <= furthestStep.value) {
    currentStep.value = step;
  }
};

const nextStep = async () => {
  const valid = await validateCurrentStep();
  if (!valid) return;

  // Blur active element to prevent focus issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (currentStep.value < totalSteps - 1) {
    currentStep.value++;
    if (currentStep.value > furthestStep.value) {
      furthestStep.value = currentStep.value;
    }
    // Fetch broker/topic details when entering source step for data_stream
    if (
      currentStep.value === 2 &&
      selectedType.value === 'data_stream' &&
      !hasFetchedBrokerTopicDetails.value
    ) {
      fetchBrokerAndTopicDetails();
      hasFetchedBrokerTopicDetails.value = true;
    }
  }
};

const prevStep = () => {
  // Blur active element to prevent focus issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// ──── Step Indicator Styles ────
const stepCircleClass = (index: number) => {
  if (index < currentStep.value) {
    return 'bg-primary text-primary-foreground';
  }
  if (index === currentStep.value) {
    return 'bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-2 ring-offset-background';
  }
  return 'bg-muted text-muted-foreground border border-border';
};

// ──── Broker/Topic Fetch ────
interface BrokerDetail {
  id: number;
  broker_name: string;
  broker_ip: string;
  broker_port: number;
  creation_date: string;
}
interface TopicDetail {
  id: number;
  topic_name: string;
  topic_schema: string | Record<string, unknown>;
  broker_id: number;
  creation_date: string;
}

const brokerOptions = ref<{ label: string; value: string | number }[]>([]);
const topicOptions = ref<{ label: string; value: string | number }[]>([]);
const hasFetchedBrokerTopicDetails = ref(false);

const fetchBrokerAndTopicDetails = async () => {
  try {
    const brokers = (await getBrokerDetails()) as {
      data?: BrokerDetail[];
    } | null;
    if (brokers?.data) {
      brokerOptions.value = brokers.data.map((b) => ({
        label: `${b.broker_name} (${b.broker_ip}:${b.broker_port})`,
        value: b.id,
      }));
    }
    const topics = (await getTopicDetails()) as { data?: TopicDetail[] } | null;
    if (topics?.data) {
      topicOptions.value = topics.data.map((topic) => ({
        label: topic.topic_name,
        value: topic.id,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch broker/topic details:', error);
  }
};

// ──── Test Connection ────
const testConnection = async () => {
  const dbUrl = sourceSettings.value?.db_url;
  const tableName = sourceSettings.value?.table_name;

  if (!dbUrl) {
    toaster.show('error', 'required_field');
    return;
  }

  try {
    const config = useRuntimeConfig();
    const baseURL = config.app.baseURL || '/';
    const response = await fetch(`${baseURL}api/dataset/test-db-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_url: dbUrl, table_name: tableName }),
    });
    const result = await response.json();

    if (result.success) {
      if (tableName) {
        toaster.show(
          result.data?.tableExists ? 'success' : 'warning',
          'test_connection',
        );
      } else {
        toaster.show('success', 'test_connection_no_table');
      }
    } else {
      toaster.show('error', 'connection_failed');
    }
  } catch (e) {
    console.error('Connection test error:', e);
    toaster.show('error', 'connection_failed');
  }
};

// ──── File Handler ────
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref('');

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  form.setFieldValue('source_settings.dataset_file', file || null);
  selectedFileName.value = file?.name || '';
};

// ──── DB URL Hint ────
const getDbUrlHint = (url: string | undefined): string => {
  if (!url) return t('hint.db_url_default');
  const protocol = url.split(':')[0].toLowerCase();
  switch (protocol) {
    case 'postgresql':
    case 'postgres':
      return t('hint.db_url_postgresql');
    case 'mysql':
      return t('hint.db_url_mysql');
    case 'sqlite':
      return t('hint.db_url_sqlite');
    case 'mongodb':
      return t('hint.db_url_mongodb');
    default:
      return t('hint.db_url_default');
  }
};

// ──── Submit ────
const handleSubmit = async () => {
  // Blur active element to prevent focus issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  isSubmitting.value = true;
  try {
    const response = await submitDatasetForm(form.values as FormValues);
    if (response && !('detail' in response)) {
      resetAndClose();
    }
  } catch (error) {
    console.error('Error submitting dataset form:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// ──── Dialog lifecycle ────
const resetForm = () => {
  currentStep.value = 0;
  furthestStep.value = 0;
  isSubmitting.value = false;
  hasFetchedBrokerTopicDetails.value = false;
  selectedFileName.value = '';
  form.resetForm({
    values: {
      source_settings: {
        broker_selection: 'existing',
        topic_selection: 'existing',
      },
    },
  });
};

const handleClose = () => {
  // Blur active element to prevent focus issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  resetForm();
  emit('on-close');
};

const resetAndClose = () => {
  resetForm();
  emit('on-close');
};

const onOpenChange = (open: boolean) => {
  if (!open) {
    handleClose();
  }
};

// Sync open prop
const open = computed(() => props.open);

// Reset when dialog closes externally
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  },
);

// When "New Broker" is selected, force "New Topic" selection
watch(
  () => sourceSettings.value?.broker_selection,
  (newValue) => {
    if (newValue === 'new') {
      form.setFieldValue('source_settings.topic_selection', 'new');
    }
  },
);
</script>

<style scoped>
:deep(.broker-port-input)::-webkit-inner-spin-button,
:deep(.broker-port-input)::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
:deep(.broker-port-input) {
  -moz-appearance: textfield;
}
</style>
