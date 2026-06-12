"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LogOutIcon, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileMenu, { handleSignOut } from "@/components/ProfileMenu";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function Navbar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 border-b border-border/70 bg-white/85 shadow-sm backdrop-blur-xl select-none">
      <nav className="container flex gap-4">
        <div className="flex items-center gap-2 mr-auto">
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Menu
                  className="size-5 cursor-pointer mr-1"
                  onClick={() => setIsSheetOpen(!isSheetOpen)}
                />
              </SheetTrigger>
              <SheetContent side="left" className="!w-screen">
                <PhoneNavMenu setOpen={setIsSheetOpen} />
              </SheetContent>
            </Sheet>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm text-white shadow-sm">
              {(process.env.NEXT_PUBLIC_APP_NAME || "C").charAt(0)}
            </span>
            {process.env.NEXT_PUBLIC_APP_NAME || "Course Platform"}
          </Link>
          <Badge>Admin</Badge>
        </div>

        <div className="hidden md:flex gap-3">
          <Link
            className={cn(
              "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary",
              pathname.startsWith("/admin/courses") && "font-bold text-primary",
            )}
            href="/admin/courses"
          >
            Courses
          </Link>
          <Link
            className={cn(
              "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary",
              pathname.startsWith("/admin/products") &&
                "font-bold text-primary",
            )}
            href="/admin/products"
          >
            Products
          </Link>
          <Link
            className={cn(
              "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary",
              pathname.startsWith("/admin/sales") && "font-bold text-primary",
            )}
            href="/admin/sales"
          >
            Sales
          </Link>
        </div>

        <div className="self-center ml-1">
          <ProfileMenu />
        </div>
      </nav>
    </header>
  );
}

const PhoneNavMenu = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex-col gap-1 mt-5">
        <Link
          className="flex items-center rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
          href="/admin/courses"
          onClick={() => {
            window.location.href = "/admin/courses";
            setOpen(false);
          }}
        >
          Courses
        </Link>
        <Link
          className="flex items-center rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
          href="/admin/products"
          onClick={() => {
            window.location.href = "/admin/products";
            setOpen(false);
          }}
        >
          Products
        </Link>
        <Link
          className="flex items-center rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
          href="/admin/sales"
          onClick={() => {
            window.location.href = "/admin/sales";
            setOpen(false);
          }}
        >
          Sales
        </Link>
      </div>

      <div className="mt-10 mb-10 md:mb-20">
        <Button
          className="py-5 px-7"
          onClick={() => {
            handleSignOut();
            setOpen(false);
          }}
        >
          <LogOutIcon className="size-5 mr-1" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
