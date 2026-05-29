import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOmdbById, parseOmdbMovie } from "@/lib/omdb";
import { z } from "zod";

export const maxDuration = 60;

const JUSTWATCH_GQL = "https://apis.justwatch.com/graphql";

// ─── Helper GQL ──────────────────────────────────────────────────────────────

async function gql(token: string, query: string, variables = {}) {
  const res = await fetch(JUSTWATCH_GQL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ─── Introspección: descubre los campos disponibles en el root Query ──────────

const INTROSPECT = `query { __schema { queryType { fields { name } } } }`;

// ─── Queries candidatas (probamos en orden) ───────────────────────────────────

const CANDIDATES = [
  // Versión actual más probable: bajo "me"
  {
    name: "me.seenlist",
    query: `
      query GetSeenlist($country: Country!, $language: Language!) {
        me {
          seenlist(country: $country, language: $language) {
            totalCount
            edges { node { id createdAt
              content { id fullTitle originalTitle objectType releaseYear
                externalIds { imdbId } } } }
          }
        }
      }`,
    extract: (d: Record<string, unknown>) => (d?.me as Record<string, unknown>)?.seenlist,
  },
  // Root seenlist (schema antiguo)
  {
    name: "seenlist",
    query: `
      query GetSeenlist($country: Country!, $language: Language!) {
        seenlist(country: $country, language: $language) {
          totalCount
          edges { node { id createdAt
            content { id fullTitle originalTitle objectType releaseYear
              externalIds { imdbId } } } }
        }
      }`,
    extract: (d: Record<string, unknown>) => d?.seenlist,
  },
  // Variante sin parámetros (algunos schemas no los requieren)
  {
    name: "me.seenlist (sin parámetros)",
    query: `
      query {
        me {
          seenlist {
            totalCount
            edges { node { id createdAt
              content { id fullTitle originalTitle objectType releaseYear
                externalIds { imdbId } } } }
          }
        }
      }`,
    extract: (d: Record<string, unknown>) => (d?.me as Record<string, unknown>)?.seenlist,
  },
];

interface JwContent {
  id:            string;
  fullTitle:     string;
  originalTitle: string;
  objectType:    string;
  releaseYear:   number | null;
  externalIds:   { imdbId: string | null } | null;
}

interface JwEdge {
  node: { id: string; createdAt: string; content: JwContent };
}

// ─── Schema de la request ─────────────────────────────────────────────────────

const Schema = z.object({
  token:    z.string().min(10),
  country:  z.string().length(2).default("ES"),
  language: z.string().min(2).default("es"),
  preview:  z.boolean().default(true),
  ids:      z.array(z.string()).default([]),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, country, language, preview, ids } = parsed.data;
  const vars = { country: country.toUpperCase(), language: language.toLowerCase() };

  // ── 1. Probar candidatos hasta que uno funcione ───────────────────────────
  let edges: JwEdge[] = [];
  let worked = false;

  for (const candidate of CANDIDATES) {
    try {
      const json = await gql(token, candidate.query, vars);
      const seenlist = candidate.extract(json?.data ?? {}) as {
        totalCount: number;
        edges: JwEdge[];
      } | undefined;

      if (seenlist && Array.isArray(seenlist.edges)) {
        edges = seenlist.edges;
        worked = true;
        break;
      }
    } catch {
      // Siguiente candidato
    }
  }

  // ── 2. Si ninguno funcionó, introspectamos y devolvemos campos disponibles ─
  if (!worked) {
    let availableFields: string[] = [];
    try {
      const intro = await gql(token, INTROSPECT);
      availableFields = (
        (intro?.data?.__schema?.queryType?.fields ?? []) as { name: string }[]
      ).map((f) => f.name);
    } catch { /* silencio */ }

    const seenRelated = availableFields.filter((f) =>
      /seen|watch|visto|viewed/i.test(f)
    );

    return NextResponse.json(
      {
        error: `La API de JustWatch ha cambiado su schema. No se encontró la lista de vistas.${
          seenRelated.length
            ? ` Campos relacionados disponibles: ${seenRelated.join(", ")}`
            : availableFields.length
            ? ` Campos root disponibles: ${availableFields.slice(0, 10).join(", ")}…`
            : " No se pudo hacer introspección."
        }`,
        debug: { availableFields },
      },
      { status: 400 }
    );
  }

  // ── 3. Filtrar solo películas ─────────────────────────────────────────────
  const movies = edges
    .filter((e) => e.node?.content?.objectType === "MOVIE")
    .map((e) => ({
      jwId:          e.node.id,
      imdbId:        e.node.content.externalIds?.imdbId ?? null,
      title:         e.node.content.fullTitle ?? e.node.content.originalTitle ?? "—",
      originalTitle: e.node.content.originalTitle ?? null,
      year:          e.node.content.releaseYear ?? null,
      seenAt:        e.node.createdAt,
    }));

  // ── 4. Marcar existentes ──────────────────────────────────────────────────
  const imdbIds  = movies.map((m) => m.imdbId).filter(Boolean) as string[];
  const existing = await db.movie.findMany({
    where:  { imdbId: { in: imdbIds } },
    select: { imdbId: true },
  });
  const existingSet = new Set(existing.map((m) => m.imdbId));
  const enriched = movies.map((m) => ({
    ...m,
    exists: m.imdbId ? existingSet.has(m.imdbId) : false,
  }));

  if (preview) return NextResponse.json({ movies: enriched, total: enriched.length });

  // ── 5. Importar ───────────────────────────────────────────────────────────
  const toImport = enriched.filter((m) => ids.includes(m.jwId) && !m.exists && m.imdbId);
  const results  = { imported: 0, skipped: 0, errors: [] as { imdbId: string; error: string }[] };

  for (const m of toImport) {
    const dup = await db.movie.findUnique({ where: { imdbId: m.imdbId! } });
    if (dup) { results.skipped++; continue; }

    try {
      const omdb = await getOmdbById(m.imdbId!);
      const data = omdb ? parseOmdbMovie(omdb) : null;

      await db.movie.create({
        data: {
          imdbId:          m.imdbId!,
          title:           data?.title       ?? m.title,
          originalTitle:   m.originalTitle   ?? null,
          year:            data?.year        ?? m.year,
          durationMin:     data?.durationMin ?? null,
          genres:          JSON.stringify(data?.genres    ?? []),
          directors:       JSON.stringify(data?.directors ?? []),
          cast:            JSON.stringify(data?.cast      ?? []),
          plot:            data?.plot        ?? null,
          posterUrl:       data?.posterUrl   ?? null,
          imdbRating:      data?.imdbRating  ?? null,
          imdbVotes:       data?.imdbVotes   ?? null,
          country:         data?.country     ?? null,
          language:        data?.language    ?? null,
          rated:           data?.rated       ?? null,
          status:          "vista",
          watchedAt:       m.seenAt ? new Date(m.seenAt) : null,
          importedFromImdb: false,
        },
      });
      results.imported++;
    } catch (err) {
      results.errors.push({
        imdbId: m.imdbId!,
        error:  err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  return NextResponse.json(results);
}
