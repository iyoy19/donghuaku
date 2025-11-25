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
    const donghuas = await prisma.donghua.findMany({
      where: {
        status: "ongoing",
        OR: [{ mediaType: "tv" }, { mediaType: "movie" }],
      },
      include: {
        genres: true,
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
      },
      orderBy: {
        voteAverage: "desc",
      },
      take: 12,
    });

    const enrichedDonghuas = await Promise.all(
      donghuas.map((donghua) => enrichDonghuaData(donghua))
    );

    console.log("✅ Ongoing donghua from DB:", enrichedDonghuas.length);
    res.json({ results: enrichedDonghuas });
  } catch (error) {
    console.error("❌ Error fetching ongoing donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
}
