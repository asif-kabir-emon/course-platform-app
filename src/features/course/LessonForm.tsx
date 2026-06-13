import { zodResolver } from "@hookform/resolvers/zod";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { lessonDefaultValues, lessonSchema } from "@/schema/lesson.schema";
import {
  useAddLessonMutation,
  useUpdateLessonMutation,
} from "@/redux/api/lessonApi";
import { Form } from "@/components/Form/Form";
import TextInput from "@/components/Form/TextInput";
import SelectInput from "@/components/Form/SelectInput";
import TextAreaInput from "@/components/Form/TextAreaInput";
import { Button } from "@/components/ui/button";
import YoutubeVideoPlayer from "@/components/YoutubeVideoPlayer";

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
            description: values.description,
          }
        : {
            id: lesson?.id,
            body: {
              name: values.name,
              youtubeVideoId: values.youtubeVideoId,
              status: values.status,
              sectionId: sectionId,
              description: values.description,
            },
          };

    const toastId = toast.loading(
      action === "added" ? "Adding new lesson ..." : "Updating lesson ...",
      {
        duration: 2000,
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
    <div className="mx-auto w-full max-w-7xl">
      <Form schema={lessonSchema} {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]"
        >
          <div className="surface-panel space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Lesson information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the learner-facing content and publishing status.
              </p>
            </div>
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
            <div className="flex justify-end border-t pt-4">
              <Button
                type="submit"
                className="w-full px-6 sm:w-auto"
                disabled={isAdding || isUpdating}
              >
                {isAdding || isUpdating ? "Saving..." : "Save lesson"}
              </Button>
            </div>
          </div>
          <aside className="surface-panel overflow-hidden lg:sticky lg:top-0">
            <div className="border-b p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Video preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm the YouTube video before saving the lesson.
              </p>
            </div>
            {videoId ? (
              <div className="aspect-video bg-black">
                <YoutubeVideoPlayer videoId={videoId} />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Enter a YouTube video ID to preview the lesson.
              </div>
            )}
          </aside>
        </form>
      </Form>
    </div>
  );
};

export default LessonForm;
