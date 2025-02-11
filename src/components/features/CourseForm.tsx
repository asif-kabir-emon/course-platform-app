import { Form } from "@/components/Form/Form";
import TextAreaInput from "@/components/Form/TextAreaInput";
import TextInput from "@/components/Form/TextInput";
import { Button } from "@/components/ui/button";
import {
  useAddCourseMutation,
  useUpdateCourseMutation,
} from "@/redux/api/courseApi";
import { courseDefaultValues, courseSchema } from "@/schema/course.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const CourseForm = ({
  course,
}: {
  course?: {
    id: string;
    name: string;
    description: string;
  };
}) => {
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ?? courseDefaultValues,
  });

  const router = useRouter();
  const [addCourse, { isLoading: isAdding }] = useAddCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();

  const handleSubmit = async (values: z.infer<typeof courseSchema>) => {
    const action = course ? "updated" : "added";

    const payload =
      action === "added"
        ? {
            name: values.name,
            description: values.description,
          }
        : {
            id: course?.id,
            body: { name: values.name, description: values.description },
          };

    const toastId = toast.loading(
      action === "added" ? "Adding new course..." : "Updating course...",
      {
        duration: 2000,
        position: "top-center",
      },
    );

    try {
      const response =
        action === "added"
          ? await addCourse(payload).unwrap()
          : await updateCourse(payload).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        action === "added" && router.push("/admin/courses");
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(
        action === "added"
          ? "Failed to add new course!"
          : "Failed to update course!",
        { id: toastId, duration: 2000 },
      );
    }
  };

  return (
    <div>
      <Form schema={courseSchema} {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <TextInput
            name="name"
            label="Name"
            placeholder="Enter name of the course"
            required
          />
          <TextAreaInput
            name="description"
            label="Description"
            placeholder="Enter description of the course"
            required
          />
          <div className="text-right">
            <Button
              type="submit"
              className="px-6"
              disabled={isAdding || isUpdating}
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseForm;
