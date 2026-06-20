"use client";

import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/service/api-client";
import { authKey } from "@/constants/AuthKey.constant";
import Cookies from "js-cookie";
import {
  ArrowUpRight,
  BadgeDollarSign,
  BookOpenCheck,
  Download,
  Inbox,
  MailSearch,
  Percent,
  Plus,
  ReceiptText,
  Save,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UsersRound,
  UserRoundPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import PromotionManager from "@/features/business/PromotionManager";
import { cn } from "@/lib/utils";

type Settings = Record<string, string | boolean | null>;
type Customer = {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  profile?: { firstName?: string; lastName?: string };
  userCourseAccess: {
    courseId: string;
    source: string;
    courses: { name: string };
  }[];
  _count: { purchaseHistories: number };
};
type Course = { id: string; name: string };
type Delivery = {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  status: string;
  createdAt: string;
  failureReason?: string;
};
type Analytics = {
  revenueInCent: number;
  refundsInCent: number;
  refundRate: number;
  conversionRate: number;
  courseCompletionRate: number;
};

export default function BusinessPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>();
  const [grant, setGrant] = useState({
    userId: "",
    courseId: "",
    note: "",
    expiresAt: "",
  });

  const load = useCallback(async () => {
    const [business, customerData, courseData, emailData, analyticsData] =
      await Promise.all([
        apiClient("/admin/business"),
        apiClient("/admin/customers?pageSize=100"),
        apiClient("/courses"),
        apiClient("/admin/emails"),
        apiClient("/admin/analytics"),
      ]);
    if (business.success) setSettings(business.data);
    if (customerData.success) setCustomers(customerData.data);
    if (courseData.success) setCourses(courseData.data);
    if (emailData.success) setDeliveries(emailData.data);
    if (analyticsData.success) setAnalytics(analyticsData.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const download = async (kind: "sales" | "customers") => {
    const response = await fetch(`/api/admin/exports/${kind}`, {
      headers: { Authorization: `Bearer ${Cookies.get(authKey)}` },
    });
    if (!response.ok) return toast.error(`Could not export ${kind}.`);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `${kind}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSettings = async () => {
    const result = await apiClient("/admin/business", {
      method: "PATCH",
      body: settings,
    });
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  const updateAccess = async (method: "POST" | "DELETE", payload = grant) => {
    const result = await apiClient("/admin/customers", {
      method,
      body: payload,
    });
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    if (result.success) {
      setGrant({ userId: "", courseId: "", note: "", expiresAt: "" });
      void load();
    }
  };

  const money = (cents = 0) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);

  const analyticsCards = [
    {
      label: "30-day revenue",
      value: money(analytics?.revenueInCent),
      helper: "Gross sales in the last 30 days",
      icon: BadgeDollarSign,
      tone: "emerald" as const,
    },
    {
      label: "30-day refunds",
      value: money(analytics?.refundsInCent),
      helper: "Refunded value across recent purchases",
      icon: ReceiptText,
      tone: "rose" as const,
    },
    {
      label: "Customer conversion",
      value: `${analytics?.conversionRate ?? 0}%`,
      helper: "Visitors who became paying customers",
      icon: TrendingUp,
      tone: "blue" as const,
    },
    {
      label: "Refund rate",
      value: `${analytics?.refundRate ?? 0}%`,
      helper: "Share of purchases that were refunded",
      icon: ShieldCheck,
      tone: "amber" as const,
    },
    {
      label: "Course completion",
      value: `${analytics?.courseCompletionRate ?? 0}%`,
      helper: "Average lesson completion across learners",
      icon: BookOpenCheck,
      tone: "violet" as const,
    },
  ];

  const performanceCards = [
    {
      label: "Conversion health",
      value: analytics?.conversionRate ?? 0,
      target: 12,
      icon: UsersRound,
      description: "A quick view of how efficiently interest turns into sales.",
    },
    {
      label: "Refund control",
      value: analytics?.refundRate ?? 0,
      target: 5,
      inverse: true,
      icon: Percent,
      description:
        "Lower is better. Keep this comfortably below your internal threshold.",
    },
    {
      label: "Learning completion",
      value: analytics?.courseCompletionRate ?? 0,
      target: 70,
      icon: ArrowUpRight,
      description:
        "Shows whether students are getting through your course material.",
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader title="Business operations">
        <Button
          variant="outline"
          onClick={() => download("sales")}
          className="mr-2"
        >
          <Download className="size-4" /> Sales CSV
        </Button>
        <Button variant="outline" onClick={() => download("customers")}>
          <Download className="size-4" /> Customers CSV
        </Button>
      </PageHeader>
      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap justify-start rounded-xl border bg-muted/50 p-1.5">
          <TabsTrigger value="overview">Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="identity">Identity & tax</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-background to-violet-500/[0.08] p-6 shadow-sm sm:p-8">
            <div className="absolute -right-14 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <Badge
                  variant="outline"
                  className="mb-3 border-primary/20 bg-background/70 text-primary"
                >
                  30-day business snapshot
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Revenue, learner quality, and retention in one place
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Track the numbers that matter most before you launch a new
                  campaign, course bundle, or refund policy update.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                <KpiTile
                  label="Revenue"
                  value={money(analytics?.revenueInCent)}
                  tone="emerald"
                />
                <KpiTile
                  label="Conversion"
                  value={`${analytics?.conversionRate ?? 0}%`}
                  tone="blue"
                />
                <KpiTile
                  label="Completion"
                  value={`${analytics?.courseCompletionRate ?? 0}%`}
                  tone="violet"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {analyticsCards.map((item) => (
              <AnalyticsStatCard key={item.label} {...item} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card className="overflow-hidden border-primary/10">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg">Performance overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  A cleaner read on commercial health and learner outcomes.
                </p>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                {performanceCards.map((item) => (
                  <ProgressInsight key={item.label} {...item} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-card/95">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg">Executive summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick reading for operators and stakeholders.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <SummaryRow
                  label="Refund exposure"
                  value={
                    analytics?.refundRate
                      ? `${analytics.refundRate}% of purchases`
                      : "No refunds recorded"
                  }
                />
                <SummaryRow
                  label="Sales pace"
                  value={
                    analytics?.revenueInCent
                      ? `${money(analytics.revenueInCent)} in the last 30 days`
                      : "No revenue recorded yet"
                  }
                />
                <SummaryRow
                  label="Learner momentum"
                  value={
                    analytics?.courseCompletionRate
                      ? `${analytics.courseCompletionRate}% average completion`
                      : "No completion data yet"
                  }
                />
                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/[0.04] p-4 text-sm leading-6 text-muted-foreground">
                  Keep promotions, refunds, and course progress in balance. A
                  high conversion rate only matters when completion stays strong
                  and refunds remain controlled.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-5 space-y-5">
          <Card className="overflow-hidden border-primary/10">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle>Grant course access</CardTitle>
              <p className="text-sm text-muted-foreground">
                Give manual access, add internal notes, and set optional expiry
                dates for special enrollments.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 mt-4">
              <Select
                value={grant.userId}
                onValueChange={(userId) => setGrant({ ...grant, userId })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={grant.courseId}
                onValueChange={(courseId) => setGrant({ ...grant, courseId })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Internal note"
                value={grant.note}
                onChange={(event) =>
                  setGrant({ ...grant, note: event.target.value })
                }
              />
              <Input
                type="date"
                aria-label="Access expiry"
                value={grant.expiresAt}
                onChange={(event) =>
                  setGrant({ ...grant, expiresAt: event.target.value })
                }
              />
              <Button
                onClick={() => updateAccess("POST")}
                disabled={!grant.userId || !grant.courseId}
                className="shadow-sm shadow-primary/15"
              >
                <Plus className="size-4" /> Grant access
              </Button>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-primary/10">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Customer access overview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review purchase activity and see who currently has course
                    access.
                  </p>
                </div>
                <Badge variant="outline" className="bg-background/80">
                  {customers.length} customer{customers.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length === 0 ? (
                <EmptyPanel
                  icon={UserRoundPlus}
                  title="No customers yet"
                  description="When people sign up or buy a product, they will appear here for access management."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background/70">
                      <tr className="border-b text-left">
                        <th className="p-4 font-semibold">Customer</th>
                        <th className="p-4 font-semibold">Purchases</th>
                        <th className="p-4 font-semibold">Course access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b align-top transition-colors last:border-0 hover:bg-muted/20"
                        >
                          <td className="p-4">
                            <div className="font-medium">
                              {[
                                customer.profile?.firstName,
                                customer.profile?.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ") || customer.email.split("@")[0]}
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              {customer.email}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                              {customer._count.purchaseHistories}
                            </span>
                          </td>
                          <td className="p-4">
                            {customer.userCourseAccess.length === 0 ? (
                              <span className="text-sm text-muted-foreground">
                                No course access assigned yet
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {customer.userCourseAccess.map((access) => (
                                  <Badge
                                    key={access.courseId}
                                    variant="outline"
                                    className="gap-1 rounded-full border-primary/15 bg-primary/[0.04] px-3 py-1"
                                  >
                                    {access.courses.name} · {access.source}
                                    {access.source === "manual" && (
                                      <button
                                        aria-label={`Revoke ${access.courses.name}`}
                                        onClick={() =>
                                          updateAccess("DELETE", {
                                            ...grant,
                                            userId: customer.id,
                                            courseId: access.courseId,
                                          })
                                        }
                                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="mt-5">
          <PromotionManager />
        </TabsContent>

        <TabsContent value="identity" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Invoice, tax, and business identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
                ["legalName", "Legal business name"],
                ["tradingName", "Trading name"],
                ["supportEmail", "Support email"],
                ["taxId", "Tax ID / registration"],
                ["addressLine1", "Address"],
                ["city", "City"],
                ["state", "State / region"],
                ["postalCode", "Postal code"],
                ["country", "Country"],
                ["invoicePrefix", "Invoice prefix"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-1 text-sm">
                  <span>{label}</span>
                  <Input
                    value={String(settings[key] ?? "")}
                    onChange={(event) =>
                      setSettings({ ...settings, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(settings.automaticTaxEnabled)}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      automaticTaxEnabled: event.target.checked,
                    })
                  }
                />{" "}
                Enable Stripe automatic tax
              </label>
              <Button onClick={saveSettings}>
                <Save className="size-4" /> Save settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-5">
          <Card className="overflow-hidden border-primary/10">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Email delivery log</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track transactional email activity, delivery state, and
                    recent send attempts.
                  </p>
                </div>
                <Badge variant="outline" className="bg-background/80">
                  {deliveries.length} event{deliveries.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {deliveries.length === 0 ? (
                <EmptyPanel
                  icon={MailSearch}
                  title="No email activity yet"
                  description="Once receipts, confirmations, or other transactional emails are sent, their delivery history will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background/70">
                      <tr className="border-b text-left">
                        <th className="p-4 font-semibold">Recipient</th>
                        <th className="p-4 font-semibold">Template</th>
                        <th className="p-4 font-semibold">Subject</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b transition-colors last:border-0 hover:bg-muted/20"
                        >
                          <td className="p-4">{item.recipient}</td>
                          <td className="p-4 capitalize">
                            {item.template.replaceAll("_", " ")}
                          </td>
                          <td className="p-4">{item.subject}</td>
                          <td className="p-4">
                            <Badge
                              variant={
                                item.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={cn(
                                item.status === "sent" &&
                                  "border-emerald-200 bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "blue" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
    blue: "border-blue-200/80 bg-blue-50/80 text-blue-700",
    violet: "border-violet-200/80 bg-violet-50/80 text-violet-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-sm backdrop-blur",
        tones[tone],
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function AnalyticsStatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof TrendingUp;
  tone: "emerald" | "rose" | "blue" | "amber" | "violet";
}) {
  const tones = {
    emerald: "bg-emerald-500/10 text-emerald-700",
    rose: "bg-rose-500/10 text-rose-700",
    blue: "bg-blue-500/10 text-blue-700",
    amber: "bg-amber-500/10 text-amber-700",
    violet: "bg-violet-500/10 text-violet-700",
  };

  return (
    <Card className="border-primary/10 transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <CardTitle className="mt-2 text-2xl tracking-tight">
              {value}
            </CardTitle>
          </div>
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl",
              tones[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
      </CardHeader>
    </Card>
  );
}

function ProgressInsight({
  label,
  value,
  target,
  inverse,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  target: number;
  inverse?: boolean;
  icon: typeof TrendingUp;
  description: string;
}) {
  const normalized = inverse
    ? Math.max(0, 100 - value * (100 / Math.max(target, 1)))
    : Math.min(100, target > 0 ? (value / target) * 100 : value);

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <p className="text-lg font-bold">{value}%</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                inverse ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${Math.max(6, normalized)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {inverse ? "Target ceiling" : "Target benchmark"}: {target}%
            </span>
            <span>{Math.round(normalized)}% of target</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border bg-background p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="max-w-[18rem] text-right text-sm font-semibold leading-6">
        {value}
      </p>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
