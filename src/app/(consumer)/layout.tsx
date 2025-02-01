"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { validateToken } from "@/utils/validateToken";

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // Start with null to avoid hydration mismatch

  useEffect(() => {
    const token = Cookies.get("accessToken");

    if (token) {
      const isValidate = validateToken(
        token,
        process.env.NEXT_PUBLIC_JWT_SECRET as string,
      );

      if (!isValidate) {
        Cookies.remove("accessToken");
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleSignOut = () => {
    Cookies.remove("accessToken");
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) return null;

  return (
    <header className="flex h-12 shadow bg-background z-10">
      <nav className="flex gap-4 container">
        <Link
          href="/"
          className="mr-auto text-lg hover:underline px-2 flex items-center"
        >
          Course Platform App
        </Link>

        {isLoggedIn && (
          <>
            <Link
              className="hover:bg-accent/10 px-2 flex items-center"
              href="/admin"
            >
              Admin
            </Link>
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
