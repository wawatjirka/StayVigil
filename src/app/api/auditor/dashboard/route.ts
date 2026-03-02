import { NextRequest, NextResponse } from "next/server";
import { getAuditorDashboard } from "@/lib/marketplace/auditor";

/**
 * GET /api/auditor/dashboard?wallet=0x... — Get auditor dashboard data.
 */
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Provide wallet query parameter" },
        { status: 400 }
      );
    }

    const dashboard = await getAuditorDashboard(wallet);

    if (!dashboard) {
      return NextResponse.json(
        { error: "Auditor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
