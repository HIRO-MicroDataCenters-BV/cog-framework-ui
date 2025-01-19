import { z } from "zod";

const paginationSchema = z.object({
  total_items: z.number(),
  limit: z.number(),
  page: z.number(),
});

export const apiResponseSchema = z.object({
  status_code: z.number().optional(),
  message: z.string().optional(),
  data: z
    .union([z.array(z.object({}).passthrough()), z.object({}).passthrough()])
    .optional(),
  pagination: paginationSchema.optional(),
  detail: z.string().optional(),
});

export type ApiResponse = z.output<typeof apiResponseSchema>;
