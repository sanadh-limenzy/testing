import { 
  Home, 
  History, 
  GraduationCap, 
  Users, 
  FileText,
  LucideProps
} from "lucide-react";

export interface RouterConfigItem {
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  pathname: string;
}

export const routerConfig: RouterConfigItem[] = [
  {
    label: "Home",
    icon: Home,
    pathname: "home",
  },
  {
    label: "History",
    icon: History,
    pathname: "history",
  },
  {
    label: "Education",
    icon: GraduationCap,
    pathname: "education",
  },
  {
    label: "Referral",
    icon: Users,
    pathname: "referral",
  },
  {
    label: "Tax Filing",
    icon: FileText,
    pathname: "share-filing-info",
  }
];
