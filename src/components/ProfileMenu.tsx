import {
  Bookmark,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  LayoutDashboard,
  LogOutIcon,
  ReceiptText,
  SettingsIcon,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useClientSession } from "@/hooks/useClientSession";
import { clearClientSession } from "@/lib/clientSession";
import { isAdminRole, isSuperAdminRole } from "@/constants/UserRole.constant";

export const handleSignOut = () => {
  clearClientSession();
  window.location.href = "/";
};

const ProfileMenu = () => {
  const { session, isReady } = useClientSession();

  if (!isReady) {
    return (
      <Avatar className="border-2 border-primary/15 ring-2 ring-primary/5">
        <AvatarImage src={""} />
        <AvatarFallback className="skeleton-shimmer"></AvatarFallback>
      </Avatar>
    );
  }

  if (!session) {
    return (
      <Avatar className="border-2 border-primary/15 ring-2 ring-primary/5">
        <AvatarImage src={""} />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }

  const isAdmin = isAdminRole(session.role);
  const menuItems = isAdmin
    ? [
        { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
        { href: "/admin/business", label: "Business Operations", icon: BriefcaseBusiness },
        ...(isSuperAdminRole(session.role)
          ? [{ href: "/admin/staff", label: "Staff Management", icon: UsersRound }]
          : []),
        { href: "/profile", label: "Account Settings", icon: SettingsIcon },
      ]
    : [
        { href: "/courses", label: "My Courses", icon: BookOpen },
        { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
        { href: "/grades", label: "Grades", icon: GraduationCap },
        { href: "/purchases", label: "Purchases", icon: ReceiptText },
        { href: "/profile", label: "Manage Account", icon: SettingsIcon },
      ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:!bg-none focus:!bg-none hover:cursor-pointer select-none">
        <Avatar className="border-2 border-primary/20 ring-2 ring-primary/10 transition hover:border-primary/40">
          <AvatarImage src={session.imageUrl} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
            {session.name
              ? session.name.charAt(0).toUpperCase()
              : session.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="mt-2 rounded-xl border-border/80 p-3 shadow-xl md:min-w-[300px] select-none"
      >
        <div className="flex items-center justify-start gap-2.5 py-4">
          <Avatar className="border-2 border-primary/20">
            <AvatarImage src={session.imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
              {session.name
                ? session.name.charAt(0).toUpperCase()
                : session.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold">
              {session.name || session.email.split("@")[0].toUpperCase()}
            </div>
            <div className="truncate text-sm text-muted-foreground">
              {session.email}
            </div>
            <div className="mt-1 text-xs font-medium capitalize text-primary">
              {session.role === "super_admin"
                ? "Super administrator"
                : session.role === "admin"
                  ? "Administrator"
                  : "Learner"}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t py-4">
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center rounded-lg px-4 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Icon className="mr-2 size-5" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex cursor-pointer items-center rounded-lg bg-destructive/10 px-4 py-2 text-base font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOutIcon className="size-5 mr-2" />
            Sign Out
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
