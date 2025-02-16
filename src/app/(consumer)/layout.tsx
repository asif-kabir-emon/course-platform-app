"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { decodedToken, validateToken } from "@/utils/validateToken";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogInIcon, LogOutIcon, Menu } from "lucide-react";

const handleSignOut = () => {
  Cookies.remove("accessToken");
  window.location.href = "/";
};

export default function ConsumerLayout({
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("accessToken");

      if (!token) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }

      const isValidToken = await validateToken(
        token,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      );

      if (!isValidToken) {
        Cookies.remove("accessToken");
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }

      const decodedTokenData = await decodedToken(
        token,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      );

      if (decodedTokenData.success && decodedTokenData.data?.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setIsLoggedIn(true);
    };

    checkAuth();
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <header className="flex h-12 shadow bg-background z-10 select-none">
      <nav className="flex gap-4 container">
        <div className="flex items-center mr-auto">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Menu className="size-5 cursor-pointer mr-3" />
              </SheetTrigger>
              <SheetContent side="left" className="!w-screen">
                <PhoneNavMenu isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="text-lg hover:underline flex items-center">
            {process.env.NEXT_PUBLIC_APP_NAME || "Course Platform"}
          </Link>
        </div>

        {isLoggedIn && (
          <div className="hidden md:flex gap-2">
            {isAdmin && (
              <Link
                className="hover:bg-accent/10 px-2 flex items-center"
                href="/admin"
              >
                Admin
              </Link>
            )}
            <Link
              className="hover:bg-accent/10 px-2 flex items-center"
              href="/courses"
            >
              My Courses
            </Link>
            <Link
              className="hover:bg-accent/10 px-2 flex items-center"
              href="/purchases"
            >
              Purchased History
            </Link>
          </div>
        )}

        {isLoggedIn ? (
          <Button className="self-center" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <Button
            className="self-center"
            onClick={() => (window.location.href = "/sign-in")}
          >
            Sign In
          </Button>
        )}
      </nav>
    </header>
  );
}

const PhoneNavMenu = ({
  isLoggedIn = false,
  isAdmin = false,
}: {
  isLoggedIn?: boolean;
  isAdmin?: boolean | null;
}) => {
  return (
    <div className="h-screen flex flex-col justify-between">
      {isLoggedIn && (
        <div className="flex-grow flex-col gap-1 mt-5">
          {isAdmin && (
            <Link
              className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
              href="/admin"
            >
              Admin
            </Link>
          )}
          <Link
            className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
            href="/courses"
          >
            My Courses
          </Link>
          <Link
            className="hover:bg-accent/10 px-3 py-1 rounded-lg flex items-center"
            href="/purchases"
          >
            Purchased History
          </Link>
        </div>
      )}

      {isLoggedIn && (
        <div className="mt-10 mb-10 md:mb-20">
          <Button className="py-5 px-7" onClick={handleSignOut}>
            <LogOutIcon className="size-5 mr-1" />
            Sign Out
          </Button>
        </div>
      )}

      {!isLoggedIn && (
        <div className="my-auto mx-auto">
          <Button
            className="py-5 px-7"
            onClick={() => (window.location.href = "/sign-in")}
          >
            <LogInIcon className="size-5 mr-1" />
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
};
