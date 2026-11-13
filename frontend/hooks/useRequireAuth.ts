"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Redirects to /login when the auth check has finished and there is no user.
 * checkAuth itself runs once in CustomLayout - this hook only reacts to the result.
 */
export function useRequireAuth() {
  const { authUser, isCheckingAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      router.replace("/login");
    }
  }, [authUser, isCheckingAuth, router]);

  return { authUser, isCheckingAuth };
}
