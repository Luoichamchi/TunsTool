"use client";

import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useRuntimeConfig() {
  const { data } = useSWR("/api/runtime-config", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000,
  });
  return data ?? {};
}
