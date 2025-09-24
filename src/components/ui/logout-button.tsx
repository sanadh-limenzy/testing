"use client";

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";

interface LogoutButtonProps {
  role?: string;
  name?: string;
  email?: string;
  isCollapsed?: boolean;
}

export function LogoutButton({ name, email, isCollapsed = false }: LogoutButtonProps) {
  const { signOut } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
  };

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-center p-2"
        title={`${name || "User"} - ${email || "user@example.com"}`}
      >
        <User className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start text-left"
    >
      <LogOut className="mr-2 h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {name || "User"}
        </span>
        <span className="text-xs text-muted-foreground">
          {email || "user@example.com"}
        </span>
      </div>
    </Button>
  );
}
