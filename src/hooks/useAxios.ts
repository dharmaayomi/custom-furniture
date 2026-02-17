"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { axiosInstance } from "@/lib/axios";

const useAxios = () => {
  const isLoggingOutRef = useRef(false);
  const { data: session } = useSession();

  useEffect(() => {
    const requestIntercept = axiosInstance.interceptors.request.use(
      (config) => {
        const token =
          session?.user?.accessToken || (session as any)?.backendToken;
        const hasAuthorizationHeader = Boolean(
          config.headers?.Authorization || config.headers?.authorization,
        );

        if (token && !hasAuthorizationHeader) {
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

        // if (!isLoggingOut && status === 401 && code === "SESSION_EXPIRED") {
        //   isLoggingOut = true;
        //   signOut({
        //     callbackUrl: "/login?reason=session_expired",
        //   });
        // }
        if (
          !isLoggingOutRef.current &&
          status === 401 &&
          code === "SESSION_EXPIRED"
        ) {
          isLoggingOutRef.current = true;
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
