export const ProductStatus = {
  public: "public",
  private: "private",
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
