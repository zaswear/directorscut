import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOmdbById, parseOmdbMovie } from "@/lib/omdb";
import { z } from "zod";

export const maxDuration = 60;

const JUSTWATCH_GQL = "https://apis.justwatch.com/graphql";

// ─── Consulta GraphQL para la seenlist ───────────────────────────────────────

const SEENLIST_QUERY = `
  query GetSeenlist($country: Country!, $language: Language!) {
    seenlist(country: $country, language: $language) {
      totalCount
      edges {
        node {
          id
          createdAt
          content {
            id
            fullTitle
            originalTitle
            objectType
            releaseYear
            externalIds {
              imdbId
            }
          }
        }
      }
    }
  }
`;

interface JwContent {
  id:            string;
  fullTitle:     string;
  originalTitle: string;
  objectType:    string;
  releaseYear:   number | null;
  externalIds:   { imdbId: string | null } | null;
}

interface JwEdge {
  node: {
    id:        string;
    createdAt: string;
    content:   JwContent;
  };
}

// ─── Schema de la request ─────────────────────────────────────────────────────

const Schema = z.object({
  token:    z.string().min(10),
  country:  z.string().length(2).default("ES"),
  language: z.string().min(2).default("es"),
  /** Si true, solo devuelve la lista sin importar nada */
  preview:  z.boolean().default(true),
  /** IDs de JustWatch a importar (solo cuando preview=false) */
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

  // ── 1. Llamar a JustWatch GraphQL ─────────────────────────────────────────
  let edges: JwEdge[] = [];
  try {
    const res = await fetch(JUSTWATCH_GQL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        query:     SEENLIST_QUERY,
        variables: { country: country.toUpperCase(), language: language.toLowerCase() },
      }),
    });

    const json = await res.json();

    if (json.errors?.length) {
      return NextResponse.json(
        { error: `JustWatch: ${json.errors[0].message}` },
        { status: 400 }
      );
    }

    edges = json?.data?.seenlist?.edges ?? [];
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo conectar con JustWatch. Verifica el token." },
      { status: 502 }
    );
  }

  // ── 2. Filtrar solo películas ──────────────────────────────────────────────
  const movies = edges
    .filter((e) => e.node.content?.objectType === "MOVIE")
    .map((e) => ({
      jwId:          e.node.id,
      imdbId:        e.node.content.externalIds?.imdbId ?? null,
      title:         e.node.content.fullTitle ?? e.node.content.originalTitle,
      originalTitle: e.node.content.originalTitle ?? null,
      year:          e.node.content.releaseYear ?? null,
      seenAt:        e.node.createdAt,
    }));

  // ── 3. Marcar cuáles ya existen en DB ─────────────────────────────────────
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

  // Preview: solo devuelve la lista
  if (preview) {
    return NextResponse.json({ movies: enriched, total: enriched.length });
  }

  // ── 4. Importar las seleccionadas ─────────────────────────────────────────
  const toImport = enriched.filter(
    (m) => ids.includes(m.jwId) && !m.exists && m.imdbId
  );

  const results = { imported: 0, skipped: 0, errors: [] as { imdbId: string; error: string }[] };

  for (const m of toImport) {
    const existing2 = await db.movie.findUnique({ where: { imdbId: m.imdbId! } });
    if (existing2) { results.skipped++; continue; }

    try {
      const omdb = await getOmdbById(m.imdbId!);
      const data = omdb ? parseOmdbMovie(omdb) : null;

      await db.movie.create({
        data: {
          imdbId:          m.imdbId!,
          title:           data?.title         ?? m.title,
          originalTitle:   data?.plot          ? (m.originalTitle ?? null) : null,
          year:            data?.year          ?? m.year,
          durationMin:     data?.durationMin   ?? null,
          genres:          JSON.stringify(data?.genres    ?? []),
          directors:       JSON.stringify(data?.directors ?? []),
          cast:            JSON.stringify(data?.cast      ?? []),
          plot:            data?.plot          ?? null,
          posterUrl:       data?.posterUrl     ?? null,
          imdbRating:      data?.imdbRating    ?? null,
          imdbVotes:       data?.imdbVotes     ?? null,
          country:         data?.country       ?? null,
          language:        data?.language      ?? null,
          rated:           data?.rated         ?? null,
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
