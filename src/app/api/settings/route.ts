import { NextRequest, NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await getDefaultUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      companyName: true,
      companyAddress: true,
      companyCity: true,
      companyPostalCode: true,
      companyPhone: true,
      companyEmail: true,
      companyWebsite: true,
      companyLogo: true,
      kvkNumber: true,
      btwNumber: true,
      ibanNumber: true,
      defaultMarkup: true,
      defaultLaborRate: true,
      erpnextUrl: true,
      erpnextApiKey: true,
      erpnextApiSecret: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const userId = await getDefaultUserId();

  const body = await request.json();

  const allowedFields = [
    "name",
    "companyName",
    "companyAddress",
    "companyCity",
    "companyPostalCode",
    "companyPhone",
    "companyEmail",
    "companyWebsite",
    "companyLogo",
    "kvkNumber",
    "btwNumber",
    "ibanNumber",
    "defaultMarkup",
    "defaultLaborRate",
    "erpnextUrl",
    "erpnextApiKey",
    "erpnextApiSecret",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json(user);
}
