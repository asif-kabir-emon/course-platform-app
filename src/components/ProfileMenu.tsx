import { LogOutIcon, SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Cookies from "js-cookie";
import { useVerifyTokenQuery } from "@/redux/api/authApi";

export const handleSignOut = () => {
  Cookies.remove("accessToken");
  window.location.href = "/";
};

const ProfileMenu = () => {
  const { data: authData, isLoading } = useVerifyTokenQuery({});

  if (isLoading) {
    return (
      <Avatar className="border-2 border-primary/15 ring-2 ring-primary/5">
        <AvatarImage src={""} />
        <AvatarFallback className="bg-secondary animate-pulse"></AvatarFallback>
      </Avatar>
    );
  }

  if (authData.success === false) {
    return (
      <Avatar className="border-2 border-primary/15 ring-2 ring-primary/5">
        <AvatarImage src={""} />
        <AvatarFallback className="bg-secondary animate-pulse"></AvatarFallback>
      </Avatar>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:!bg-none focus:!bg-none hover:cursor-pointer select-none">
        <Avatar className="border-2 border-primary/20 ring-2 ring-primary/10 transition hover:border-primary/40">
          <AvatarImage src={authData.data.imageUrl} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
            {authData.data.name
              ? authData.data.name.charAt(0).toUpperCase()
              : authData.data.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="mt-2 rounded-xl border-border/80 p-3 shadow-xl md:min-w-[300px] select-none"
      >
        <div className="flex items-center justify-start gap-2.5 py-4">
          <Avatar className="border-2 border-primary/20">
            <AvatarImage src={authData.data.imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
              {authData.data.name
                ? authData.data.name.charAt(0).toUpperCase()
                : authData.data.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">
              {authData.data.name ||
                authData.data.email.split("@")[0].toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              {authData.data.email}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t py-4">
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
