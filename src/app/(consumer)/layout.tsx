"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { decodedToken, validateToken } from "@/utils/validateToken";
import { AppName } from "@/constants/App.constant";

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
    const token = Cookies.get("accessToken");

    if (token) {
      const isValidToken = validateToken(
        token,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      );

      if (!isValidToken) {
        Cookies.remove("accessToken");
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }

      const decodedTokenData = decodedToken(
        token,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      ) as unknown as { success: boolean; data: { role: string } | null };

      if (
        decodedTokenData &&
        decodedTokenData.data &&
        decodedTokenData.data?.role === "admin"
      ) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }, []);

  const handleSignOut = () => {
    Cookies.remove("accessToken");
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  if (isLoggedIn === null) return null;

  return (
    <header className="flex h-12 shadow bg-background z-10">
      <nav className="flex gap-4 container">
        <Link
          href="/"
          className="mr-auto text-lg hover:underline flex items-center"
        >
          {AppName}
        </Link>

        {isLoggedIn && (
          <>
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
          </>
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
