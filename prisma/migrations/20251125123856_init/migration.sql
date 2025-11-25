-- CreateEnum
CREATE TYPE "Status" AS ENUM ('upcoming', 'ongoing', 'complete', 'canceled', 'pilot', 'released', 'rumored', 'planned', 'in_production', 'post_production', 'unknown');

-- CreateTable
CREATE TABLE "Donghua" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "chineseTitle" TEXT,
    "overview" TEXT NOT NULL,
    "synopsis" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "posters" TEXT[],
    "releaseDate" TIMESTAMP(3),
    "firstAirDate" TIMESTAMP(3),
    "voteAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "status" "Status",
    "episodeCount" INTEGER NOT NULL DEFAULT 0,
    "mediaType" TEXT NOT NULL,
    "genreIds" INTEGER[],
    "keywords" JSONB,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donghua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "donghua_id" INTEGER NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "air_date" DATE,
    "servers" JSONB NOT NULL DEFAULT '[]',
    "subtitles" JSONB NOT NULL DEFAULT '[]',
    "tmdb_episode_id" INTEGER,
    "overview" TEXT,
    "still_path" TEXT,
    "crew" JSONB,
    "guest_stars" JSONB,
    "vote_average" DOUBLE PRECISION,
    "vote_count" INTEGER DEFAULT 0,
    "production_code" TEXT,
    "season_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DonghuaGenres" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonghuaGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donghua_tmdbId_key" ON "Donghua"("tmdbId");

-- CreateIndex
CREATE INDEX "Donghua_tmdbId_idx" ON "Donghua"("tmdbId");

-- CreateIndex
CREATE INDEX "Donghua_status_idx" ON "Donghua"("status");

-- CreateIndex
CREATE INDEX "Donghua_mediaType_idx" ON "Donghua"("mediaType");

-- CreateIndex
CREATE INDEX "Donghua_voteAverage_idx" ON "Donghua"("voteAverage");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_tmdb_episode_id_key" ON "episodes"("tmdb_episode_id");

-- CreateIndex
CREATE INDEX "episodes_donghua_id_idx" ON "episodes"("donghua_id");

-- CreateIndex
CREATE INDEX "episodes_donghua_id_episode_number_idx" ON "episodes"("donghua_id", "episode_number");

-- CreateIndex
CREATE INDEX "episodes_tmdb_episode_id_idx" ON "episodes"("tmdb_episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_donghua_id_episode_number_key" ON "episodes"("donghua_id", "episode_number");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "_DonghuaGenres_B_index" ON "_DonghuaGenres"("B");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_donghua_id_fkey" FOREIGN KEY ("donghua_id") REFERENCES "Donghua"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonghuaGenres" ADD CONSTRAINT "_DonghuaGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Donghua"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonghuaGenres" ADD CONSTRAINT "_DonghuaGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
