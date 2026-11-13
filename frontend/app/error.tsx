"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-base-200 p-6">
      <div className="max-w-md w-full bg-base-100 rounded-xl shadow-lg p-8 text-center space-y-4">
        <div className="size-14 rounded-2xl bg-error/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-7 text-error" />
        </div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-base-content/60 text-sm">
          An unexpected error occurred. You can try again or go back to the home page.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={reset} className="btn btn-primary btn-sm gap-2">
            <RotateCcw className="size-4" />
            Try again
          </button>
          <a href="/" className="btn btn-ghost btn-sm">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
