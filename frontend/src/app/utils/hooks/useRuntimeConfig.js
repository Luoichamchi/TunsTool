"use client";

import useSWR from "swr";

import { rawGetFetcher } from "@/app/api/globalFetcher";

export function useRuntimeConfig() {
  const { data, isLoading } = useSWR("/api/runtime-config", rawGetFetcher);

  return {
    mqttServer: data?.mqttServer || "",
    isLoading,
  };
}
