"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/peliculas";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-6">

      {/* Wordmark */}
      <div className="mb-10 text-center">
        <h1
          className="font-display italic text-[52px] leading-tight tracking-[-0.01em] text-text"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          Director&rsquo;s Cut
        </h1>
        <p className="mt-2 text-sm text-text-faint tracking-wide">
          Mi vida en el cine
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[340px] space-y-5"
      >
        {/* Usuario */}
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-[11px] uppercase tracking-[0.12em] text-text-faint"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            Usuario
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            placeholder="zaswear"
            className="w-full bg-surface border border-[var(--border)] rounded-[6px] px-4 py-2.5 text-[15px] text-text placeholder:text-text-faint transition-colors duration-150 focus:outline-none focus:border-[var(--border-focus)]"
          />
        </div>

        {/* Contraseña */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] uppercase tracking-[0.12em] text-text-faint"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full bg-surface border border-[var(--border)] rounded-[6px] px-4 py-2.5 text-[15px] text-text placeholder:text-text-faint transition-colors duration-150 focus:outline-none focus:border-[var(--border-focus)]"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-[13px] text-[var(--error)]">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[6px] py-2.5 text-[14px] font-medium tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:  loading ? "var(--accent)" : "var(--accent)",
            color:       "var(--bg)",
            fontFamily:  "var(--font-dm-sans), system-ui, sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
          }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
