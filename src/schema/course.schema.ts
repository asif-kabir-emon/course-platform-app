import { z } from "zod";

export const courseSchema = z.object({
  name: z
    .string({
      message: "Course name is required",
    })
    .min(4, {
      message: "Course name must be at least 4 characters",
    }),
  description: z
    .string({
      message: "Course description is required",
    })
    .min(4, {
      message: "Course description must be at least 4 characters",
    }),
});

export const courseDefaultValues: z.infer<typeof courseSchema> = {
  name: "",
  description: "",
};
