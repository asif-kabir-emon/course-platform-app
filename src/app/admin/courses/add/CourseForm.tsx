import { Form } from "@/components/Form/Form";
import TextAreaInput from "@/components/Form/TextAreaInput";
import TextInput from "@/components/Form/TextInput";
import { Button } from "@/components/ui/button";
import { courseDefaultValues, courseSchema } from "@/schema/course.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CourseForm = () => {
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: courseDefaultValues,
  });

  const handleSubmit = (values: z.infer<typeof courseSchema>) => {
    console.log(values);
    alert(JSON.stringify(values, null, 2));
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
            <Button type="submit" className="px-6">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseForm;
