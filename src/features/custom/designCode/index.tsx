"use client";

import { CustomPage } from "@/features/custom";
import { axiosInstance } from "@/lib/axios";
import { saveDesignCodeToStorage } from "@/lib/designCode";
import { useRoomStore } from "@/store/useRoomStore";
import type { ShareableDesign } from "@/types/shareableDesign";
import React, { useEffect, useMemo, useState } from "react";

type DesignCodePageProps = {
  designCode: string;
};

export const DesignCodePage = ({ designCode }: DesignCodePageProps) => {
  const code = useMemo(
    () => decodeURIComponent(designCode || ""),
    [designCode],
  );
  const loadRoomState = useRoomStore((state) => state.loadRoomState);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!code) {
      setStatus("error");
      return;
    }

    let isActive = true;
    const run = async () => {
      try {
        const result = await axiosInstance.get<ShareableDesign>(
          `/design/shareable-design/${code}`,
        );
        const payload = result?.data;
        const configuration = payload?.configuration;
        if (!configuration) {
          if (isActive) setStatus("error");
          return;
        }
        if (!isActive) return;
        loadRoomState(configuration);
        setDesignCode(code);
        saveDesignCodeToStorage(code);
        setStatus("ready");
      } catch {
        if (isActive) setStatus("error");
      }
    };

    run();
    return () => {
      isActive = false;
    };
  }, [code, loadRoomState, setDesignCode]);

  if (status === "error") {
    return <div className="p-6 text-sm text-gray-600">Design not found.</div>;
  }

  if (status === "loading") {
    return <div className="p-6 text-sm text-gray-600">Loading design...</div>;
  }

  return <CustomPage />;
};
