import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to map status string to Prisma enum Status
function mapStatusToPrismaEnum(
  status: string | null | undefined
): Status | null {
  if (!status) return null;

  switch (status.toLowerCase()) {
    case "ongoing":
    case "returning":
    case "returning series":
    case "in_production":
    case "in production":
      return Status.ongoing;

    case "complete":
    case "completed":
    case "ended":
      return Status.complete;

    case "upcoming":
    case "planned":
      return Status.upcoming;

    case "canceled":
    case "cancelled":
      return Status.canceled;

    case "released":
      return Status.released;

    case "post production":
    case "post_production":
      return Status.post_production;

    case "pilot":
      return Status.pilot;

    case "rumored":
      return Status.rumored;

    case "unknown":
      return Status.unknown;

    default:
      return null;
  }
}

async function fixImportTmdbStatus(item: any, detail: any, synopsis: string) {
  // Extract genres and filter out kids genre
  const allGenreIds = detail.genres?.map((g: any) => g.id) || [];
  const genreIdsFiltered = allGenreIds.filter((id: number) => id !== 10762);

  // Ensure genres exist (excluding Kids)
  const genreConnections: Array<{ id: number }> = [];
  for (const genre of detail.genres || []) {
    if (
      genre.id === 10762 ||
      (genre.name &&
        (genre.name.toLowerCase().includes("kids") ||
          genre.name.toLowerCase().includes("family")))
    ) {
      continue; // Skip Kids genre
    }
    await prisma.genre.upsert({
      where: { id: genre.id },
      update: { name: genre.name },
      create: { id: genre.id, name: genre.name },
    });
    genreConnections.push({ id: genre.id });
  }

  const statusMapped = mapStatusToPrismaEnum(detail.status || null);

  const releaseDate = detail.release_date
    ? new Date(detail.release_date)
    : null;
  const firstAirDate = detail.first_air_date
    ? new Date(detail.first_air_date)
    : null;

  await prisma.donghua.upsert({
    where: { tmdbId: item.id },
    update: {
      title: detail.name || detail.title || item.name || item.title,
      chineseTitle:
        detail.original_name ||
        detail.original_title ||
        detail.name ||
        detail.title,
      overview: detail.overview || "",
      synopsis: synopsis, // Auto-set from overview
      posterPath: detail.poster_path || "",
      backdropPath: detail.backdrop_path || "",
      posters: [], // Could be passed in caller if needed
      releaseDate: releaseDate,
      firstAirDate: firstAirDate,
      voteAverage: detail.vote_average || 0,
      voteCount: detail.vote_count || 0,
      status: statusMapped,
      episodeCount:
        detail.number_of_episodes &&
        typeof detail.number_of_episodes === "number"
          ? detail.number_of_episodes
          : 0,
      mediaType: item.media_type || "tv",
      genreIds: genreIdsFiltered,
      genres: {
        set: genreConnections,
      },
    },
    create: {
      tmdbId: item.id,
      title: detail.name || detail.title || item.name || item.title,
      chineseTitle:
        detail.original_name ||
        detail.original_title ||
        detail.name ||
        detail.title,
      overview: detail.overview || "",
      synopsis: synopsis, // Auto-set from overview
      posterPath: detail.poster_path || "",
      backdropPath: detail.backdrop_path || "",
      posters: [], // Could be passed in caller if needed
      releaseDate: releaseDate,
      firstAirDate: firstAirDate,
      voteAverage: detail.vote_average || 0,
      voteCount: detail.vote_count || 0,
      status: statusMapped,
      episodeCount:
        detail.number_of_episodes &&
        typeof detail.number_of_episodes === "number"
          ? detail.number_of_episodes
          : 0,
      mediaType: item.media_type || "tv",
      genreIds: genreIdsFiltered,
      genres: {
        connect: genreConnections,
      },
    },
  });
}

export { fixImportTmdbStatus };
