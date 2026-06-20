"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/service/api-client";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  AlertTriangle,
  Check,
  CircleDollarSign,
  Clock3,
  Edit3,
  Pause,
  Play,
  Plus,
  Rocket,
  Sparkles,
  Tag,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PromotionStatus = "draft" | "scheduled" | "active" | "paused" | "expired";
type Promotion = {
  id: string;
  code: string;
  name: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerCustomer?: number | null;
  maximumRedeemAmountInCent?: number | null;
  redemptionCount: number;
  isActive: boolean;
  status?: PromotionStatus | null;
  minimumAmountInCent?: number | null;
  firstTimeCustomersOnly?: boolean | null;
  stripePromotionCodeId?: string | null;
};
type FormState = {
  code: string;
  name: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
  maxRedemptionsPerCustomer: string;
  maximumRedeemAmountInCent: string;
  minimumAmountInCent: string;
  firstTimeCustomersOnly: boolean;
};
type Confirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  action: () => Promise<unknown>;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  discountType: "percent",
  discountValue: "",
  startsAt: "",
  endsAt: "",
  maxRedemptions: "",
  maxRedemptionsPerCustomer: "",
  maximumRedeemAmountInCent: "",
  minimumAmountInCent: "",
  firstTimeCustomersOnly: false,
};

function getStatus(item: Promotion): PromotionStatus {
  return (
    item.status ??
    (item.stripePromotionCodeId
      ? item.isActive
        ? "active"
        : "paused"
      : "draft")
  );
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

const statusStyles: Record<PromotionStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  scheduled: "border-violet-200 bg-violet-50 text-violet-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function PromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | PromotionStatus>("all");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    const result = await apiClient("/admin/promotions");
    if (result.success) setPromotions(result.data);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () =>
      promotions.reduce(
        (result, item) => {
          result[getStatus(item)] += 1;
          return result;
        },
        { draft: 0, scheduled: 0, active: 0, paused: 0, expired: 0 },
      ),
    [promotions],
  );
  const visible =
    filter === "all"
      ? promotions
      : promotions.filter((item) => getStatus(item) === filter);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (item: Promotion) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      discountType: item.discountType,
      discountValue: String(item.discountValue),
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
      maxRedemptions: item.maxRedemptions ? String(item.maxRedemptions) : "",
      maxRedemptionsPerCustomer: item.maxRedemptionsPerCustomer
        ? String(item.maxRedemptionsPerCustomer)
        : "",
      maximumRedeemAmountInCent: item.maximumRedeemAmountInCent
        ? String(item.maximumRedeemAmountInCent)
        : "",
      minimumAmountInCent: item.minimumAmountInCent
        ? String(item.minimumAmountInCent)
        : "",
      firstTimeCustomersOnly: Boolean(item.firstTimeCustomersOnly),
    });
    setOpen(true);
  };

  const saveDraft = async () => {
    if (
      !form.code.trim() ||
      !form.name.trim() ||
      Number(form.discountValue) <= 0
    )
      return toast.error("Add a code, campaign name, and valid discount.");
    if (
      form.startsAt &&
      form.endsAt &&
      new Date(form.startsAt) >= new Date(form.endsAt)
    )
      return toast.error("The end must be after the start.");
    if (
      form.maxRedemptions &&
      form.maxRedemptionsPerCustomer &&
      Number(form.maxRedemptionsPerCustomer) > Number(form.maxRedemptions)
    )
      return toast.error("Per-customer uses cannot exceed total redemptions.");
    setBusy("save");
    const details = {
      ...form,
      discountValue: Number(form.discountValue),
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      maxRedemptionsPerCustomer: form.maxRedemptionsPerCustomer
        ? Number(form.maxRedemptionsPerCustomer)
        : null,
      maximumRedeemAmountInCent: form.maximumRedeemAmountInCent
        ? Number(form.maximumRedeemAmountInCent)
        : null,
      minimumAmountInCent: form.minimumAmountInCent
        ? Number(form.minimumAmountInCent)
        : null,
    };
    const result = editing
      ? await apiClient(`/admin/promotions/${editing.id}`, {
          method: "PATCH",
          body: { action: "update", details },
        })
      : await apiClient("/admin/promotions", { method: "POST", body: details });
    setBusy(null);
    if (!result.success) return toast.error(result.message);
    toast.success(result.message);
    setOpen(false);
    await load();
  };

  const performAction = async (
    item: Promotion,
    nextAction: "publish" | "pause" | "resume",
  ) => {
    setBusy(item.id);
    const result = await apiClient(`/admin/promotions/${item.id}`, {
      method: "PATCH",
      body: { action: nextAction },
    });
    setBusy(null);
    if (!result.success) return toast.error(result.message);
    toast.success(result.message);
    await load();
  };

  const action = async (
    item: Promotion,
    nextAction: "publish" | "pause" | "resume",
  ) => {
    if (nextAction !== "publish") return performAction(item, nextAction);
    setConfirmation({
      title: `Publish ${item.code}?`,
      description:
        "The promotion will be created in Stripe. It will become active now or at its scheduled start time.",
      confirmLabel: "Publish promotion",
      action: () => performAction(item, nextAction),
    });
  };

  const editPromotion = async (item: Promotion) => {
    if (getStatus(item) === "draft") return openEdit(item);
    setConfirmation({
      title: `Edit scheduled promotion ${item.code}?`,
      description:
        "Its pending Stripe schedule will be cancelled and the promotion will return to Draft. You will need to review and publish it again.",
      confirmLabel: "Return to draft",
      action: async () => {
        setBusy(item.id);
        const result = await apiClient(`/admin/promotions/${item.id}`, {
          method: "PATCH",
          body: { action: "revert_to_draft" },
        });
        setBusy(null);
        if (!result.success) return toast.error(result.message);
        toast.success(result.message);
        openEdit(result.data);
        await load();
      },
    });
  };

  const removePromotion = async (item: Promotion) => {
    const scheduled = ["scheduled", "paused"].includes(getStatus(item));
    setConfirmation({
      title: scheduled
        ? `Cancel and delete ${item.code}?`
        : `Delete draft ${item.code}?`,
      description: scheduled
        ? "The pending Stripe schedule will be cancelled before this promotion is permanently removed."
        : "This draft will be permanently removed. This action cannot be undone.",
      confirmLabel: scheduled ? "Cancel and delete" : "Delete draft",
      destructive: true,
      action: async () => {
        setBusy(item.id);
        const result = await apiClient(`/admin/promotions/${item.id}`, {
          method: "DELETE",
        });
        setBusy(null);
        if (!result.success) return toast.error(result.message);
        toast.success(result.message);
        await load();
      },
    });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    setConfirming(true);
    await confirmation.action();
    setConfirming(false);
    setConfirmation(null);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-background to-violet-500/[0.08] p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Promotions that launch on your terms
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Build safely in draft, schedule an exact window, control
              eligibility and usage, then publish when everything looks right.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-12 rounded-xl px-5 shadow-lg shadow-primary/20"
                onClick={openCreate}
              >
                <Plus className="size-5" /> New promotion
              </Button>
            </DialogTrigger>
            <PromotionDialog
              form={form}
              setForm={setForm}
              editing={editing}
              busy={busy === "save"}
              onSave={saveDraft}
            />
          </Dialog>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label="Active now"
            value={counts.active}
            icon={Play}
            tone="emerald"
          />
          <MiniStat
            label="Scheduled"
            value={counts.scheduled}
            icon={CalendarClock}
            tone="violet"
          />
          <MiniStat
            label="Drafts"
            value={counts.draft}
            icon={Edit3}
            tone="slate"
          />
          <MiniStat
            label="Total redemptions"
            value={promotions.reduce(
              (sum, item) => sum + item.redemptionCount,
              0,
            )}
            icon={UsersRound}
            tone="blue"
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campaign library</h3>
          <p className="text-sm text-muted-foreground">
            Review drafts, upcoming launches, and live offers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "all",
              "draft",
              "scheduled",
              "active",
              "paused",
              "expired",
            ] as const
          ).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "outline"}
              className="rounded-full capitalize"
              onClick={() => setFilter(item)}
            >
              {item}
              {item !== "all" && (
                <span className="ml-1 opacity-70">{counts[item]}</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 text-center">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <Tag className="size-7" />
          </div>
          <h3 className="mt-4 font-semibold">
            No {filter === "all" ? "promotions" : filter + " promotions"} yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a draft and shape the offer before it goes live.
          </p>
          <Button className="mt-4" variant="outline" onClick={openCreate}>
            <Plus className="size-4" /> Create draft
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <PromotionCard
              key={item.id}
              item={item}
              status={getStatus(item)}
              busy={busy === item.id}
              onEdit={() => editPromotion(item)}
              onAction={(next) => action(item, next)}
              onDelete={() => removePromotion(item)}
            />
          ))}
        </div>
      )}
      <Dialog
        open={confirmation != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !confirming) setConfirmation(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div
              className={cn(
                "mb-2 flex size-11 items-center justify-center rounded-xl",
                confirmation?.destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription className="leading-6">
              {confirmation?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmation(null)}
              disabled={confirming}
            >
              Keep promotion
            </Button>
            <Button
              type="button"
              variant={confirmation?.destructive ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={confirming}
            >
              {confirming ? "Working…" : confirmation?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromotionDialog({
  form,
  setForm,
  editing,
  busy,
  onSave,
}: {
  form: FormState;
  setForm: (value: FormState) => void;
  editing: Promotion | null;
  busy: boolean;
  onSave: () => void;
}) {
  const discountLabel =
    form.discountType === "percent"
      ? `${form.discountValue || "0"}% off`
      : `$${(Number(form.discountValue || 0) / 100).toFixed(2)} off`;
  return (
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-0 p-0 shadow-2xl">
      <div className="border-b bg-gradient-to-r from-primary/[0.12] to-violet-500/[0.08] p-6 sm:p-7">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Tag className="size-5" />
          </div>
          <DialogTitle className="text-2xl">
            {editing ? "Edit promotion draft" : "Create a promotion draft"}
          </DialogTitle>
          <DialogDescription>
            Nothing goes live yet. Review this draft from the campaign library,
            then publish it separately.
          </DialogDescription>
        </DialogHeader>
      </div>
      <div className="space-y-7 p-6 sm:p-7">
        <FormSection
          number="1"
          title="Offer details"
          description="Give the campaign an internal name and a memorable checkout code."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign name">
              <Input
                placeholder="Mid-year learning sale"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Promotion code">
              <Input
                placeholder="LEARN20"
                className="font-mono uppercase"
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.toUpperCase().replace(/\s/g, ""),
                  })
                }
              />
            </Field>
            <Field label="Discount type">
              <Select
                value={form.discountType}
                onValueChange={(discountType: "percent" | "fixed") =>
                  setForm({ ...form, discountType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage off</SelectItem>
                  <SelectItem value="fixed">Fixed amount off</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={
                form.discountType === "percent"
                  ? "Percentage"
                  : "Amount in cents"
              }
            >
              <Input
                type="number"
                min="1"
                max={form.discountType === "percent" ? "100" : undefined}
                placeholder={form.discountType === "percent" ? "20" : "1500"}
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
              />
            </Field>
          </div>
        </FormSection>
        <FormSection
          number="2"
          title="Availability window"
          description="Choose when the code starts and stops. Leave From empty to start when published, or To empty for no fixed end."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </Field>
            <Field label="To">
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </Field>
          </div>
        </FormSection>
        <FormSection
          number="3"
          title="Audience & limits"
          description="Control total redemptions, how often one customer can use the code, and the biggest discount this coupon can give."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Maximum redemptions"
              hint="One redemption represents one successful checkout."
            >
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.maxRedemptions}
                onChange={(e) =>
                  setForm({ ...form, maxRedemptions: e.target.value })
                }
              />
            </Field>
            <Field
              label="Maximum uses per customer"
              hint="Completed checkouts are counted per KnowVeria account."
            >
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.maxRedemptionsPerCustomer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxRedemptionsPerCustomer: e.target.value,
                  })
                }
              />
            </Field>
            <Field
              label="Minimum order in cents"
              hint="For example, 5000 means $50.00."
            >
              <Input
                type="number"
                min="0"
                placeholder="No minimum"
                value={form.minimumAmountInCent}
                onChange={(e) =>
                  setForm({ ...form, minimumAmountInCent: e.target.value })
                }
              />
            </Field>
            <Field
              label="Maximum redeem amount in cents"
              hint="For percentage coupons, this caps the discount amount. Example: 10% off with 500 means the discount will never exceed $5.00."
            >
              <Input
                type="number"
                min="1"
                placeholder="No cap"
                value={form.maximumRedeemAmountInCent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maximumRedeemAmountInCent: e.target.value,
                  })
                }
              />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-4 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={form.firstTimeCustomersOnly}
                onChange={(e) =>
                  setForm({ ...form, firstTimeCustomersOnly: e.target.checked })
                }
              />
              <span>
                <span className="block text-sm font-medium">
                  First-time customers only
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Stripe will reject the code if the customer already has a
                  completed transaction.
                </span>
              </span>
            </label>
          </div>
        </FormSection>
        <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/[0.05] p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            {form.discountType === "percent" ? "%" : "$"}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Draft preview
            </p>
            <p className="font-semibold">
              {form.name || "Untitled promotion"} · {discountLabel}
            </p>
            <p className="font-mono text-xs text-primary">
              {form.code || "YOURCODE"}
            </p>
          </div>
        </div>
      </div>
      <DialogFooter className="border-t bg-muted/20 p-5 sm:px-7">
        <Button variant="outline" type="button" className="sm:mr-auto" disabled>
          <Check className="size-4" /> Draft-first workflow
        </Button>
        <Button onClick={onSave} disabled={busy}>
          {busy ? "Saving…" : editing ? "Update draft" : "Save as draft"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {number}
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Play;
  tone: "emerald" | "violet" | "slate" | "blue";
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-700",
    violet: "bg-violet-500/10 text-violet-700",
    slate: "bg-slate-500/10 text-slate-700",
    blue: "bg-blue-500/10 text-blue-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-background/75 p-3 backdrop-blur">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          colors[tone],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PromotionCard({
  item,
  status,
  busy,
  onEdit,
  onAction,
  onDelete,
}: {
  item: Promotion;
  status: PromotionStatus;
  busy: boolean;
  onEdit: () => void;
  onAction: (action: "publish" | "pause" | "resume") => void;
  onDelete: () => void;
}) {
  const amount =
    item.discountType === "percent"
      ? `${item.discountValue}%`
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
        }).format(item.discountValue / 100);
  const usage = item.maxRedemptions
    ? Math.min(100, (item.redemptionCount / item.maxRedemptions) * 100)
    : 0;
  const hasNotStarted =
    item.startsAt != null && new Date(item.startsAt) > new Date();
  const formatDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "Open-ended";
  return (
    <Card className="group overflow-hidden border-border/70 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg">
      <div
        className={cn(
          "h-1.5",
          status === "active"
            ? "bg-emerald-500"
            : status === "scheduled"
              ? "bg-violet-500"
              : status === "paused"
                ? "bg-amber-500"
                : status === "expired"
                  ? "bg-rose-400"
                  : "bg-slate-300",
        )}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-lg font-semibold">{item.name}</h4>
              <Badge
                variant="outline"
                className={cn("capitalize", statusStyles[status])}
              >
                {status}
              </Badge>
            </div>
            <div className="mt-2 inline-flex rounded-lg border bg-muted/40 px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-primary">
              {item.code}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tracking-tight text-primary">
              {amount}
            </p>
            <p className="text-xs text-muted-foreground">off</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <Info
            icon={CalendarClock}
            label="From"
            value={item.startsAt ? formatDate(item.startsAt) : "On publish"}
          />
          <Info icon={Clock3} label="To" value={formatDate(item.endsAt)} />
          <Info
            icon={UsersRound}
            label="Usage"
            value={`${item.redemptionCount}${item.maxRedemptions ? ` of ${item.maxRedemptions}` : " · unlimited"}`}
          />
          <Info
            icon={CircleDollarSign}
            label="Minimum"
            value={
              item.minimumAmountInCent
                ? `$${(item.minimumAmountInCent / 100).toFixed(2)}`
                : "No minimum"
            }
          />
          <Info
            icon={CircleDollarSign}
            label="Discount cap"
            value={
              item.maximumRedeemAmountInCent
                ? `$${(item.maximumRedeemAmountInCent / 100).toFixed(2)}`
                : "No cap"
            }
          />
          <Info
            icon={UsersRound}
            label="Per customer"
            value={
              item.maxRedemptionsPerCustomer
                ? `${item.maxRedemptionsPerCustomer} use${item.maxRedemptionsPerCustomer === 1 ? "" : "s"}`
                : "Unlimited"
            }
          />
        </div>
        {item.maxRedemptions && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Redemptions</span>
              <span>{Math.round(usage)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${usage}%` }}
              />
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-2 border-t pt-4">
          {status === "draft" && (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAction("publish")}
                disabled={busy}
              >
                <Rocket className="size-4" /> Publish
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit3 className="size-4" /> Edit
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
          {status === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onAction("pause")}
              disabled={busy}
            >
              <Pause className="size-4" /> Pause promotion
            </Button>
          )}
          {status === "paused" &&
            (hasNotStarted ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={onEdit}
                  disabled={busy}
                >
                  <Edit3 className="size-4" /> Edit
                </Button>
                <Button
                  size="icon"
                  className="size-9"
                  onClick={() => onAction("resume")}
                  disabled={busy}
                  aria-label="Resume schedule"
                >
                  <Play className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 text-destructive"
                  onClick={onDelete}
                  disabled={busy}
                  aria-label="Delete paused promotion"
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onAction("resume")}
                disabled={busy}
              >
                <Play className="size-4" /> Resume promotion
              </Button>
            ))}
          {status === "scheduled" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={onEdit}
                disabled={busy}
              >
                <Edit3 className="size-4" /> Edit
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9"
                onClick={() => onAction("pause")}
                disabled={busy}
                aria-label="Pause schedule"
              >
                <Pause className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9 text-destructive"
                onClick={onDelete}
                disabled={busy}
                aria-label="Delete scheduled promotion"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
          {status === "expired" && (
            <p className="w-full py-2 text-center text-xs text-muted-foreground">
              This promotion has ended.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/35 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 line-clamp-2 font-medium leading-4">{value}</p>
    </div>
  );
}
