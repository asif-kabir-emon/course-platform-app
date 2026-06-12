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
    <div className="flex flex-col gap-2">
      <Link
        href="/profile"
        className={cn(
          "flex items-center rounded-xl border border-transparent bg-card px-5 py-3 text-base font-medium text-muted-foreground shadow-sm hover:border-primary/15 hover:bg-primary/5 hover:text-primary",
          pathname === "/profile" &&
            "border-primary/20 bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary/90 hover:text-primary-foreground",
        )}
      >
        Your Profile
      </Link>
      <Link
        href="/profile/change-password"
        className={cn(
          "flex items-center rounded-xl border border-transparent bg-card px-5 py-3 text-base font-medium text-muted-foreground shadow-sm hover:border-primary/15 hover:bg-primary/5 hover:text-primary",
          pathname === "/profile/change-password" &&
            "border-primary/20 bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary/90 hover:text-primary-foreground",
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
          <SelectItem
            value="/profile"
            className="my-1 cursor-pointer hover:!bg-primary/10 hover:!text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          >
            Your Profile
          </SelectItem>
          <SelectItem
            value="/profile/change-password"
            className="my-1 cursor-pointer hover:!bg-primary/10 hover:!text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          >
            Change Password
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
