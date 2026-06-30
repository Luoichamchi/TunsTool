"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/apps/demos-v2');
  }, [router]);

  return null;
}
