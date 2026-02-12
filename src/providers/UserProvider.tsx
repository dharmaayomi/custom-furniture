"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import useGetUserDisplay from "@/hooks/api/user/useGetUserDisplay";

type NavUser = {
  userName: string;
  email: string;
  avatar: string;
};

type UserContextValue = {
  navUser: NavUser | null;
  isLoading: boolean;
  logout: () => void;
  userId?: number;
};

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png";

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = session.data?.user?.id
    ? Number(session.data.user.id)
    : undefined;

  const { data: user, isLoading } = useGetUserDisplay(userId);

  useEffect(() => {
    if (!session.data?.user) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("had_session");
      }
      queryClient.removeQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          (query.queryKey[0] === "user-display" ||
            query.queryKey[0] === "user"),
      });
    }
  }, [session.data?.user, queryClient]);

  useEffect(() => {
    if (!session.data?.user) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("had_session", "1");
  }, [session.data?.user]);

  const navUser = useMemo<NavUser | null>(() => {
    if (!session.data?.user) return null;
    return {
      userName: user?.userName ?? session.data.user.userName ?? "User",
      email: user?.email ?? session.data.user.email ?? "",
      avatar: DEFAULT_AVATAR,
    };
  }, [session.data?.user, user?.userName, user?.email]);

  const logout = () => {
    queryClient.removeQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        (query.queryKey[0] === "user-display" ||
          query.queryKey[0] === "user"),
    });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("had_session");
    }
    signOut({ redirect: false });
  };

  return (
    <UserContext.Provider value={{ navUser, isLoading, logout, userId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
