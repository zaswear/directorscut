-- CreateTable
CREATE TABLE "movies" (
    "id" SERIAL NOT NULL,
    "imdb_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "original_title" TEXT,
    "year" INTEGER,
    "duration_min" INTEGER,
    "genres" TEXT NOT NULL DEFAULT '[]',
    "directors" TEXT NOT NULL DEFAULT '[]',
    "cast" TEXT NOT NULL DEFAULT '[]',
    "plot" TEXT,
    "poster_url" TEXT,
    "imdb_rating" DOUBLE PRECISION,
    "imdb_votes" INTEGER,
    "country" TEXT,
    "language" TEXT,
    "rated" TEXT,
    "my_rating" DOUBLE PRECISION,
    "watched_at" TIMESTAMP(3),
    "watch_format" TEXT,
    "review" TEXT,
    "has_imdb_review" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "imported_from_imdb" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "public_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'gallery',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "references" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movies_imdb_id_key" ON "movies"("imdb_id");

-- CreateIndex
CREATE INDEX "movies_status_idx" ON "movies"("status");

-- CreateIndex
CREATE INDEX "movies_watched_at_idx" ON "movies"("watched_at");

-- CreateIndex
CREATE INDEX "movies_my_rating_idx" ON "movies"("my_rating");

-- CreateIndex
CREATE INDEX "movies_year_idx" ON "movies"("year");

-- CreateIndex
CREATE INDEX "images_movie_id_idx" ON "images"("movie_id");

-- CreateIndex
CREATE INDEX "references_movie_id_idx" ON "references"("movie_id");

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "references" ADD CONSTRAINT "references_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
