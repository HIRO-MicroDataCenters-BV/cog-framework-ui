import { describe, it, expect } from 'vitest';
import {
  resolveLogPodName,
  type TaskDetailShape,
  type PipelineTemplateShape,
} from '~/utils/resolveLogPodName';

// Sample data mirrors the real KFP v2beta1 response the user pasted for run
// `fc1d7477-6a6b-4452-b1e0-cf685f7c56f3` (workflow `dynamic-pipeline-compilation-frj2r`).
// Tasks (DAG-declaration order in pipeline_spec.spec.templates[].dag.tasks):
//   add-ten (no deps)
//   final-sum (deps: multiply-by-two, multiply-by-two-2)
//   final-sum-2 (deps: final-sum)
//   multiply-by-two (deps: add-ten)
//   multiply-by-two-2 (deps: add-ten)
const WF = 'dynamic-pipeline-compilation-frj2r';

const tasks: TaskDetailShape[] = [
  {
    task_id: 'multiply-by-two-id',
    display_name: 'multiply-by-two',
    child_tasks: [{ pod_name: `${WF}-2186829174` }],
  },
  {
    task_id: 'final-sum-id',
    display_name: 'final-sum',
    child_tasks: [{ pod_name: `${WF}-24246025` }],
  },
  {
    task_id: 'final-sum-2-id',
    display_name: 'final-sum-2',
  },
  {
    task_id: 'multiply-by-two-2-id',
    display_name: 'multiply-by-two-2',
    child_tasks: [{ pod_name: `${WF}-2186829174` }],
  },
  {
    task_id: 'wf-root-id',
    display_name: WF,
    child_tasks: [{ pod_name: `${WF}-2282402453` }],
  },
  {
    task_id: 'add-ten-id',
    display_name: 'add-ten',
    child_tasks: [
      { pod_name: `${WF}-1872027469` },
      { pod_name: `${WF}-2806204502` },
    ],
  },
];

const templates: PipelineTemplateShape[] = [
  {
    name: 'dynamic-pipeline-compilation',
    dag: {
      tasks: [
        { name: 'add-ten', template: 'add-ten' },
        {
          name: 'final-sum',
          template: 'final-sum',
          dependencies: ['multiply-by-two', 'multiply-by-two-2'],
        },
        {
          name: 'final-sum-2',
          template: 'final-sum-2',
          dependencies: ['final-sum'],
        },
        {
          name: 'multiply-by-two',
          template: 'multiply-by-two',
          dependencies: ['add-ten'],
        },
        {
          name: 'multiply-by-two-2',
          template: 'multiply-by-two-2',
          dependencies: ['add-ten'],
        },
      ],
    },
  },
];

const findTask = (name: string) =>
  tasks.find((t) => t.display_name === name) ?? null;

describe('resolveLogPodName', () => {
  describe('the user-reported scenarios from the real run', () => {
    it("add-ten (no deps) → uses workflow root's ordinal", () => {
      expect(resolveLogPodName(findTask('add-ten'), tasks, templates)).toBe(
        `${WF}-add-ten-2282402453`,
      );
    });

    it('multiply-by-two (1st sibling under add-ten) → add-ten.children[0]', () => {
      expect(
        resolveLogPodName(findTask('multiply-by-two'), tasks, templates),
      ).toBe(`${WF}-multiply-by-two-1872027469`);
    });

    it('multiply-by-two-2 (2nd sibling under add-ten) → add-ten.children[1]', () => {
      expect(
        resolveLogPodName(findTask('multiply-by-two-2'), tasks, templates),
      ).toBe(`${WF}-multiply-by-two-2-2806204502`);
    });

    it('final-sum (single sibling under multiply-by-two) → multiply-by-two.children[0]', () => {
      expect(resolveLogPodName(findTask('final-sum'), tasks, templates)).toBe(
        `${WF}-final-sum-2186829174`,
      );
    });

    it('final-sum-2 (single sibling under final-sum) → final-sum.children[0]', () => {
      expect(resolveLogPodName(findTask('final-sum-2'), tasks, templates)).toBe(
        `${WF}-final-sum-2-24246025`,
      );
    });
  });

  describe('selecting the workflow root itself', () => {
    it("returns the root's child pod as-is (no slug to insert)", () => {
      expect(resolveLogPodName(findTask(WF), tasks, templates)).toBe(
        `${WF}-2282402453`,
      );
    });
  });

  describe('preferred fields take precedence', () => {
    it('returns task.executor_detail.main_job when present (canonical v2beta1)', () => {
      const task: TaskDetailShape = {
        display_name: 'add-ten',
        executor_detail: { main_job: 'pre-resolved-pod-name' },
        child_tasks: [{ pod_name: `${WF}-1872027469` }],
      };
      expect(resolveLogPodName(task, tasks, templates)).toBe(
        'pre-resolved-pod-name',
      );
    });

    it('returns task.pod_name when present (direct field)', () => {
      const task: TaskDetailShape = {
        display_name: 'add-ten',
        pod_name: 'directly-set-pod',
        child_tasks: [{ pod_name: `${WF}-1872027469` }],
      };
      expect(resolveLogPodName(task, tasks, templates)).toBe(
        'directly-set-pod',
      );
    });
  });

  describe('null / empty inputs', () => {
    it('returns null when task is null', () => {
      expect(resolveLogPodName(null, tasks, templates)).toBeNull();
    });

    it('returns null when task is undefined', () => {
      expect(resolveLogPodName(undefined, tasks, templates)).toBeNull();
    });

    it('returns the first child pod when display_name produces an empty slug', () => {
      const weird: TaskDetailShape = {
        display_name: '!!!',
        child_tasks: [{ pod_name: `${WF}-1234567890` }],
      };
      expect(resolveLogPodName(weird, tasks, templates)).toBe(
        `${WF}-1234567890`,
      );
    });
  });

  describe('fallback when DAG / templates are empty', () => {
    it("slug-injects the task's own first child_task pod", () => {
      const task: TaskDetailShape = {
        display_name: 'lonely-task',
        child_tasks: [{ pod_name: `${WF}-9999999999` }],
      };
      // No templates → no DAG → no parent → falls back to own child.
      expect(resolveLogPodName(task, [task], [])).toBe(
        `${WF}-lonely-task-9999999999`,
      );
    });

    it('returns null when there are no children to fall back on', () => {
      const task: TaskDetailShape = { display_name: 'lonely-task' };
      expect(resolveLogPodName(task, [task], [])).toBeNull();
    });
  });

  describe('avoids double-injection when the slug is already in the prefix', () => {
    it('does not re-add the slug if the workflow prefix already ends with it', () => {
      const task: TaskDetailShape = {
        display_name: 'special',
        // Pod prefix already ends with `-special`, so we should not double it.
        child_tasks: [{ pod_name: 'wf-special-12345' }],
      };
      // No DAG/parent — falls back to own child path.
      expect(resolveLogPodName(task, [task], [])).toBe('wf-special-12345');
    });

    it('does not re-add the slug if the workflow prefix equals the slug', () => {
      const task: TaskDetailShape = {
        display_name: 'special',
        child_tasks: [{ pod_name: 'special-99999' }],
      };
      expect(resolveLogPodName(task, [task], [])).toBe('special-99999');
    });
  });

  describe('display_name slugification', () => {
    it('lowercases and hyphenates non-alphanumeric characters', () => {
      const task: TaskDetailShape = {
        display_name: 'My Task_Name!',
        child_tasks: [{ pod_name: 'wf-12345' }],
      };
      expect(resolveLogPodName(task, [task], [])).toBe('wf-my-task-name-12345');
    });
  });
});
