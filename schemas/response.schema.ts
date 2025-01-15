import { z } from "zod";

const paginationSchema = z.object({
  total_items: z.number(),
  limit: z.number(),
  page: z.number(),
});

export const apiResponseSchema = z.object({
  status_code: z.number(),
  message: z.string(),
  data: z.union([z.object({}).passthrough(), z.array(z.any())]),
  pagination: paginationSchema.optional(),
});

export type ApiResponse = z.output<typeof apiResponseSchema>;
