import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; imageId: string }> }
) {
  const { itemId, imageId } = await params;

  // Find the image
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
