"use client";

import ProfileMenu, { handleSignOut } from "@/components/ProfileMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";
import type { jwtPayload } from "@/types";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Boxes,
  GraduationCap,
  LayoutDashboard,
  LogOutIcon,
  Menu,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Role = jwtPayload["role"];

type NavItem = {
  label: string;
  href: string;
  icon: typeof BookOpen;
  match?: string;
};

const learnerItems: NavItem[] = [
  {
    label: "My Courses",
    href: "/courses",
    match: "/courses",
    icon: BookOpen,
  },
  {
    label: "Bookmarks",
    href: "/bookmarks",
    match: "/bookmarks",
    icon: Bookmark,
  },
  {
    label: "Grades",
    href: "/grades",
    match: "/grades",
    icon: GraduationCap,
  },
  {
    label: "Purchases",
    href: "/purchases",
    match: "/purchases",
    icon: ReceiptText,
  },
];

const adminItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Courses",
    href: "/admin/courses",
    match: "/admin/courses",
    icon: BookOpen,
  },
  {
    label: "Products",
    href: "/admin/products",
    match: "/admin/products",
    icon: Boxes,
  },
  {
    label: "Sales",
    href: "/admin/sales",
    match: "/admin/sales",
    icon: BarChart3,
  },
];

const superAdminItems: NavItem[] = [
  ...adminItems,
  {
    label: "Staff",
    href: "/admin/staff",
    match: "/admin/staff",
    icon: UsersRound,
  },
];

const getNavigation = (role?: Role | null) => {
  if (role === "super_admin") return superAdminItems;
  if (role === "admin") return adminItems;
  if (role === "user") return learnerItems;
  return [];
};

const AppNavbar = () => {
  const pathname = usePathname();
  const { session, isReady } = useClientSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const items = getNavigation(session?.role);
  const isAdmin = session?.role === "admin" || session?.role === "super_admin";

  if (!isReady) {
    return (
      <header
        className="h-16 border-b border-border/70 bg-white/85"
        aria-label="Loading navigation"
      />
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 select-none border-b border-border/70 bg-white/85 shadow-sm backdrop-blur-xl">
      <nav className="layout-container flex items-center gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {session && (
            <div className="lg:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation"
                    className="-ml-2"
                  >
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-sm">
                  <MobileNavigation
                    items={items}
                    pathname={pathname}
                    setOpen={setIsSheetOpen}
                  />
                </SheetContent>
              </Sheet>
            </div>
          )}

          <Link
            href={isAdmin ? "/admin" : "/"}
            className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm text-white shadow-sm">
              {(process.env.NEXT_PUBLIC_APP_NAME || "C").charAt(0)}
            </span>
            <span className="truncate">
              {process.env.NEXT_PUBLIC_APP_NAME || "Course Platform"}
            </span>
          </Link>

          {isAdmin && (
            <Badge className="hidden shrink-0 capitalize sm:inline-flex">
              {session?.role === "super_admin" ? "Super admin" : "Admin"}
            </Badge>
          )}
        </div>

        <div className="ml-auto hidden items-stretch gap-1 lg:flex">
          {items.map((item) => (
            <DesktopNavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item)}
            />
          ))}
        </div>

        <div className="ml-auto shrink-0 lg:ml-1">
          {session ? (
            <ProfileMenu />
          ) : (
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

const DesktopNavLink = ({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) => (
  <Link
    href={item.href}
    className={cn(
      "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
      active && "bg-primary/10 font-semibold text-primary",
    )}
  >
    {item.label}
  </Link>
);

const MobileNavigation = ({
  items,
  pathname,
  setOpen,
}: {
  items: NavItem[];
  pathname: string;
  setOpen: (open: boolean) => void;
}) => (
  <div className="flex h-full flex-col pt-6">
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium tracking-tight text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
              active && "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </div>

    <Button
      type="button"
      variant="outline"
      className="mt-auto mb-6 justify-start gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
      onClick={() => {
        handleSignOut();
        setOpen(false);
      }}
    >
      <LogOutIcon className="size-5" />
      Sign out
    </Button>
  </div>
);

const isActivePath = (pathname: string, item: NavItem) => {
  if (item.href === "/admin") return pathname === "/admin";
  return pathname.startsWith(item.match ?? item.href);
};

export default AppNavbar;
