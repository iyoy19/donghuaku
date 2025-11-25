import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  prisma,
  enrichDonghuaData,
  setCorsHeaders,
  handleOptions,
} from "../lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  try {
    const where: any = {
      OR: [
        {
          mediaType: "tv",
          firstAirDate: {
            not: null,
          },
        },
        {
          mediaType: "movie",
          releaseDate: {
            not: null,
          },
        },
      ],
      voteCount: {
        gte: 5,
      },
    };

    const kidsGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { id: 10762 },
          { name: { contains: "Kids", mode: "insensitive" } },
        ],
      },
    });

    if (kidsGenre) {
      where.NOT = {
        genreIds: {
          has: kidsGenre.id,
        },
      };
    }

    const donghuas = await prisma.donghua.findMany({
      where,
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        releaseDate: "desc",
        firstAirDate: "desc",
      },
      take: 20,
    });

    const enrichedDonghuas = await Promise.all(
      donghuas.map((donghua) => enrichDonghuaData(donghua))
    );

    console.log("✅ Latest donghua from DB:", enrichedDonghuas.length);
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching latest donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
}
