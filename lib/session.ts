import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Obtiene la sesión en server components. Devuelve null si no hay sesión. */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Obtiene la sesión y redirige a /login si no existe.
 * Usar en server components de rutas protegidas.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
