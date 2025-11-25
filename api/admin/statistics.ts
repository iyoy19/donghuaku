import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma, setCorsHeaders, handleOptions } from "../lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  if (handleOptions(req, res)) return;

  try {
    const [
      totalDonghua,
      totalEpisodes,
      donghuaByStatus,
      donghuaByType,
      totalGenres,
    ] = await Promise.all([
      prisma.donghua.count(),
      prisma.episode.count(),
      prisma.donghua.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.donghua.groupBy({
        by: ["mediaType"],
        _count: true,
      }),
      prisma.genre.count(),
    ]);

    res.json({
      totalDonghua,
      totalEpisodes,
      donghuaByStatus: donghuaByStatus.reduce((acc: any, item: any) => {
        acc[item.status || "unknown"] = item._count;
        return acc;
      }, {} as Record<string, number>),
      donghuaByType: donghuaByType.reduce((acc: any, item: any) => {
        acc[item.mediaType || "unknown"] = item._count;
        return acc;
      }, {} as Record<string, number>),
      totalGenres,
    });
  } catch (error) {
    console.error("❌ Error fetching statistics:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
