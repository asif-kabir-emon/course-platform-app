import { Form } from "@/components/Form/Form";
import TextAreaInput from "@/components/Form/TextAreaInput";
import TextInput from "@/components/Form/TextInput";
import { Button } from "@/components/ui/button";
import { useAddCourseMutation } from "@/redux/api/courseApi";
import { courseDefaultValues, courseSchema } from "@/schema/course.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const CourseForm = () => {
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: courseDefaultValues,
  });

  const router = useRouter();
  const [addCourse, { isLoading }] = useAddCourseMutation();

  const handleSubmit = async (values: z.infer<typeof courseSchema>) => {
    const payload = {
      name: values.name,
      description: values.description,
    };

    const toastId = toast.loading("Adding new course...", {
      duration: 2000,
      position: "top-center",
    });

    try {
      const response = await addCourse(payload).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
        router.push("/admin/courses");
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to add new course!", { id: toastId, duration: 2000 });
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
            <Button type="submit" className="px-6" disabled={isLoading}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseForm;
