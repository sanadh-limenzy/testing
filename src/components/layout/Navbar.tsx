"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/string-utils";
import { useUserData } from "@/hooks/useUserData";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export function Navbar() {
  const queryClient = useQueryClient();
  const { user, signOut } = useAuthContext();
  const { userData } = useUserData();

  const handleLogout = async () => {
    await signOut();
    queryClient.clear()
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage
                src={userData?.userProfile?.profile_picture_url}
                alt="Profile"
              />
              <AvatarFallback>
                {getInitials(
                  user?.user_metadata?.first_name,
                  user?.user_metadata?.last_name
                )}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.first_name}{" "}
                  {user?.user_metadata?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/${
                  user?.user_metadata.user_type === "Subscriber"
                    ? "subscriber"
                    : user?.user_metadata.user_type === "Accountant"
                    ? "accountant"
                    : "admin"
                }/profile`}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/${
                  user?.user_metadata.user_type === "Subscriber"
                    ? "subscriber"
                    : user?.user_metadata.user_type === "Accountant"
                    ? "accountant"
                    : "admin"
                }/settings`}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
