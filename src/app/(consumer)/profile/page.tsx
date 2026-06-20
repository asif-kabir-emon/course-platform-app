"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileAvatarEditor from "@/features/profile/ProfileAvatarEditor";
import { useGetUserProfileQuery } from "@/hooks/profile.hook";
import { useClientSession } from "@/hooks/useClientSession";
import { isAdminRole } from "@/constants/UserRole.constant";
import { authKey } from "@/constants/AuthKey.constant";
import { apiClient } from "@/service/api-client";
import { handleSignOut } from "@/components/ProfileMenu";
import Cookies from "js-cookie";
import {
  BookOpen, CalendarDays, CheckCircle2, Download, Mail, Pencil,
  ReceiptText, ShieldCheck, Trash2, UserRound,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: profileInfo, isLoading } = useGetUserProfileQuery({});
  const { session } = useClientSession();

  if (isLoading) return <ProfileSkeleton />;
  if (!profileInfo?.success) return <div className="error-panel">Failed to load your account. Try refreshing the page.</div>;

  const account = profileInfo.data;
  const profile = account.profile;
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || account.email.split("@")[0];
  const roleLabel = account.role === "super_admin" ? "Super administrator" : account.role === "admin" ? "Administrator" : "Learner";
  const joinedAt = new Date(account.createdAt || profile?.createdAt || Date.now());

  return <div className="space-y-6 pb-8">
    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="relative h-36 bg-gradient-to-br from-primary via-primary/85 to-violet-500 sm:h-44">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_24%),radial-gradient(circle_at_80%_0%,white_0,transparent_22%)]" />
      </div>
      <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-16 flex flex-col items-start gap-4 sm:-mt-20 sm:flex-row sm:items-end">
            <ProfileAvatarEditor imageUrl={profile?.imageUrl} name={fullName} />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{fullName}</h1>
                {account.isVerified && <span title="Verified account"><CheckCircle2 className="size-5 fill-primary text-white" /></span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
              <Badge variant="outline" className="mt-3 border-primary/20 bg-primary/5 text-primary"><ShieldCheck className="mr-1 size-3.5" /> {roleLabel}</Badge>
            </div>
          </div>
          <Button asChild className="sm:mb-1"><Link href="/profile/update"><Pencil className="size-4" /> Edit personal details</Link></Button>
        </div>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-3">
      <Stat icon={BookOpen} label="Course access" value={account.userCourseAccess.length} detail="Available courses" />
      <Stat icon={ReceiptText} label="Purchases" value={account.purchaseHistories.length} detail="Order history" />
      <Stat icon={CalendarDays} label="Member since" value={joinedAt.getFullYear()} detail={new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(joinedAt)} />
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" /> Personal information</CardTitle><p className="text-sm text-muted-foreground">The details attached to your KnowVeria account.</p></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="First name" value={profile?.firstName || "Not provided"} />
          <Detail label="Last name" value={profile?.lastName || "Not provided"} />
          <div className="sm:col-span-2"><Detail label="Email address" value={account.email} icon={Mail} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Privacy & account data</CardTitle><p className="text-sm text-muted-foreground">Download a copy of your information or manage your account.</p></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={exportData}><Download className="size-4" /> Export my data</Button>
          {!isAdminRole(session?.role) ? <Button variant="destructive" className="w-full justify-start" onClick={deleteAccount}><Trash2 className="size-4" /> Delete account</Button> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">Administrator accounts must be removed by another super administrator.</div>}
        </CardContent>
      </Card>
    </div>
  </div>;
}

function Stat({ icon: Icon, label, value, detail }: { icon: typeof BookOpen; label: string; value: number; detail: string }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold leading-none">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>;
}

function Detail({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 flex items-center gap-2 font-semibold">{Icon && <Icon className="size-4 text-primary" />}{value}</p></div>;
}

async function exportData() {
  const response = await fetch("/api/profile/data-export", { headers: { Authorization: `Bearer ${Cookies.get(authKey)}` } });
  if (!response.ok) return toast.error("Could not export your account data.");
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = "account-data.json"; link.click(); URL.revokeObjectURL(url);
}

async function deleteAccount() {
  if (!window.confirm("Permanently delete your account and remove course access? This cannot be undone.")) return;
  const result = await apiClient("/profile/account", { method: "DELETE" });
  if (!result.success) return toast.error(result.message);
  toast.success(result.message); handleSignOut();
}

function ProfileSkeleton() {
  return <div className="space-y-5"><div className="skeleton-shimmer h-80 rounded-3xl" /><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton-shimmer h-28 rounded-2xl" />)}</div><div className="skeleton-shimmer h-64 rounded-2xl" /></div>;
}
