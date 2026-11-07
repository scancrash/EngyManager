"use client";

import Image from "next/image";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not sign in.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded border border-white/25 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--brand)] p-4 text-white">
      <div className="w-full max-w-sm">
        <Image
          src="/kintiga-logo.png"
          alt="Kintiga"
          width={640}
          height={163}
          priority
          className="mx-auto mb-8 h-14 w-auto"
        />
        <form onSubmit={submit} className="rounded-xl bg-[color:var(--brand-2)] p-6 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold">Project Budget Tracker</h1>
          <p className="mb-5 text-sm text-white/70">Sign in to continue.</p>

          <label className="mb-3 block text-sm">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="mb-4 block text-sm">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p role="alert" className="mb-3 text-sm text-[#ffb199]">
              ▲ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-[color:var(--accent)] px-3 py-2 font-semibold text-[color:var(--brand)] hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
