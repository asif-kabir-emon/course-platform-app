import { CourseLessonStatus } from "@prisma/client";
import { z } from "zod";

export const lessonSchema = z.object({
  name: z
    .string({
      message: "Lesson name is required",
    })
    .min(4, {
      message: "Lesson name must be at least 4 characters",
    }),
  description: z.string().optional(),
  youtubeVideoId: z
    .string({
      message: "Youtube video ID is required",
    })
    .min(2, {
      message: "Youtube video ID must be at least 2 characters",
    }),
  status: z
    .enum(
      [
        CourseLessonStatus.public,
        CourseLessonStatus.private,
        CourseLessonStatus.preview,
      ] as const,
      {
        message: "Invalid section status",
      },
    )
    .default(CourseLessonStatus.public),
});

export const lessonDefaultValues: z.infer<typeof lessonSchema> = {
  name: "",
  description: "",
  youtubeVideoId: "",
  status: CourseLessonStatus.public,
};
