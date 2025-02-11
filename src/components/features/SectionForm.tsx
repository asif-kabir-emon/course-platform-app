import { sectionDefaultValues, sectionSchema } from "@/schema/section.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CourseSectionStatus } from "@prisma/client";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "../Form/Form";
import TextInput from "../Form/TextInput";
import { Button } from "../ui/button";
import {
  useAddSectionMutation,
  useUpdateSectionMutation,
} from "@/redux/api/sectionApi";
import SelectInput from "../Form/SelectInput";

const SectionForm = ({
  section,
  courseId,
  onSuccess,
}: {
  section?: {
    id: string;
    name: string;
    status: CourseSectionStatus;
  };
  courseId: string;
  onSuccess?: () => void;
}) => {
  const form = useForm<z.infer<typeof sectionSchema>>({
    resolver: zodResolver(sectionSchema),
    defaultValues: section ?? sectionDefaultValues,
  });

  const [addSection, { isLoading: isAdding }] = useAddSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();

  const handleSubmit = async (values: z.infer<typeof sectionSchema>) => {
    const action = section ? "updated" : "added";

    const payload =
      action === "added"
        ? {
            name: values.name,
            status: values.status,
            courseId: courseId,
          }
        : {
            id: section?.id,
            body: {
              name: values.name,
              status: values.status,
              courseId: courseId,
            },
          };

    const toastId = toast.loading(
      action === "added" ? "Adding new section..." : "Updating section...",
      {
        duration: 2000,
        position: "top-center",
      },
    );

    try {
      const response =
        action === "added"
          ? await addSection(payload).unwrap()
          : await updateSection(payload).unwrap();

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
          ? "Failed to add new section!"
          : "Failed to update section!",
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
            placeholder="Enter name of the course"
            required
          />
          <SelectInput
            name="status"
            label="Status"
            placeholder="Select status"
            items={[
              {
                label: "Public",
                value: CourseSectionStatus.public,
              },
              {
                label: "Private",
                value: CourseSectionStatus.private,
              },
            ]}
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

export default SectionForm;
