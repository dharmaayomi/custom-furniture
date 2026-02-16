"use client";

import { CustomPage } from "@/features/custom";
import useGetSavedDesignByCode from "@/hooks/api/design/useGetSavedDesignByCode";
import useGetSharedDesignByCode from "@/hooks/api/design/useGetSharedDesignByCode";
import { saveDesignCodeToStorage } from "@/lib/designCode";
import { useUser } from "@/providers/UserProvider";
import { useRoomStore } from "@/store/useRoomStore";
import React, { useEffect, useMemo } from "react";

type DesignCodePageProps = {
  designCode: string;
};

export const DesignCodePage = ({ designCode }: DesignCodePageProps) => {
  const code = useMemo(
    () => decodeURIComponent(designCode || ""),
    [designCode],
  );
  const { userId } = useUser();
  const loadRoomState = useRoomStore((state) => state.loadRoomState);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);

  const {
    data: savedDesignData,
    isLoading: isLoadingSavedDesign,
  } = useGetSavedDesignByCode(userId, code);
  const {
    data: sharedDesignData,
    isLoading: isLoadingSharedDesign,
  } = useGetSharedDesignByCode(code);

  const savedPayload = (savedDesignData as any)?.data ?? savedDesignData;
  const sharedPayload = (sharedDesignData as any)?.data ?? sharedDesignData;
  const savedConfiguration = savedPayload?.configuration;
  const sharedConfiguration = sharedPayload?.configuration;
  const configuration = savedConfiguration ?? sharedConfiguration;
  const isLoading = userId
    ? (isLoadingSavedDesign || isLoadingSharedDesign) && !configuration
    : isLoadingSharedDesign && !configuration;

  useEffect(() => {
    if (!code || !configuration) return;
    loadRoomState(configuration);
    setDesignCode(code);
    saveDesignCodeToStorage(code);
  }, [code, configuration, loadRoomState, setDesignCode]);

  if (!code || (!isLoading && !configuration)) {
    return <div className="p-6 text-sm text-gray-600">Design not found.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-600">Loading design...</div>;
  }

  return <CustomPage />;
};
