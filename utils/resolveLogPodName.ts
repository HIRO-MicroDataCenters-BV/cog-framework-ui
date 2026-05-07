/**
 * Resolves the actual k8s pod name for fetching logs of a KFP v1.8 / v2beta1
 * pipeline task. Pure function so it can be unit-tested in isolation.
 *
 * Background: the KFP run-details API returns Argo node IDs in
 * `child_tasks[].pod_name`, NOT the real k8s pod that ran the user's
 * container. The actual k8s pod is named `{workflow}-{template-name}-{ordinal}`.
 *
 * Where the ordinal lives is non-obvious:
 *
 *   • Each task's `child_tasks[]` does NOT list its own pod. It lists the
 *     executor pods of the DOWNSTREAM tasks that depend on it. So to find
 *     task X's executor pod, look at X's DAG parent's `child_tasks[]` and
 *     pick the entry that corresponds to X by sibling index (DAG-declaration
 *     order among tasks sharing the same parent).
 *
 *   • Tasks with no DAG dependencies (the entry-point tasks) use the
 *     workflow ROOT task's `child_tasks[]` as their ordinal source. The
 *     workflow root task is the one whose `display_name` matches the prefix
 *     of its own child pod's name.
 */

export interface ChildTaskShape {
  pod_name?: string;
}

interface ExecutorDetailShape {
  main_job?: string;
}

export interface TaskDetailShape {
  task_id?: string;
  display_name?: string;
  pod_name?: string;
  executor_detail?: ExecutorDetailShape;
  child_tasks?: ChildTaskShape[];
}

export interface DagTaskShape {
  name?: string;
  template?: string;
  dependencies?: string[];
}

export interface PipelineTemplateShape {
  name?: string;
  dag?: { tasks?: DagTaskShape[] };
}

const slugify = (s: string | undefined): string =>
  (s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const splitWorkflowOrdinal = (
  podName: string,
): { workflow: string; ordinal: string } | null => {
  const m = podName.match(/^(.+)-(\d+)$/);
  if (!m) return null;
  return { workflow: m[1], ordinal: m[2] };
};

const insertSlug = (
  raw: string,
  slug: string,
): string => {
  const parsed = splitWorkflowOrdinal(raw);
  if (!parsed) return raw;
  const { workflow, ordinal } = parsed;
  if (workflow === slug || workflow.endsWith(`-${slug}`)) return raw;
  return `${workflow}-${slug}-${ordinal}`;
};

/**
 * Returns the executor pod name for the given task, or null if it can't be
 * determined from the available data.
 */
export function resolveLogPodName(
  task: TaskDetailShape | null | undefined,
  allTasks: TaskDetailShape[],
  templates: PipelineTemplateShape[],
): string | null {
  if (!task) return null;

  // (a) Canonical KFP v2beta1 field if present.
  if (task.executor_detail?.main_job) return task.executor_detail.main_job;
  // (b) Direct pod_name on the task if present.
  if (task.pod_name) return task.pod_name;

  const slug = slugify(task.display_name);
  if (!slug) return task.child_tasks?.[0]?.pod_name ?? null;

  // Workflow root task: display_name is the workflow name, also the prefix
  // of its own child pod's name.
  const rootTask = allTasks.find((t) => {
    const childPod = t.child_tasks?.[0]?.pod_name;
    if (!childPod || !t.display_name) return false;
    return childPod.startsWith(`${t.display_name}-`);
  });

  // Selecting the workflow root itself — return its child pod as-is.
  if (rootTask && rootTask.display_name === task.display_name) {
    return rootTask.child_tasks?.[0]?.pod_name ?? null;
  }

  // Find the selected task's DAG entry to read its dependencies.
  const dagTasks = templates.flatMap((tpl) => tpl.dag?.tasks ?? []);
  const myDagEntry = dagTasks.find(
    (t) => t.template === task.display_name || t.name === task.display_name,
  );
  const myDagName = myDagEntry?.name ?? task.display_name ?? '';
  const myDeps = myDagEntry?.dependencies ?? [];

  // The parent whose child_tasks[] holds our executor pod.
  const parentTask =
    (myDeps.length > 0
      ? allTasks.find((t) => t.display_name === myDeps[0])
      : rootTask) ?? null;

  if (parentTask) {
    const parentChildren = parentTask.child_tasks ?? [];

    // Sibling order: tasks sharing the same parent, in DAG-declaration order.
    const siblingNames =
      parentTask === rootTask
        ? dagTasks
            .filter((t) => (t.dependencies ?? []).length === 0)
            .map((t) => t.name ?? '')
        : dagTasks
            .filter((t) =>
              (t.dependencies ?? []).includes(parentTask.display_name ?? ''),
            )
            .map((t) => t.name ?? '');

    const index = siblingNames.indexOf(myDagName);
    if (index >= 0 && index < parentChildren.length) {
      const podRaw = parentChildren[index].pod_name;
      if (podRaw) return insertSlug(podRaw, slug);
    }
  }

  // Last resort: slug-inject the task's own first child_task.
  const myChild = task.child_tasks?.[0]?.pod_name;
  if (myChild) return insertSlug(myChild, slug);

  return null;
}
