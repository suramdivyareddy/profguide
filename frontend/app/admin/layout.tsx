'use client';

import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User } from "@/types/user";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/');
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return null;
  }

  return <>{children}</>;
} 