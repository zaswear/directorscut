import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MovieCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status  = searchParams.get("status")  ?? undefined;
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order   = (searchParams.get("order") ?? "desc") as "asc" | "desc";
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "24")));
  const skip    = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
  };

  const [movies, total] = await Promise.all([
    db.movie.findMany({
      where,
      orderBy: { [orderBy]: order },
      take: limit,
      skip,
      include: { _count: { select: { images: true } } },
    }),
    db.movie.count({ where }),
  ]);

  return NextResponse.json({ movies, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = MovieCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { references, genres, directors, cast, watchedAt, ...data } = parsed.data;

  // Comprueba deduplicación
  const existing = await db.movie.findUnique({ where: { imdbId: data.imdbId } });
  if (existing) {
    return NextResponse.json(
      { error: "Esta película ya está en tu base de datos", id: existing.id },
      { status: 409 }
    );
  }

  const movie = await db.movie.create({
    data: {
      ...data,
      genres:    JSON.stringify(genres),
      directors: JSON.stringify(directors),
      cast:      JSON.stringify(cast),
      watchedAt: watchedAt ? new Date(watchedAt) : null,
      references: {
        create: references.map(({ title, url }) => ({ title, url })),
      },
    },
    include: { references: true, images: true },
  });

  return NextResponse.json(movie, { status: 201 });
}
