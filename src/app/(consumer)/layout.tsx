"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { decodedToken, validateToken } from "@/utils/validateToken";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogInIcon, LogOutIcon, Menu } from "lucide-react";
import ProfileMenu, { handleSignOut } from "@/components/ProfileMenu";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    <header className="sticky top-0 z-40 flex h-16 border-b border-border/70 bg-white/85 shadow-sm backdrop-blur-xl select-none">
      <nav className="container flex gap-4">
        <div className="flex items-center mr-auto">
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Menu
                  className="size-5 cursor-pointer mr-3"
                  onClick={() => setIsSheetOpen(!isSheetOpen)}
                />
              </SheetTrigger>
              <SheetContent side="left" className="!w-screen">
                <MobileNavMenu
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                  setOpen={setIsSheetOpen}
                />
              </SheetContent>
            </Sheet>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm text-white shadow-sm">
              {(process.env.NEXT_PUBLIC_APP_NAME || "C").charAt(0)}
            </span>
            {process.env.NEXT_PUBLIC_APP_NAME || "Course Platform"}
          </Link>
        </div>

        {isLoggedIn && (
          <div className="hidden md:flex gap-2">
            {isAdmin && (
              <Link
                className={cn(
                  "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary",
                  pathname.startsWith("/admin") && "font-bold text-primary",
                )}
                href="/admin"
              >
                Admin
              </Link>
            )}
            <Link
              className={cn(
                "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary",
                pathname.startsWith("/courses") && "font-bold text-primary",
              )}
              href="/courses"
            >
              My Courses
            </Link>
            <Link
              className={cn(
                "flex items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary",
                pathname.startsWith("/purchases") && "font-bold text-primary",
              )}
              href="/purchases"
            >
              Purchased History
            </Link>
          </div>
        )}

        {isLoggedIn ? (
          <div className="self-center">
            <ProfileMenu />
          </div>
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

const MobileNavMenu = ({
  isLoggedIn = false,
  isAdmin = false,
  setOpen,
}: {
  isLoggedIn?: boolean;
  isAdmin?: boolean | null;
  setOpen: (value: boolean) => void;
}) => {
  return (
    <div className="h-screen flex flex-col justify-between">
      {isLoggedIn && (
        <div className="flex-grow flex-col gap-3 mt-5">
          {isAdmin && (
            <Link
              className="flex items-center rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
              href="/admin"
              onClick={() => {
                window.location.href = "/admin";
                setOpen(false);
              }}
            >
              Admin
            </Link>
          )}
          <Link
            className="flex items-center rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
            href="/courses"
            onClick={() => {
              window.location.href = "/courses";
              setOpen(false);
            }}
          >
            My Courses
          </Link>
          <Link
            className="flex items-center rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
            href="/purchases"
            onClick={() => {
              window.location.href = "/purchases";
              setOpen(false);
            }}
          >
            Purchased History
          </Link>
        </div>
      )}

      {isLoggedIn && (
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
      )}

      {!isLoggedIn && (
        <div className="my-auto mx-auto">
          <Button
            className="py-5 px-7"
            onClick={() => {
              window.location.href = "/sign-in";
              setOpen(false);
            }}
          >
            <LogInIcon className="size-5 mr-1" />
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
};
