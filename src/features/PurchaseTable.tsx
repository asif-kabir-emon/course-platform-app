import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { formatDate, formatPlural, formatPrice } from "@/lib/formatter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SkeletonArray,
  SkeletonButton,
  SkeletonText,
} from "@/components/Skeleton";
import { useRefundPurchaseMutation } from "@/redux/api/purchaseApi";
import { toast } from "sonner";
import { ActionButton } from "@/components/ActionButton";

const PurchaseTable = ({
  purchases,
}: {
  purchases: {
    id: string;
    productId: string;
    pricePaidInCent: number;
    createdAt: Date;
    refundAt: Date | null;
    productDetails: {
      name: string;
      imageUrls: string;
    };
    user: {
      email: string;
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  }[];
}) => {
  const [refundPurchase, { isLoading }] = useRefundPurchaseMutation();

  const handleRefund = async (id: string) => {
    const toasterId = toast.loading("Refunding purchase...", {
      position: "top-center",
      duration: 2000,
    });
    try {
      const response = await refundPurchase(id).unwrap();

      console.log(response);

      if (response.success) {
        toast.success("Refunded successfully.", {
          id: toasterId,
          duration: 2000,
        });
      } else {
        toast.error("Failed to refund. Please try again.", {
          id: toasterId,
          duration: 2000,
        });
      }
    } catch {
      toast.error("Failed to refund. Please try again.", {
        id: toasterId,
        duration: 2000,
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {formatPlural(
              purchases.length,
              {
                singular: "Purchase",
                plural: "Purchases",
              },
              {
                includeCount: true,
              },
            )}
          </TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((purchase) => (
          <TableRow key={purchase.id}>
            <TableCell>
              <div className="flex items-center gap-4">
                <Image
                  className="object-cover rounded size-12"
                  src={purchase.productDetails.imageUrls}
                  alt={purchase.productDetails.name}
                  width={192}
                  height={192}
                />
                <div className="flex flex-col gap-1">
                  <div className="font-semibold">
                    {purchase.productDetails.name}
                  </div>
                  <div className="text-muted-foreground">
                    {formatDate(purchase.createdAt)}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {purchase.user.profile.firstName || purchase.user.profile.lastName
                ? `${purchase.user.profile.firstName} ${purchase.user.profile.lastName}`
                : purchase.user.email.split("@")[0]}
            </TableCell>
            <TableCell>
              {purchase.refundAt ? (
                <Badge variant="outline">Refunded</Badge>
              ) : (
                formatPrice(purchase.pricePaidInCent / 100)
              )}
            </TableCell>
            <TableCell>
              {(purchase.refundAt === null || !purchase.refundAt) &&
                purchase.pricePaidInCent > 0 && (
                  <ActionButton
                    action={() => {
                      handleRefund(purchase.id);
                    }}
                    tryAction={isLoading}
                  >
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Refund
                    </Button>
                  </ActionButton>
                )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PurchaseTable;

export function PurchaseTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Purchase</TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SkeletonArray amount={3}>
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-4">
                <div className="size-12 bg-secondary animate-pulse rounded" />
                <div className="flex flex-col gap-1">
                  <SkeletonText className="w-36" />
                  <SkeletonText className="w-3/4" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <SkeletonText className="w-12" />
            </TableCell>
            <TableCell>
              <SkeletonText className="w-12" />
            </TableCell>
            <TableCell>
              <SkeletonButton />
            </TableCell>
          </TableRow>
        </SkeletonArray>
      </TableBody>
    </Table>
  );
}
