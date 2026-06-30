'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;

    if (token) {
      router.replace('/apps/demos-v2');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
