export async function GET(request?: Request) {
  return new Response(
    JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Cron job executed successfully",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export default async function handler(req: any, res: any) {
  if (res && typeof res.status === "function") {
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Cron job executed successfully",
    });
  }
  return GET(req);
}
