"use client";
import { Form } from "@/components/Form/Form";
import TextAreaInput from "@/components/Form/TextAreaInput";
import TextInput from "@/components/Form/TextInput";
import { Button } from "@/components/ui/button";
import { productDefaultValues, productSchema } from "@/schema/product.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import SelectInput from "../Form/SelectInput";
import {
  useAddProductMutation,
  useUpdateProductMutation,
} from "@/redux/api/productApi";
import MultiSelectInput from "../Form/MultiSelectInput";
import { useGetCoursesQuery } from "@/redux/api/courseApi";

const ProductForm = ({
  product,
}: {
  product?: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    priceInDollar: number;
    status: ProductStatus;
    courseIds: string[];
  };
}) => {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? productDefaultValues,
  });

  const router = useRouter();

  const { data: courses, isLoading: isFetchingData } = useGetCoursesQuery({});
  const [addProduct, { isLoading: isAdding }] = useAddProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const handleSubmit = async (values: z.infer<typeof productSchema>) => {
    const action = product ? "updated" : "added";

    const payload =
      action === "added"
        ? {
            name: values.name,
            description: values.description,
            imageUrl: values.imageUrl,
            priceInDollar: values.priceInDollar,
            status: values.status,
            courseIds: values.courseIds,
          }
        : {
            id: product?.id,
            body: {
              name: values.name,
              description: values.description,
              imageUrl: values.imageUrl,
              priceInDollar: values.priceInDollar,
              status: values.status,
              courseIds: values.courseIds,
            },
          };

    const toastId = toast.loading(
      action === "added" ? "Adding new product..." : "Updating product...",
      {
        duration: 2000,
        position: "top-center",
      },
    );

    try {
      const response =
        action === "added"
          ? await addProduct(payload).unwrap()
          : await updateProduct(payload).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
        router.push("/admin/products");
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(
        action === "added"
          ? "Failed to add new product!"
          : "Failed to update product!",
        { id: toastId, duration: 2000 },
      );
    }
  };

  return (
    <div>
      <Form schema={productSchema} {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              name="name"
              label="Name"
              placeholder="Enter name of the product"
              required
            />
            <TextInput
              name="priceInDollar"
              label="Price"
              type="number"
              placeholder="Enter price of the product"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              name="imageUrl"
              label="Image URL"
              placeholder="Enter image url of the product"
              required
            />
            <SelectInput
              name="status"
              label="Status"
              items={
                Object.values(ProductStatus).map((status) => ({
                  label:
                    status.charAt(0).toUpperCase() +
                    status.slice(1, status.length),
                  value: status,
                })) as { label: string; value: string }[]
              }
              placeholder="Select status"
              required
            />
          </div>

          <MultiSelectInput
            name="courseIds"
            label="Courses"
            placeholder="Select courses"
            items={[
              ...(courses?.data?.map(
                (course: { id: string; name: string }) => ({
                  label: course.name,
                  value: course.id,
                }),
              ) ?? []),
            ]}
            isDisabled={isFetchingData}
            required
          />
          <TextAreaInput
            name="description"
            label="Description"
            placeholder="Enter description of the product"
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

export default ProductForm;
