import { Role } from "@/types/user";
import {
  BanknoteArrowUp,
  Bell,
  CreditCard,
  Frame,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  MapPin,
  Palette,
  Send,
  Settings2,
  SquareTerminal,
  User,
  type LucideIcon,
} from "lucide-react";

type NavMainItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: {
    title: string;
    url: string;
  }[];
};

type ProfileItem = {
  name: string;
  url: string;
  icon: LucideIcon;
};

type SecondaryItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type DashboardNavData = {
  navMain: NavMainItem[];
  profiles: ProfileItem[];
  navSecondary: SecondaryItem[];
};

const profiles: ProfileItem[] = [
  {
    name: "Profile Info",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    name: "Address",
    url: "/dashboard/address",
    icon: MapPin,
  },
  {
    name: "Security",
    url: "/dashboard/security",
    icon: Lock,
  },
  {
    name: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
  },
];

const navSecondary: SecondaryItem[] = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

const adminNavMain: NavMainItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "/dashboard/admin/orders",
    icon: SquareTerminal,
  },
  {
    title: "Revenue",
    url: "/dashboard/revenue",
    icon: BanknoteArrowUp,
  },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: Frame,
    items: [
      {
        title: "Component",
        url: "/dashboard/products/components",
      },
      {
        title: "Material",
        url: "/dashboard/products/materials",
      },
    ],
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2,
  },
];

const userNavMain: NavMainItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: SquareTerminal,
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Designs",
    url: "/dashboard/designs",
    icon: Palette,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2,
  },
];

const emptyNavData: DashboardNavData = {
  navMain: [],
  profiles: [],
  navSecondary,
};

export const getDashboardNavDataByRole = (
  role: Role | null,
): DashboardNavData => {
  if (!role) return emptyNavData;

  if (role === Role.ADMIN) {
    return {
      navMain: adminNavMain,
      profiles,
      navSecondary,
    };
  }

  return {
    navMain: userNavMain,
    profiles,
    navSecondary,
  };
};
