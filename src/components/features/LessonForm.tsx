import { sectionSchema } from "@/schema/section.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CourseLessonStatus } from "@prisma/client";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "../Form/Form";
import TextInput from "../Form/TextInput";
import { Button } from "../ui/button";
import SelectInput from "../Form/SelectInput";
import { lessonDefaultValues, lessonSchema } from "@/schema/lesson.schema";
import {
  useAddLessonMutation,
  useUpdateLessonMutation,
} from "@/redux/api/lessonApi";
import TextAreaInput from "../Form/TextAreaInput";
import YoutubeVideoPlayer from "../YoutubeVideoPlayer";

const LessonForm = ({
  lesson,
  sectionId,
  onSuccess,
}: {
  lesson?: {
    id: string;
    name: string;
    description: string;
    youtubeVideoId: string;
    status: CourseLessonStatus;
  };
  sectionId: string;
  onSuccess?: () => void;
}) => {
  const form = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: lesson ?? lessonDefaultValues,
  });

  const videoId = form.watch("youtubeVideoId");

  const [addLesson, { isLoading: isAdding }] = useAddLessonMutation();
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();

  const handleSubmit = async (values: z.infer<typeof lessonSchema>) => {
    const action = lesson ? "updated" : "added";

    const payload =
      action === "added"
        ? {
            name: values.name,
            youtubeVideoId: values.youtubeVideoId,
            status: values.status,
            sectionId: sectionId,
          }
        : {
            id: lesson?.id,
            body: {
              name: values.name,
              youtubeVideoId: values.youtubeVideoId,
              status: values.status,
              sectionId: sectionId,
            },
          };

    const toastId = toast.loading(
      action === "added" ? "Adding new lesson ..." : "Updating lesson ...",
      {
        duration: 2000,
        position: "top-center",
      },
    );

    try {
      const response =
        action === "added"
          ? await addLesson(payload).unwrap()
          : await updateLesson(payload).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
        onSuccess?.();
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(
        action === "added"
          ? "Failed to add new lesson!"
          : "Failed to update lesson!",
        { id: toastId, duration: 2000 },
      );
    }
  };

  return (
    <div>
      <Form schema={sectionSchema} {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <TextInput
            name="name"
            label="Name"
            placeholder="Enter name of the lesson"
            required
          />
          <TextInput
            name="youtubeVideoId"
            label="Youtube Video ID"
            placeholder="Enter youtube video id"
            required
          />
          <SelectInput
            name="status"
            label="Status"
            placeholder="Select status"
            items={[
              {
                label: "Public",
                value: CourseLessonStatus.public,
              },
              {
                label: "Private",
                value: CourseLessonStatus.private,
              },
              {
                label: "Preview",
                value: CourseLessonStatus.preview,
              },
            ]}
            required
          />
          <TextAreaInput name="description" label="Description" />
          <div className="text-right">
            <Button
              type="submit"
              className="px-6"
              disabled={isAdding || isUpdating}
            >
              Save
            </Button>
          </div>
          {videoId && (
            <div className="aspect-video">
              <YoutubeVideoPlayer videoId={videoId} />
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default LessonForm;
