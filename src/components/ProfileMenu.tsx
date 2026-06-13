import {
  Bookmark,
  GraduationCap,
  LogOutIcon,
  SettingsIcon,
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
          <div>
            <div className="font-semibold">
              {session.name || session.email.split("@")[0].toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              {session.email}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t py-4">
          <Link
            href="/bookmarks"
            className="flex items-center rounded-lg px-4 py-2 text-base font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <Bookmark className="mr-2 size-5" />
            Bookmarks
          </Link>
          <Link
            href="/grades"
            className="flex items-center rounded-lg px-4 py-2 text-base font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <GraduationCap className="mr-2 size-5" />
            Grades
          </Link>
          <Link
            href="/profile"
            className="flex items-center rounded-lg bg-secondary/60 px-4 py-2 text-base font-medium text-secondary-foreground hover:bg-primary/10 hover:text-primary"
          >
            <SettingsIcon className="size-5 mr-2" />
            Manage Account
          </Link>
          <div
            onClick={handleSignOut}
            className="flex cursor-pointer items-center rounded-lg bg-destructive/10 px-4 py-2 text-base font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOutIcon className="size-5 mr-2" />
            Sign Out
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
