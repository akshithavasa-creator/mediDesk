import Link from "next/link";
import { MediDeskLogo } from "@/components/MediDeskLogo";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <MediDeskLogo size="sm" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <Home className="h-7 w-7 text-zinc-400" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-zinc-900">Page not found</h1>
          <p className="mt-2 text-zinc-600">
            We could not find the page you were looking for.
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            This may be a broken link or the page has moved.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
