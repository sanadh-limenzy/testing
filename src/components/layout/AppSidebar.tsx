"use client";
import * as React from "react";
import {
  LayoutDashboard,
  LucideProps,
  Package,
  TrendingUp,
  UserCog,
  UserCircle,
  Users,
  CalendarCheck,
  Crown,
  FileText,
  MessageSquare,
  Gift,
  CreditCard,
  GraduationCap,
  Star,
  Building,
  ClipboardList,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import { routerConfig } from "@/config/RouterConfig";
import { usePathname } from "next/navigation";
import { SkeletonList } from "../ui/skeleton-loaders";

// Admin sidebar configuration
export const sidebarMenuConfig = [
  {
    label: "Dashboard",
    route: "/admin/home",
    iconType: "Dashboard",
    permissionKey: "", // Assuming no specific permission for Dashboard
  },
  {
    label: "Clients",
    route: "/admin/clients",
    iconType: "Sidebar_Users",
    permissionKey: "Show_Clients",
  },
  {
    label: "Tax Pros",
    route: "/admin/taxpros",
    iconType: "Tax_Pro",
    permissionKey: "Show_Accountants",
  },
  {
    label: "Referral Partners",
    route: "/admin/referral-partners",
    iconType: "Referral_Partners",
    permissionKey: "Show_Referrals",
  },
  {
    label: "Team Members",
    route: "/admin/team-members",
    iconType: "Employees",
    permissionKey: "", // Assuming no specific permission for Employees
  },
  {
    label: "Education",
    route: "/admin/education",
    iconType: "Education",
    permissionKey: "Show_Education",
  },
  {
    label: "Transactions",
    route: "/admin/transactions",
    iconType: "Transaction",
    permissionKey: "Show_Transactions",
  },
  {
    label: "Promo Codes",
    route: "/admin/promo-code",
    iconType: "PromoCode",
    permissionKey: "Show_Promocodes",
  },
  {
    label: "Feedback",
    route: "/admin/feedback",
    iconType: "Feedback",
    permissionKey: "Show_Feedback",
  },
  {
    label: "Vendor Partnerships",
    route: "/admin/vendors",
    iconType: "Vendor_Partnerships",
    permissionKey: "Show_Vendors",
  },
  {
    label: "User Reviews",
    route: "/admin/user-reviews",
    iconType: "User_Reviews",
    permissionKey: "Show_Reviews",
  },
  {
    label: "Rent Records",
    route: "/admin/rent-records",
    iconType: "Rent_Records",
    permissionKey: "Show_Records",
  },
  {
    label: "Documents",
    route: "/admin/documents",
    iconType: "Documents-new",
    permissionKey: "Show_Referrals",
  },
  {
    label: "All Plans",
    route: "/admin/all-plans",
    iconType: "Crown",
    permissionKey: "",
  },
];

// Icon mapping for admin sidebar
const iconMap: Record<
  string,
  React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >
> = {
  Dashboard: LayoutDashboard,
  Sidebar_Users: Users,
  Tax_Pro: UserCog,
  Referral_Partners: TrendingUp,
  Employees: Users,
  Education: GraduationCap,
  Transaction: CreditCard,
  PromoCode: Gift,
  Feedback: MessageSquare,
  Vendor_Partnerships: Building,
  User_Reviews: Star,
  Rent_Records: ClipboardList,
  "Documents-new": FileText,
  Crown: Crown,
};

// Navigation data with role-based access
const getNavigationData = (userRole: "Admin" | "Accountant" | "Subscriber") => {
  const navItems: {
    title: string;
    url: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
    isSubscriberItem?: boolean;
  }[] = [];

  // Role-specific navigation items
  if (userRole) {
    switch (userRole) {
      case "Admin":
        // Use the admin sidebar configuration
        sidebarMenuConfig.forEach((item) => {
          navItems.push({
            title: item.label,
            url: item.route,
            icon: iconMap[item.iconType] || LayoutDashboard,
          });
        });
        break;

      case "Accountant":
        navItems.push(
          {
            title: "Dashboard",
            url: "/sales/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "Products",
            url: "/agent/product",
            icon: Package,
          },
          {
            title: "My Bookings",
            url: "/agent/my-bookings",
            icon: CalendarCheck,
          },
          {
            title: "My Profile",
            url: "/settings/profile",
            icon: UserCircle,
          }
        );
        break;

      case "Subscriber":
        routerConfig.forEach((item) => {
          navItems.push({
            title: item.label,
            url: `/subscriber/${item.pathname}`,
            icon: item.icon,
            isSubscriberItem: true,
          });
        });
        break;
    }
  }

  return navItems;
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar();

  const userType = user?.user_metadata.user_type;

  const userRole = userType as "Admin" | "Accountant" | "Subscriber";
  const navigationData = getNavigationData(userRole);

  // Function to handle mobile menu item clicks and close the sidebar
  const handleMobileMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Link href="/" className="relative block w-full h-full" onClick={handleMobileMenuClick}>
                {open || isMobile ? (
                  <Image
                    src="/assets/tar-logo.png"
                    alt="The Augusta Rule"
                    fill
                    sizes="(max-width: 768px) 150px, 200px"
                    className="object-contain"
                    priority
                  />
                ) : (
                  <Image
                    src="/assets/tar-logo-clipped.png"
                    alt="The Augusta Rule"
                    fill
                    sizes="50px"
                    className="object-contain"
                    priority
                  />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-5">
        <SidebarGroup>
          <SidebarGroupContent>
            {loading ? (
              <SkeletonList count={4} />
            ) : (
              <SidebarMenu>
                {navigationData.map((item) => {
                  // For subscribers, use routerConfig data with icons
                  if (userRole === "Subscriber" && item.isSubscriberItem) {
                    const routerItem = routerConfig.find(
                      (config) => config.label === item.title
                    );
                    const isActive = pathname === `/${routerItem?.pathname}`;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} onClick={handleMobileMenuClick}>
                            {routerItem &&
                              React.createElement(routerItem.icon, {
                                className: "w-5 h-5",
                                size: 20,
                              })}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  // For Admin and Accountant roles
                  const isActive = pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} onClick={handleMobileMenuClick}>
                          {React.createElement(item.icon)}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
