"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";
import Cookies from "js-cookie";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { AppName } from "@/constants/App.constant";

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
  const router = useRouter();

  const handleSignOut = () => {
    Cookies.remove("accessToken");
    router.push("/");
  };

  return (
    <header className="flex h-12 shadow bg-background z-10">
      <nav className="flex gap-4 container">
        <div className="mr-auto flex items-center gap-2">
          <Link href="/admin" className="text-lg hover:underline">
            {AppName}
          </Link>
          <Badge>Admin</Badge>
        </div>

        <>
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

          <Button className="self-center" onClick={handleSignOut}>
            Sign Out
          </Button>
        </>
      </nav>
    </header>
  );
}
