import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Naam moet minimaal 2 tekens bevatten"),
  email: z.string().email("Ongeldig e-mailadres"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 tekens bevatten"),
  companyName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    const { name, email, password, companyName } = validated.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Er bestaat al een account met dit e-mailadres" },
        { status: 400 }
      );
    }

    // Create user (in production, hash password with bcrypt)
    // TODO: Implement proper password hashing
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Should be hashed in production
        companyName,
      },
    });

    return NextResponse.json(
      { message: "Account succesvol aangemaakt", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van het account" },
      { status: 500 }
    );
  }
}
