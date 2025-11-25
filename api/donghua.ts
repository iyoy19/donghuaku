import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma, enrichDonghuaData, setCorsHeaders, handleOptions } from "./lib";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  try {
    const donghuas = await prisma.donghua.findMany({
      include: {
        episodes: {
          orderBy: {
            episodeNumber: "asc",
          },
        },
        genres: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert enum values to strings
    const donghuasWithStringStatus = donghuas.map((item: any) => {
      if (item.status && typeof item.status !== "string") {
        item.status = String(item.status);
      }
      return item;
    });

    // Enrich each donghua with status and released episodes count
    const enrichedDonghuas = await Promise.all(
      donghuasWithStringStatus.map((donghua) =>
        enrichDonghuaData(donghua, true)
      )
    );

    console.log(`✅ Fetched ${enrichedDonghuas.length} donghua from database`);
    res.status(200).json(enrichedDonghuas);
  } catch (error) {
    console.error("❌ Error fetching all donghua:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
