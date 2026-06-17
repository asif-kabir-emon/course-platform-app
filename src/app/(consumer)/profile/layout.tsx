"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { User, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function ProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="container my-5 space-y-4 md:my-8">
      <div className="md:hidden">
        <MobileSideBar />
      </div>
      <div className="grid gap-8 md:grid-cols-[220px,1fr]">
        <div className="hidden py-2 md:block">
          <DesktopSideBar />
        </div>
        <div className="min-w-0 py-2">{children}</div>
      </div>
    </div>
  );
}

const sidebarLinks = [
  { href: "/profile", label: "Your Profile", icon: User },
  { href: "/profile/change-password", label: "Change Password", icon: Lock },
];

const DesktopSideBar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Profile navigation">
      {sidebarLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
              isActive && "bg-primary/10 font-semibold text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
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
          {sidebarLinks.map(({ href, label }) => (
            <SelectItem
              key={href}
              value={href}
              className="my-1 cursor-pointer text-sm hover:!bg-primary/10 hover:!text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-primary"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
