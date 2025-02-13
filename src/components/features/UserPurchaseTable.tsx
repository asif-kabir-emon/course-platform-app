import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import { formatDate, formatPrice } from "@/lib/formatter";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  SkeletonArray,
  SkeletonButton,
  SkeletonText,
} from "@/components/Skeleton";

const UserPurchaseTable = ({
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
  }[];
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
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
              {purchase.refundAt ? (
                <Badge variant="outline">Refunded</Badge>
              ) : (
                formatPrice(purchase.pricePaidInCent / 100)
              )}
            </TableCell>
            <TableCell>
              <Button variant="outline" className="hover:bg-black" asChild>
                <Link href={`/purchases/${purchase.id}`}>Details</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserPurchaseTable;

export function UserPurchaseTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
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
              <SkeletonButton />
            </TableCell>
          </TableRow>
        </SkeletonArray>
      </TableBody>
    </Table>
  );
}
