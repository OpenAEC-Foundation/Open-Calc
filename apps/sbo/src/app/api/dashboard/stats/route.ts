import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getDefaultUserId();

    // Get counts for dashboard stats
    const [projectCount, estimateCount, activeProjectCount, clientCount] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.estimate.count({
        where: { project: { userId } },
      }),
      prisma.project.count({
        where: { userId, status: "ACTIVE" },
      }),
      prisma.client.count(),
    ]);

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { name: true } },
        estimates: { select: { totalInclVat: true } },
      },
    });

    // Calculate total estimate value
    const estimates = await prisma.estimate.findMany({
      where: { project: { userId } },
      select: { totalInclVat: true },
    });
    const totalEstimateValue = estimates.reduce((sum, e) => sum + e.totalInclVat, 0);

    return NextResponse.json({
      projectCount,
      estimateCount,
      activeProjectCount,
      clientCount,
      totalEstimateValue,
      recentProjects: recentProjects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        clientName: p.client?.name,
        totalValue: p.estimates.reduce((sum, e) => sum + e.totalInclVat, 0),
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
