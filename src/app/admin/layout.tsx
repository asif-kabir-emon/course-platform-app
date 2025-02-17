"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LogOutIcon, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileMenu, { handleSignOut, UserInfo } from "@/components/ProfileMenu";
import { decodedToken, validateToken } from "@/utils/validateToken";
import Cookies from "js-cookie";

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
  const [getUserInfo, setUserInfo] = useState<UserInfo>({
    id: "",
    email: "",
    name: "",
    role: "",
    imageUrl: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("accessToken");

      if (!token) {
        handleSignOut();
        return;
      }

      const isValidToken = await validateToken(
        token as string,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      );

      if (!token || !isValidToken) {
        handleSignOut();
        return;
      }

      const decodedTokenData = await decodedToken(
        token,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      );

      if (decodedTokenData.success && decodedTokenData.data?.role === "admin") {
        setUserInfo({
          id: decodedTokenData.data.id,
          email: decodedTokenData.data.email,
          role: decodedTokenData.data.role,
          imageUrl: decodedTokenData.data.role || "",
          name: decodedTokenData.data?.name || "",
        });
      } else {
        handleSignOut();
        return;
      }
    };

    checkAuth();
  }, []);

  return (
    <header className="flex h-12 shadow bg-background z-1 select-none">
      <nav className="flex gap-4 container">
        <div className="flex items-center gap-2 mr-auto">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Menu className="size-5 cursor-pointer mr-1" />
              </SheetTrigger>
              <SheetContent side="left" className="!w-screen">
                <PhoneNavMenu />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="text-lg hover:underline flex items-center">
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
          <ProfileMenu userInfo={getUserInfo} />
        </div>
      </nav>
    </header>
  );
}

const PhoneNavMenu = () => {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex-col gap-1 mt-5">
        <Link
          className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
          href="/admin/courses"
        >
          Courses
        </Link>
        <Link
          className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
          href="/admin/products"
        >
          Products
        </Link>
        <Link
          className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
          href="/admin/sales"
        >
          Sales
        </Link>
      </div>

      <div className="mt-10 mb-10 md:mb-20">
        <Button className="py-5 px-7" onClick={handleSignOut}>
          <LogOutIcon className="size-5 mr-1" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
