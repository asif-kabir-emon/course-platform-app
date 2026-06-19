"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotFound() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/[0.08] via-background to-accent/[0.1] px-4 text-center">
      <div className="rounded-3xl border bg-card/90 p-8 backdrop-blur sm:p-12">
        <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-8xl font-black text-transparent sm:text-9xl">
          404
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
          Oops! The page you&apos;re looking for doesn&apos;t exist, or you
          don&apos;t have access to it.
        </p>

        <div className="relative mt-6 flex items-center justify-center space-x-2">
          <span
            className={`text-xl font-semibold text-foreground transition-opacity duration-500 sm:text-2xl ${
              isBlinking ? "opacity-100" : "opacity-40"
            }`}
          >
            Page Not Found
          </span>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
