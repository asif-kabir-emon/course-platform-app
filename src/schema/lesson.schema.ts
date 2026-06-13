import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { CourseLessonType } from "@/constants/CourseLessonType.constant";
import { z } from "zod";

export const lessonSchema = z
  .object({
    name: z
      .string({
        message: "Lesson name is required",
      })
      .min(4, {
        message: "Lesson name must be at least 4 characters",
      }),
    description: z.string().optional(),
    type: z
      .enum(
        [
          CourseLessonType.video,
          CourseLessonType.text,
          CourseLessonType.quiz,
        ] as const,
        { message: "Select a lesson type" },
      )
      .default(CourseLessonType.video),
    content: z.string().optional(),
    youtubeVideoId: z.string().optional(),
    status: z
      .enum(
        [
          CourseLessonStatus.public,
          CourseLessonStatus.private,
          CourseLessonStatus.preview,
        ] as const,
        {
          message: "Invalid lesson status",
        },
      )
      .default(CourseLessonStatus.public),
  })
  .superRefine((lesson, context) => {
    if (
      lesson.type === CourseLessonType.video &&
      (lesson.youtubeVideoId?.trim().length ?? 0) < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["youtubeVideoId"],
        message: "Youtube video ID is required for a video lesson",
      });
    }

    if (
      lesson.type === CourseLessonType.text &&
      (lesson.content?.trim().length ?? 0) < 10
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Text lesson content must be at least 10 characters",
      });
    }
  });

export const lessonDefaultValues: z.infer<typeof lessonSchema> = {
  name: "",
  description: "",
  type: CourseLessonType.video,
  content: "",
  youtubeVideoId: "",
  status: CourseLessonStatus.public,
};
