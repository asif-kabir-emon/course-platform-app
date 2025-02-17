import { z } from "zod";

export const profileSchema = z.object({
  firstName: z
    .string({
      message: "First name is required",
    })
    .min(3, {
      message: "First name must be at least 3 characters",
    }),
  lastName: z
    .string({
      message: "Last name is required",
    })
    .min(3, {
      message: "Last name must be at least 3 characters",
    }),
  imageUrl: z
    .string({
      message: "Photo URL is required",
    })
    .optional(),
});

export const profileDefaultValues: z.infer<typeof profileSchema> = {
  firstName: "",
  lastName: "",
  imageUrl: "",
};
