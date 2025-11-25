import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Helper function to enrich donghua data
export async function enrichDonghuaData(donghua: any): Promise<any> {
  try {
    // Count released episodes
    const releasedEpisodes = donghua.episodes
      ? donghua.episodes.filter(
          (ep: any) => ep.releaseDate && new Date(ep.releaseDate) <= new Date()
        ).length
      : 0;

    return {
      ...donghua,
      releasedEpisodes,
      status: donghua.status || "unknown",
    };
  } catch (error) {
    console.error("Error enriching donghua data:", error);
    return donghua;
  }
}

// Enable CORS headers
export function setCorsHeaders(res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
}

// Handle OPTIONS requests
export function handleOptions(req: any, res: any) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}
