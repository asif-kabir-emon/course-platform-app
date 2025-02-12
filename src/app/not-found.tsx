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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-gray-900">
      <h1 className="text-9xl font-bold text-gray-800">404</h1>
      <p className="mt-4 text-xl text-gray-600">
        Oops! The page you&apos;re looking for doesn&apos;t exist, or you
        don&apos;t have access to it.
      </p>

      <div className="relative mt-6 flex items-center space-x-2">
        <span className="text-4xl">🚀</span>
        <span
          className={`text-2xl font-semibold transition-opacity duration-500 ${
            isBlinking ? "opacity-100" : "opacity-40"
          }`}
        >
          Page Not Found
        </span>
      </div>

      <Link
        href="/"
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
