import Link from "next/link";
import { MessageSquareOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-base-200 p-6">
      <div className="max-w-md w-full bg-base-100 rounded-xl shadow-lg p-8 text-center space-y-4">
        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <MessageSquareOff className="size-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="text-base-content/60 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary btn-sm">
          Back to chat
        </Link>
      </div>
    </div>
  );
}
