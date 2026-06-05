"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { NavUserMenu } from "@/features/custom/components/NavUserMenu";
import { useUser } from "@/providers/UserProvider";
import {
  FolderOpen,
  Frame,
  Home,
  Menu,
  PanelsTopLeft,
  Share2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

const menuActions = [
  {
    id: "menu-homepage-button",
    name: "menu-homepage",
    label: "Homepage",
    icon: Home,
  },
  {
    id: "menu-open-design-code-button",
    name: "menu-open-design-code",
    label: "Open Design Code",
    icon: FolderOpen,
  },
  {
    id: "menu-my-design-button",
    name: "menu-my-design",
    label: "My Design",
    icon: PanelsTopLeft,
  },
  {
    id: "menu-share-button",
    name: "menu-share",
    label: "Share",
    icon: Share2,
  },
  {
    id: "menu-start-from-scratch-button",
    name: "menu-start-from-scratch",
    label: "Start From Scratch",
    icon: Frame,
  },
];

export const MenuDrawer = () => {
  const { navUser } = useUser();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open menu"
          className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Menu className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="rounded-r-xl sm:max-w-sm md:max-w-80 md:data-[vaul-drawer-direction=left]:w-80!">
        <DrawerHeader className="border-black/5 px-4 pt-6 pb-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DrawerTitle className="text-foreground mx-3 text-lg font-semibold">
                Menu
              </DrawerTitle>
            </div>

            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Close menu"
                className="hover:bg-primary/20 dark:hover:bg-primary/10 size-9 rounded-2xl border-white/50 bg-white/70 shadow-none dark:border-white/10 dark:bg-white/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 px-4 py-4">
          <div className="pointer-events-auto relative flex flex-col gap-2 rounded-[1.75rem] border border-white/60 bg-white/55 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            {menuActions.map(({ id, name, label, icon: Icon }) => (
              <Button
                key={id}
                id={id}
                name={name}
                type="button"
                variant="ghost"
                className="group/menu-item h-11 justify-start gap-3 rounded-2xl px-3 text-sm font-semibold hover:bg-white/80 dark:hover:bg-white/10"
              >
                <Icon className="h-4 w-4" />
                <span className="transition-transform duration-150 group-hover/menu-item:translate-x-1">
                  {label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <DrawerFooter className="border-t border-black/5 px-4 pt-4 pb-4 dark:border-white/10">
          {navUser ? (
            <NavUserMenu user={navUser} />
          ) : (
            <Button
              type="button"
              onClick={handleLogin}
              id="menu-login-button"
              name="menu-login"
              className="bg-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-medium transition-opacity hover:opacity-90"
            >
              Login
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
