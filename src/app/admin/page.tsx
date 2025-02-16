"use client";
import { SkeletonText } from "@/components/Skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber, formatPrice } from "@/lib/formatter";
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
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard title="Net Sales">
          {formatPrice(dashboard.data.netSales, {
            showZeroAsNumber: true,
          })}
        </StatCard>
        <StatCard title="Refunded Sales">
          {formatPrice(dashboard.data.refundedSales, {
            showZeroAsNumber: true,
          })}
        </StatCard>
        <StatCard title="Un-Refunded Purchases">
          {formatNumber(dashboard.data.totalUnRefundedPPurchases)}
        </StatCard>
        <StatCard title="Refunded Purchases">
          {formatNumber(dashboard.data.totalRefundedPurchases)}
        </StatCard>
        <StatCard title="Purchases Per User">
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
