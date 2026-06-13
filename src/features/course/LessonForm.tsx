import { zodResolver } from "@hookform/resolvers/zod";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { CourseLessonType } from "@/constants/CourseLessonType.constant";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import MarkdownEditor from "@/components/MarkdownEditor";
import {
  CircleHelp,
  FileText,
  Info,
  LockKeyhole,
  Video,
} from "lucide-react";

const LessonForm = ({
  lesson,
  sectionId,
  onSuccess,
}: {
  lesson?: {
    id: string;
    name: string;
    description: string;
    type?: CourseLessonType;
    content?: string;
    youtubeVideoId: string;
    status: CourseLessonStatus;
  };
  sectionId: string;
  onSuccess?: () => void;
}) => {
  const form = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: lesson
      ? {
          ...lessonDefaultValues,
          ...lesson,
          type: lesson.type ?? CourseLessonType.video,
          content: lesson.content ?? "",
        }
      : lessonDefaultValues,
  });

  const [videoId, lessonType] = useWatch({
    control: form.control,
    name: ["youtubeVideoId", "type"],
  });

  const [addLesson, { isLoading: isAdding }] = useAddLessonMutation();
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();
  const LessonTypeIcon =
    lessonType === CourseLessonType.text
      ? FileText
      : lessonType === CourseLessonType.quiz
        ? CircleHelp
        : Video;

  const handleSubmit = async (values: z.infer<typeof lessonSchema>) => {
    const action = lesson ? "updated" : "added";

    const payload =
      action === "added"
        ? {
            name: values.name,
            type: values.type,
            content: values.content,
            youtubeVideoId: values.youtubeVideoId,
            status: values.status,
            sectionId: sectionId,
            description: values.description,
          }
        : {
            id: lesson?.id,
            body: {
              name: values.name,
              type: values.type,
              content: values.content,
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
    <div className="mx-auto w-full max-w-6xl">
      <Form schema={lessonSchema} {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={
            lessonType === CourseLessonType.text
              ? "space-y-6"
              : "grid items-start gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]"
          }
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
            {lesson ? (
              <div>
                <Label className="text-base">Lesson type</Label>
                <div className="mt-2 flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <LessonTypeIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">
                      {lessonType} lesson
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <LockKeyhole className="size-3" />
                      Type is fixed after creation.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <SelectInput
                name="type"
                label="Lesson type"
                placeholder="Select lesson type"
                items={[
                  { label: "Video lesson", value: CourseLessonType.video },
                  { label: "Text lesson", value: CourseLessonType.text },
                  { label: "Quiz lesson", value: CourseLessonType.quiz },
                ]}
                required
              />
            )}
            {lessonType === CourseLessonType.video && (
              <TextInput
                name="youtubeVideoId"
                label="Youtube Video ID"
                placeholder="Enter youtube video id"
                required
              />
            )}
            {lessonType === CourseLessonType.quiz && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                Save this lesson, then open its Quiz tab to add questions,
                timing, and attempt rules.
              </div>
            )}
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
            {lessonType !== CourseLessonType.text && (
              <div className="flex justify-end border-t pt-4">
                <Button
                  type="submit"
                  className="w-full px-6 sm:w-auto"
                  disabled={isAdding || isUpdating}
                >
                  {isAdding || isUpdating ? "Saving..." : "Save lesson"}
                </Button>
              </div>
            )}
          </div>
          {lessonType === CourseLessonType.text ? (
            <section className="surface-panel overflow-hidden">
              <div className="border-b p-5 sm:p-6">
                <h2 className="text-lg font-semibold">Lesson content</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Structure the reading with headings, emphasis, lists, quotes,
                  and useful links.
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <MarkdownEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Start with an introduction, then add clear sections and key takeaways..."
                      />
                      {error && (
                        <p className="mt-2 text-sm text-destructive">
                          {error.message}
                        </p>
                      )}
                    </>
                  )}
                />
                <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="size-4" />
                    Use Preview to check the learner-facing result.
                  </p>
                  <Button
                    type="submit"
                    className="w-full px-6 sm:w-auto"
                    disabled={isAdding || isUpdating}
                  >
                    {isAdding || isUpdating ? "Saving..." : "Save lesson"}
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <aside className="surface-panel overflow-hidden xl:sticky xl:top-0">
              <div className="border-b p-5 sm:p-6">
                <h2 className="text-lg font-semibold">Lesson preview</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm how this lesson will be presented before saving.
                </p>
              </div>
              {lessonType === CourseLessonType.video && videoId ? (
                <div className="aspect-video bg-black">
                  <YoutubeVideoPlayer videoId={videoId} />
                </div>
              ) : lessonType === CourseLessonType.quiz ? (
                <div className="flex min-h-64 items-center justify-center bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  Quiz questions and schedule are managed from the Quiz tab
                  after this lesson is saved.
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  Enter a YouTube video ID to preview the lesson.
                </div>
              )}
            </aside>
          )}
        </form>
      </Form>
    </div>
  );
};

export default LessonForm;
