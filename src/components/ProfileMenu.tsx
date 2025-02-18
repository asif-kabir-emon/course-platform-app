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
      <Avatar className="border-[2px] hover:border-[3px] border-slate-200">
        <AvatarImage src={""} />
        <AvatarFallback className="bg-slate-300 animate-pulse"></AvatarFallback>
      </Avatar>
    );
  }

  if (authData.success === false) {
    return (
      <Avatar className="border-[2px] hover:border-[3px] border-slate-200">
        <AvatarImage src={""} />
        <AvatarFallback className="bg-slate-300 animate-pulse"></AvatarFallback>
      </Avatar>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:!bg-none focus:!bg-none hover:cursor-pointer">
        <Avatar className="border-[2px] hover:border-[3px] border-slate-200">
          <AvatarImage src={authData.data.imageUrl} />
          <AvatarFallback className="bg-accent text-white">
            {authData.data.name
              ? authData.data.name.charAt(0).toUpperCase()
              : authData.data.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mt-1 px-3 md:min-w-[300px]">
        <div className="flex items-center justify-start gap-2.5 py-4">
          <Avatar className="border-[2px] border-slate-300">
            <AvatarImage src={authData.data.imageUrl} />
            <AvatarFallback className="bg-accent text-white">
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
            <div className="text-sm">{authData.data.email}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-300 py-4">
          <Link
            href="/profile"
            className="bg-slate-50 hover:bg-accent/10 px-4 py-2 rounded-lg flex items-center text-base"
          >
            <SettingsIcon className="size-5 mr-2" />
            Manage Account
          </Link>
          <div
            onClick={handleSignOut}
            className="bg-gray-300 hover:bg-accent/50 hover:cursor-pointer px-4 py-2 rounded-lg flex items-center text-base"
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
