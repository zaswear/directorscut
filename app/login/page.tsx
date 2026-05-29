"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
    });

    if (result?.error) {
      setError("Credenciales incorrectas.");
      setLoading(false);
    } else {
      router.push("/peliculas");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl italic text-center mb-2 text-text">
          Director&rsquo;s Cut
        </h1>
        <p className="text-center text-sm text-text-faint mb-10">
          Mi diario cinematográfico
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-widest text-text-faint">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border border-border rounded px-4 py-2.5 text-base text-text placeholder:text-text-faint focus:border-border-focus focus:outline-none transition-colors"
              placeholder="zaswear"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-widest text-text-faint">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded px-4 py-2.5 text-base text-text placeholder:text-text-faint focus:border-border-focus focus:outline-none transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg font-sans font-medium text-sm rounded py-2.5 mt-2 hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
