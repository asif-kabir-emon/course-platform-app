"use client";
import PageHeader from "@/components/PageHeader";
import { SkeletonText, TableSkeleton } from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber, formatPrice } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import {
  useGetAdminDashboardDataQuery,
  useGetPaymentReliabilityQuery,
} from "@/redux/api/purchaseApi";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  GraduationCap,
  Layers3,
  Package,
  PlayCircle,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import React from "react";

const AdminPage = () => {
  const { data: dashboard, isLoading } = useGetAdminDashboardDataQuery({});
  const { data: reliability } = useGetPaymentReliabilityQuery({});

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboard.success === false) {
    return (
      <div className="page-shell">
        <div className="error-panel">
          <span>Failed to fetch data. </span>
          <span>{dashboard.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader title="Dashboard" />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Revenue overview</h2>
          <p className="text-sm text-muted-foreground">
            Sales and purchase performance at a glance.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Net Sales"
            value={formatPrice(dashboard.data.netSales, {
              showZeroAsNumber: true,
            })}
            icon={CircleDollarSign}
            tone="primary"
          />
          <StatCard
            title="Refunded Sales"
            value={formatPrice(dashboard.data.refundedSales, {
              showZeroAsNumber: true,
            })}
            icon={RotateCcw}
            tone="rose"
          />
          <StatCard
            title="Active Purchases"
            value={formatNumber(dashboard.data.totalUnRefundedPPurchases)}
            icon={ShoppingBag}
            tone="sky"
          />
          <StatCard
            title="Refunded Purchases"
            value={formatNumber(dashboard.data.totalRefundedPurchases)}
            icon={ReceiptText}
            tone="amber"
          />
          <StatCard
            title="Average Sale"
            value={formatPrice(dashboard.data.averageNetSales, {
              showZeroAsNumber: true,
            })}
            icon={TrendingUp}
            tone="emerald"
          />
        </div>
      </section>

      <section className="mt-8">
        <div
          className={cn(
            "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
            reliability?.success &&
              reliability.data.failedEvents === 0 &&
              reliability.data.staleProcessingEvents === 0
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-amber-500/20 bg-amber-500/5",
          )}
        >
          <div className="flex items-start gap-3">
            {reliability?.success &&
            reliability.data.failedEvents === 0 &&
            reliability.data.staleProcessingEvents === 0 ? (
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="mt-0.5 size-6 shrink-0 text-amber-600" />
            )}
            <div>
              <h2 className="font-semibold">Payment processing health</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Stripe webhook delivery and fulfillment status.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-background/80 px-4 py-2">
              <div className="text-xl font-bold">
                {reliability?.data?.failedEvents ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="rounded-xl bg-background/80 px-4 py-2">
              <div className="text-xl font-bold">
                {reliability?.data?.staleProcessingEvents ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Stuck</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Platform activity</h2>
          <p className="text-sm text-muted-foreground">
            Current learning content and audience totals.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Students"
            value={formatNumber(dashboard.data.totalStudents)}
            icon={GraduationCap}
            tone="primary"
          />
          <StatCard
            title="Products"
            value={formatNumber(dashboard.data.totalProducts)}
            icon={Package}
            tone="sky"
          />
          <StatCard
            title="Courses"
            value={formatNumber(dashboard.data.totalCourses)}
            icon={BookOpen}
            tone="emerald"
          />
          <StatCard
            title="Sections"
            value={formatNumber(dashboard.data.totalSections)}
            icon={Layers3}
            tone="amber"
          />
          <StatCard
            title="Lessons"
            value={formatNumber(dashboard.data.totalLessons)}
            icon={PlayCircle}
            tone="rose"
          />
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent purchases</h2>
            <p className="text-sm text-muted-foreground">
              The five latest transactions on the platform.
            </p>
          </div>
          <Badge variant="secondary" className="mt-2 w-fit sm:mt-0">
            Latest 5
          </Badge>
        </div>
        {dashboard.data.last5Purchases.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[240px]">Product</TableHead>
                  <TableHead className="min-w-[260px]">Customer</TableHead>
                  <TableHead className="min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[110px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Date</TableHead>
                </TableRow>
              </TableHeader>
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
                      <TableCell>
                        <div className="font-medium">
                          {purchase.product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[260px] truncate text-muted-foreground">
                          {purchase.user.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(purchase.pricePaidInCent / 100, {
                          showZeroAsNumber: true,
                        })}
                      </TableCell>
                      <TableCell>
                        {purchase.isRefunded ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-destructive/20 bg-destructive/10 text-destructive"
                          >
                            Refunded
                          </Badge>
                        ) : (
                          <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15">
                            Paid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="font-medium">No purchases found.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New transactions will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;

const StatCard = ({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: "primary" | "sky" | "emerald" | "amber" | "rose";
}) => {
  const tones = {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky-500/10 text-sky-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
  };

  return (
    <Card className="group hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-3 p-4 sm:p-5">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
            {title}
          </p>
          <p className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">
            {value}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="page-shell space-y-10" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-40" />
      {[1, 2].map((group) => (
        <div key={group} className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, item) => (
              <Card key={item}>
                <CardHeader className="flex flex-row items-center gap-3 p-4">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <SkeletonText className="w-20" />
                    <SkeletonText className="h-6 w-16" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ))}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <TableSkeleton columns={5} rows={5} />
      </div>
    </div>
  );
};
