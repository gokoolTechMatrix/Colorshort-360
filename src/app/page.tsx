"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-rose-100 to-indigo-100 p-4 font-sans">
      <main className="w-full max-w-md rounded-3xl bg-white/95 p-10 shadow-2xl shadow-indigo-100">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="flex items-center justify-center">
            <Image
              src="/image.png"
              alt="Color Sort 360 logo"
              width={160}
              height={160}
              className="h-24 w-24 object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-400">
              Admin Portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Welcome Back
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Sign in to manage color sorting configurations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <input
                id="email"
                name="email"
                type="email"
                defaultValue="admin@qube360.com"
                className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <input
                id="password"
                name="password"
                type="password"
                defaultValue="Admin@123"
                className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition hover:shadow-indigo-300"
          >
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Need help? Contact system administrator.
        </p>
      </main>
    </div>
  );
}
