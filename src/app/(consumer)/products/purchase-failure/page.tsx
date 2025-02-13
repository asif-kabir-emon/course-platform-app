import { Button } from "@/components/ui/button";
import Link from "next/link";

const ProductPurchaseFailurePage = () => {
  return (
    <div className="container my-6">
      <div className="flex flex-col gap-4 items-start">
        <div className="text-3xl font-semibold">Purchase Failed</div>
        <div className="text-xl">
          There was a problem purchasing your product.
        </div>
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-2 rounded-r-md text-sm text-muted-foreground">
          Purchase failed due to a network error or, a payment failure on the
          payment gateway or, already purchased the product.
        </div>
        <Button asChild className="text-xl h-auto py-4 px-8 rounded-lg">
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </div>
  );
};

export default ProductPurchaseFailurePage;
