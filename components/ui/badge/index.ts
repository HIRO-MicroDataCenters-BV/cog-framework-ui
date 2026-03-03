import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden opacity-100 font-semibold',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        completed:
          'border-transparent bg-gray-200 text-gray-900 [a&]:hover:bg-green-600',
        running: 'border-transparent bg-blue-600 text-white',
        failed:
          'border-transparent bg-red-700 text-white [a&]:hover:bg-red-600',
        pending: 'border-transparent bg-gray-200 text-gray-700 dark:bg-white',
        succeeded: 'border-transparent bg-green-700 text-white',
        file: 'border-transparent bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-100',
        database:
          'border-transparent bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-100',
        stream:
          'border-transparent bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-100',
        time_series:
          'border-transparent bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-100',
        sklearn:
          'border-transparent bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
        pytorch:
          'border-transparent bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
        tensorflow:
          'border-transparent bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
        xgboost:
          'border-transparent bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
        keras:
          'border-transparent bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
        pyfunc:
          'border-transparent bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300',
        classification:
          'border-transparent bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
export type BadgeVariants = VariantProps<typeof badgeVariants>;

// Universal badge configuration for different categories
export const badgeConfig = {
  status: {
    completed: {
      variant: 'completed' as const,
      icon: 'CheckCircle',
      animate: false,
    },
    running: {
      variant: 'running' as const,
      icon: 'LoaderCircle',
      animate: true,
    },
    failed: {
      variant: 'failed' as const,
      icon: 'CircleSlash',
      animate: false,
    },
    pending: {
      variant: 'pending' as const,
      icon: 'Clock',
      animate: false,
    },
    succeeded: {
      variant: 'succeeded' as const,
      icon: 'Check',
      animate: false,
    },
  },
  type: {
    file: {
      variant: 'file' as const,
      icon: 'File',
      animate: false,
    },
    database: {
      variant: 'database' as const,
      icon: 'Database',
      animate: false,
    },
    stream: {
      variant: 'stream' as const,
      icon: 'Stream',
      animate: false,
    },
    time_series: {
      variant: 'time_series' as const,
      icon: 'Calendar',
      animate: false,
    },
    id: {
      variant: 'outline' as const,
      icon: null,
      animate: false,
    },
  },
  model_type: {
    sklearn: {
      variant: 'sklearn' as const,
      icon: 'File',
      animate: false,
    },
    pytorch: {
      variant: 'pytorch' as const,
      icon: 'File',
      animate: false,
    },
    tensorflow: {
      variant: 'tensorflow' as const,
      icon: 'File',
      animate: false,
    },
    xgboost: {
      variant: 'xgboost' as const,
      icon: 'File',
      animate: false,
    },
    xcboost: {
      variant: 'xgboost' as const,
      icon: 'File',
      animate: false,
    },
    keras: {
      variant: 'keras' as const,
      icon: 'File',
      animate: false,
    },
    pyfunc: {
      variant: 'pyfunc' as const,
      icon: 'File',
      animate: false,
    },
    classification: {
      variant: 'classification' as const,
      icon: 'File',
      animate: false,
    },
  },
  invalid: {
    variant: 'invalid' as const,
    icon: 'CircleSlash',
    animate: false,
  },
} as const;

export type BadgeCategory = keyof typeof badgeConfig;
export type StatusType = keyof typeof badgeConfig.status;
export type DataType = keyof typeof badgeConfig.type;

export type BadgeCategoryConfig = {
  variant: BadgeVariants['variant'];
  icon: string | null;
  animate: boolean;
};
