"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, Suspense, useState } from "react";

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <header className="flex h-12 shadow bg-background z-10">
      <nav className="flex gap-4 container">
        <Link
          href="/"
          className="mr-auto text-lg hover:underline px-2 flex items-center"
        >
          Course Platform App
        </Link>
        <Suspense>
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
        </Suspense>
        <Suspense>
          {isLoggedIn ? (
            <Button
              className="self-center"
              onClick={() => {
                setIsLoggedIn(false);
              }}
            >
              Sign Out
            </Button>
          ) : (
            <Button
              className="self-center"
              onClick={() => {
                window.location.href = "/sign-in";
              }}
            >
              Sign In
            </Button>
          )}
        </Suspense>
      </nav>
    </header>
  );
}
