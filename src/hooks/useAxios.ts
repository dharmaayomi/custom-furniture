"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { axiosInstance } from "@/lib/axios";

let isLoggingOut = false;

const useAxios = () => {
  const { data: session } = useSession();

  useEffect(() => {
    const requestIntercept = axiosInstance.interceptors.request.use(
      (config) => {
        const token =
          session?.user?.accessToken || (session as any)?.backendToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
    );

    const responseIntercept = axiosInstance.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err.response?.status;
        const code = err.response?.data?.code;

        if (!isLoggingOut && status === 401 && code === "SESSION_EXPIRED") {
          isLoggingOut = true;
          signOut({
            callbackUrl: "/login?reason=session_expired",
          });
        }

        return Promise.reject(err);
      },
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestIntercept);
      axiosInstance.interceptors.response.eject(responseIntercept);
    };
  }, [session]);

  return axiosInstance;
};

export default useAxios;
