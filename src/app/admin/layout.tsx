"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LogOutIcon, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileMenu, { handleSignOut } from "@/components/ProfileMenu";

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

  return (
    <header className="flex h-12 shadow bg-background z-1 select-none">
      <nav className="flex gap-4 container">
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
            className="text-lg hover:underline flex items-center"
          >
            {process.env.NEXT_PUBLIC_APP_NAME || "Course Platform"}
          </Link>
          <Badge>Admin</Badge>
        </div>

        <div className="hidden md:flex gap-3">
          <Link
            className="hover:bg-accent/10 px-2 flex items-center"
            href="/admin/courses"
          >
            Courses
          </Link>
          <Link
            className="hover:bg-accent/10 px-2 flex items-center"
            href="/admin/products"
          >
            Products
          </Link>
          <Link
            className="hover:bg-accent/10 px-2 flex items-center"
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
          className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
          href="/admin/courses"
          onClick={() => {
            window.location.href = "/admin/courses";
            setOpen(false);
          }}
        >
          Courses
        </Link>
        <Link
          className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
          href="/admin/products"
          onClick={() => {
            window.location.href = "/admin/products";
            setOpen(false);
          }}
        >
          Products
        </Link>
        <Link
          className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
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
