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
import { useRefundPurchaseMutation } from "@/hooks/purchase.hook";
import { toast } from "sonner";
import { ActionButton } from "@/components/ActionButton";

const PurchaseTable = ({
  purchases,
  embedded = false,
  canRefund = false,
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
  embedded?: boolean;
  canRefund?: boolean;
}) => {
  const [refundPurchase, { isLoading }] = useRefundPurchaseMutation();

  const handleRefund = async (id: string, closeDialog: () => void) => {
    const toasterId = toast.loading("Refunding purchase...", {
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
        toast.error(response.message || "Failed to refund. Please try again.", {
          id: toasterId,
          duration: 2000,
        });
      }
    } catch {
      toast.error("Failed to refund. Please try again.", {
        id: toasterId,
        duration: 2000,
      });
    } finally {
      closeDialog();
    }
  };

  return (
    <div
      className={
        embedded
          ? "overflow-x-auto"
          : "overflow-hidden rounded-xl border bg-card shadow-sm"
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[300px]">
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
            <TableHead className="min-w-[220px]">Customer</TableHead>
            <TableHead className="min-w-[110px]">Amount</TableHead>
            <TableHead className="min-w-[110px]">Status</TableHead>
            <TableHead className="w-[1%] min-w-[120px] whitespace-nowrap text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Image
                    className="size-12 rounded-lg object-cover"
                    src={purchase.productDetails.imageUrls}
                    alt={purchase.productDetails.name}
                    width={192}
                    height={192}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">
                      {purchase.productDetails.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(purchase.createdAt)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {purchase.user.profile.firstName ||
                    purchase.user.profile.lastName
                      ? `${purchase.user.profile.firstName} ${purchase.user.profile.lastName}`
                      : purchase.user.email.split("@")[0]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {purchase.user.email}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatPrice(purchase.pricePaidInCent / 100)}
              </TableCell>
              <TableCell>
                {purchase.refundAt ? (
                  <Badge
                    variant="outline"
                    className="border-destructive/20 bg-destructive/10 text-destructive"
                  >
                    Refunded
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15">
                    Paid
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end">
                  {canRefund &&
                    (purchase.refundAt === null || !purchase.refundAt) &&
                    purchase.pricePaidInCent > 0 && (
                      <ActionButton
                        action={(closeDialog: () => void) => {
                          void handleRefund(purchase.id, closeDialog);
                        }}
                        tryAction={isLoading}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Refund
                        </Button>
                      </ActionButton>
                    )}
                  {!canRefund &&
                    !purchase.refundAt &&
                    purchase.pricePaidInCent > 0 && (
                      <span
                        className="text-xs text-muted-foreground"
                        title="Only super admins can issue refunds"
                      >
                        Super admin required
                      </span>
                    )}
                  {purchase.refundAt && (
                    <span className="text-sm text-muted-foreground">
                      No action required
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PurchaseTable;

export function PurchaseTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purchase</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SkeletonArray amount={3}>
            <TableRow>
              <TableCell>
                <div className="flex items-center gap-4">
                  <div className="skeleton-shimmer size-12 rounded" />
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
                <SkeletonText className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <SkeletonButton />
              </TableCell>
            </TableRow>
          </SkeletonArray>
        </TableBody>
      </Table>
    </div>
  );
}
