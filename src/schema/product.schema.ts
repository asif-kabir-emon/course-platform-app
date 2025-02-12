import { ProductStatus } from "@prisma/client";
import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string({
      message: "Product name is required",
    })
    .min(4, {
      message: "Product name must be at least 4 characters",
    }),
  description: z
    .string({
      message: "Product description is required",
    })
    .min(4, {
      message: "Product description must be at least 4 characters",
    }),
  imageUrl: z
    .string({
      message: "Product image url is required",
    })
    .url({
      message: "Product image url must be a valid url",
    })
    .min(4, {
      message: "Product image url must be at least 4 characters",
    }),
  priceInDollar: z
    .number({
      message: "Product price is required",
    })
    .min(0, {
      message: "Product price must be at least 0",
    })
    .default(0),
  status: z
    .enum([ProductStatus.public, ProductStatus.private], {
      message: "Product status is required",
    })
    .default(ProductStatus.private),
  courseIds: z.array(z.string()).min(1, {
    message: "Product must have at least one course",
  }),
});

export const productDefaultValues: z.infer<typeof productSchema> = {
  name: "",
  description: "",
  imageUrl: "",
  priceInDollar: 0,
  status: ProductStatus.private,
  courseIds: [],
};
