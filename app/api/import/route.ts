import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOmdbById, parseOmdbMovie } from "@/lib/omdb";
import { z } from "zod";

export const maxDuration = 60;

const MovieInput = z.object({
  imdbId:        z.string().regex(/^tt\d+$/),
  myRating:      z.number().min(0).max(10),
  watchedAt:     z.string(),
  hasImdbReview: z.boolean(),
  fallback: z.object({
    title:         z.string(),
    originalTitle: z.string(),
    year:          z.number(),
    imdbRating:    z.number(),
    runtimeMins:   z.number(),
    genres:        z.array(z.string()),
    directors:     z.array(z.string()),
    imdbVotes:     z.number(),
  }),
});

const Schema = z.object({
  movies: z.array(MovieInput).min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { movies } = parsed.data;
  const results = { imported: 0, skipped: 0, errors: [] as { imdbId: string; error: string }[] };

  for (const m of movies) {
    // Deduplicación: salta si ya existe
    const existing = await db.movie.findUnique({ where: { imdbId: m.imdbId } });
    if (existing) { results.skipped++; continue; }

    try {
      // Intenta enriquecer con OMDb; usa fallback si falla
      const omdb = await getOmdbById(m.imdbId);
      const data  = omdb ? parseOmdbMovie(omdb) : null;

      const title    = data?.title    ?? m.fallback.title;
      const year     = data?.year     ?? m.fallback.year;
      const duration = data?.durationMin ?? m.fallback.runtimeMins;
      const genres   = data?.genres   ?? m.fallback.genres;
      const directors = data?.directors ?? m.fallback.directors;
      const cast     = data?.cast     ?? [];
      const plot     = data?.plot     ?? null;
      const posterUrl = data?.posterUrl ?? null;
      const imdbRating = data?.imdbRating ?? m.fallback.imdbRating;
      const imdbVotes  = data?.imdbVotes  ?? m.fallback.imdbVotes;
      const country  = data?.country  ?? null;
      const language = data?.language ?? null;
      const rated    = data?.rated    ?? null;

      await db.movie.create({
        data: {
          imdbId:          m.imdbId,
          title,
          originalTitle:   m.fallback.originalTitle || null,
          year,
          durationMin:     duration,
          genres:          JSON.stringify(genres),
          directors:       JSON.stringify(directors),
          cast:            JSON.stringify(cast),
          plot,
          posterUrl,
          imdbRating,
          imdbVotes,
          country,
          language,
          rated,
          myRating:        m.myRating || null,
          watchedAt:       m.watchedAt ? new Date(m.watchedAt) : null,
          hasImdbReview:   m.hasImdbReview,
          status:          "vista",
          importedFromImdb: true,
        },
      });

      results.imported++;
    } catch (err) {
      results.errors.push({
        imdbId: m.imdbId,
        error:  err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  return NextResponse.json(results);
}
