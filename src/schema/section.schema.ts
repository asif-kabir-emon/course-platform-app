import { CourseSectionStatus } from "@prisma/client";
import { z } from "zod";

export const sectionSchema = z.object({
  name: z
    .string({
      message: "Section name is required",
    })
    .min(4, {
      message: "Section name must be at least 4 characters",
    }),
  status: z
    .enum([CourseSectionStatus.public, CourseSectionStatus.private] as const, {
      message: "Invalid section status",
    })
    .default(CourseSectionStatus.public),
});

export const sectionDefaultValues: z.infer<typeof sectionSchema> = {
  name: "",
  status: CourseSectionStatus.public,
};
