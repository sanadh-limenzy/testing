"use client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { useEffect } from "react";
import { useIsNotFoundPage } from "../providers/not-found-provider";

const excludedRoutes = ["/auth", "/not-found", "/404"];

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const { isNotFoundPage } = useIsNotFoundPage();

  useEffect(() => {
    if (!user && !excludedRoutes.includes(pathname) && !loading) {
      router.push("/auth");
    }
  }, [user, pathname, router, loading]);

  if (!user && !excludedRoutes.includes(pathname)) {
    return null;
  }

  if (excludedRoutes.includes(pathname) || isNotFoundPage) {
    return <>{children}</>;
  }

  // Determine sidebar width based on user type
  const isAdmin = user?.user_metadata?.user_type === "Admin";
  const sidebarWidth = isAdmin ? "12rem" : "10rem";

  return (
    <SidebarProvider width={sidebarWidth}>
      <AppSidebar />
      <div className="w-full transition-all duration-300 ease-in-out">
        <Navbar />
        {children}
      </div>
    </SidebarProvider>
  );
}
