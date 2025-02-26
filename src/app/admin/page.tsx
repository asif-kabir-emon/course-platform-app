"use client";
import PageHeader from "@/components/PageHeader";
import { SkeletonText } from "@/components/Skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/formatter";
import { useGetAdminDashboardDataQuery } from "@/redux/api/purchaseApi";
import React, { ReactNode } from "react";

const AdminPage = () => {
  const { data: dashboard, isLoading } = useGetAdminDashboardDataQuery({});

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboard.success === false) {
    return (
      <div className="container my-8">
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          <span>Failed to fetch data. </span>
          <span>{dashboard.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard title="Net Sales">${dashboard.data.netSales}</StatCard>
        <StatCard title="Refunded Sales">
          ${dashboard.data.refundedSales}
        </StatCard>
        <StatCard title="Un-Refunded Purchases">
          {formatNumber(dashboard.data.totalUnRefundedPPurchases)}
        </StatCard>
        <StatCard title="Refunded Purchases">
          {formatNumber(dashboard.data.totalRefundedPurchases)}
        </StatCard>
        <StatCard title="Purchases Per User">
          $
          {formatNumber(dashboard.data.averageNetSales, {
            maximumFractionDigits: 2,
          })}
        </StatCard>
        <StatCard title="Students">
          {formatNumber(dashboard.data.totalStudents)}
        </StatCard>
        <StatCard title="Products">
          {formatNumber(dashboard.data.totalProducts)}
        </StatCard>
        <StatCard title="Courses">
          {formatNumber(dashboard.data.totalCourses)}
        </StatCard>
        <StatCard title="Sections">
          {formatNumber(dashboard.data.totalLessons)}
        </StatCard>
        <StatCard title="Lessons">
          {formatNumber(dashboard.data.totalLessons)}
        </StatCard>
      </div>
      <div className="my-12">
        {/* // Last 5 purchases */}
        <h2 className="text-lg font-semibold">Last 5 Purchases</h2>
        {dashboard.data.last5Purchases.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full mt-4 table-auto">
              <TableRow>
                <TableHead className="min-w-[280px]">Product</TableHead>
                <TableHead className="min-w-[280px]">User</TableHead>
                <TableHead className="min-w-[60px]">Price</TableHead>
                <TableHead className="min-w-[90px]">Refunded</TableHead>
                <TableHead className="min-w-[150px]">Date</TableHead>
              </TableRow>
              <TableBody>
                {dashboard.data.last5Purchases.map(
                  (purchase: {
                    id: string;
                    product: { name: string };
                    user: { email: string };
                    pricePaidInCent: number;
                    isRefunded: boolean;
                    createdAt: string;
                  }) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.product.name}</TableCell>
                      <TableCell>{purchase.user.email}</TableCell>
                      <TableCell>${purchase.pricePaidInCent / 100}</TableCell>
                      <TableCell>
                        {purchase.isRefunded ? "Yes" : "No"}
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-muted-foreground">No purchases found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

const StatCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-bold text-2xl">{children}</CardTitle>
      </CardHeader>
    </Card>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="container my-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item}>
            <Card>
              <CardHeader className="text-center">
                <CardDescription>
                  <SkeletonText />
                </CardDescription>
                <CardTitle className="font-bold text-2xl">
                  <SkeletonText className="h-8" />
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
