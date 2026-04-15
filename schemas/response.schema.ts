import { z } from 'zod';

const paginationSchema = z.object({
  total_items: z.number(),
  limit: z.number(),
  page: z.number(),
});

export const apiResponseSchema = z.union([
  z.object({
    status_code: z.number().optional(),
    message: z.string().optional(),
    data: z
      .union([
        z.array(z.object({}).passthrough()),
        z.object({}).passthrough(),
        z.null(),
      ])
      .optional(),
    pagination: paginationSchema.nullable().optional(),
  }),
  z.array(z.object({}).passthrough()),
]);

export const apiErrorResponseSchema = z.object({
  detail: z.string(),
});

export type ApiResponse = z.output<typeof apiResponseSchema>;
export type ApiErrorResponse = z.output<typeof apiErrorResponseSchema>;
