"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function ProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="container my-5 md:my-8 space-y-4">
      <div className="md:hidden">
        <MobileSideBar />
      </div>
      <div className="grid md:grid-cols-[250px,1fr] gap-8">
        <div className="py-2 hidden md:block">
          <DesktopSideBar />
        </div>
        <div className="py-2">{children}</div>
      </div>
    </div>
  );
}

const DesktopSideBar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1.5">
      <Link
        href="/profile"
        className={cn(
          "bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-lg flex items-center text-base",
          pathname === "/profile" &&
            "bg-neutral-800 text-white hover:bg-neutral-700",
        )}
      >
        Your Profile
      </Link>
      <Link
        href="/profile/change-password"
        className={cn(
          "bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-lg flex items-center text-base",
          pathname === "/profile/change-password" &&
            "bg-neutral-800 text-white hover:bg-neutral-700",
        )}
      >
        Change Password
      </Link>
    </div>
  );
};

const MobileSideBar = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div>
      <Select
        onValueChange={(value) => router.push(value)}
        defaultValue={pathname}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="/profile">Your Profile</SelectItem>
          <SelectItem value="/profile/change-password">
            Change Password
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
