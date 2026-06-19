import { zodResolver } from "@hookform/resolvers/zod";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { lessonDefaultValues, lessonSchema } from "@/schema/lesson.schema";
import { useAddLessonMutation, useUpdateLessonMutation } from "@/hooks/lesson.hook";
import { Form } from "@/components/Form/Form";
import TextInput from "@/components/Form/TextInput";
import SelectInput from "@/components/Form/SelectInput";
import { Button } from "@/components/ui/button";
import YoutubeVideoPlayer from "@/components/YoutubeVideoPlayer";
import { CourseLessonType } from "@/constants/CourseLessonType.constant";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import MarkdownEditor from "@/components/MarkdownEditor";
import { CircleHelp, FileText, Info, LockKeyhole, Video } from "lucide-react";

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
    const isTextLesson = values.type === CourseLessonType.text;
    const normalizedValues = {
      ...values,
      description: isTextLesson ? "" : values.description,
      content: isTextLesson ? values.content : "",
      youtubeVideoId:
        values.type === CourseLessonType.video ? values.youtubeVideoId : "",
    };

    const payload =
      action === "added"
        ? {
            name: normalizedValues.name,
            type: normalizedValues.type,
            content: normalizedValues.content,
            youtubeVideoId: normalizedValues.youtubeVideoId,
            status: normalizedValues.status,
            sectionId: sectionId,
            description: normalizedValues.description,
          }
        : {
            id: lesson?.id,
            body: {
              name: normalizedValues.name,
              type: normalizedValues.type,
              content: normalizedValues.content,
              youtubeVideoId: normalizedValues.youtubeVideoId,
              status: normalizedValues.status,
              sectionId: sectionId,
              description: normalizedValues.description,
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
          className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]"
        >
          <div className="surface-panel space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Step 1
              </p>
              <h2 className="mt-1 text-lg font-semibold">Lesson setup</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set the lesson identity, type, and learner visibility.
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
            <div className="rounded-xl bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
              {lessonType === CourseLessonType.text
                ? "Text lessons contain one formatted reading document and do not use a separate description."
                : lessonType === CourseLessonType.quiz
                  ? "Add the lesson introduction here. Questions, schedule, and attempt rules are managed after saving."
                  : "Add the video source and a formatted lesson description in the content panel."}
            </div>
          </div>
          <section className="surface-panel min-w-0 overflow-hidden xl:sticky xl:top-0">
            <div className="border-b p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Step 2
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {lessonType === CourseLessonType.text
                  ? "Reading content"
                  : lessonType === CourseLessonType.quiz
                    ? "Quiz introduction"
                    : "Video content"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lessonType === CourseLessonType.text
                  ? "Create the complete learner-facing reading directly in the editor."
                  : "Add a formatted description learners will see with this lesson."}
              </p>
            </div>
            <div className="space-y-6 p-4 sm:p-6">
              {lessonType === CourseLessonType.video && (
                <TextInput
                  name="youtubeVideoId"
                  label="YouTube video ID"
                  placeholder="Enter YouTube video ID"
                  required
                />
              )}
              {lessonType === CourseLessonType.text ? (
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
              ) : (
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <MarkdownEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          lessonType === CourseLessonType.quiz
                            ? "Explain the quiz purpose, preparation, and expectations..."
                            : "Summarize the lesson, learning goals, and key outcomes..."
                        }
                        ariaLabel="Lesson description"
                        compact
                      />
                      {error && (
                        <p className="mt-2 text-sm text-destructive">
                          {error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              )}
              {lessonType === CourseLessonType.video && videoId && (
                <div className="overflow-hidden rounded-xl border">
                  <div className="border-b bg-muted/30 px-4 py-3">
                    <p className="text-sm font-semibold">Video preview</p>
                  </div>
                  <div className="aspect-video bg-black">
                    <YoutubeVideoPlayer videoId={videoId} />
                  </div>
                </div>
              )}
              {lessonType === CourseLessonType.quiz && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                  Save this lesson, then open its Quiz tab to add questions,
                  timing, attempt dates, and scoring rules.
                </div>
              )}
              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="size-4" />
                  Changes are saved only when you select Save lesson.
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
        </form>
      </Form>
    </div>
  );
};

export default LessonForm;
