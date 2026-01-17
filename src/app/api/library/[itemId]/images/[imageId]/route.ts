import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; imageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, imageId } = await params;

  // Find the image and verify ownership
  const image = await prisma.libraryItemImage.findUnique({
    where: { id: imageId },
    include: {
      libraryItem: {
        include: {
          library: true,
        },
      },
    },
  });

  if (!image || image.libraryItemId !== itemId) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Check if user owns the library
  if (image.libraryItem.library.userId && image.libraryItem.library.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Delete file from disk
    try {
      await unlink(image.path);
    } catch (err) {
      console.error("Failed to delete file from disk:", err);
      // Continue anyway - file might already be deleted
    }

    // Delete from database
    await prisma.libraryItemImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
