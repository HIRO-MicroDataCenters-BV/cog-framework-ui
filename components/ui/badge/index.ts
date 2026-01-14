import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden opacity-100',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
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
        invalid:
          'border-transparent bg-orange-600 text-white [a&]:hover:bg-orange-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
export type BadgeVariants = VariantProps<typeof badgeVariants>;

// Status configuration
export const statusConfig = {
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
  invalid: {
    variant: 'invalid' as const,
    icon: 'CircleSlash',
    animate: false,
  },
} as const;

export type StatusType = keyof typeof statusConfig;
