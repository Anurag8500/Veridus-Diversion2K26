import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("logo") as File;
        const degreeId = formData.get("degreeId") as string;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { success: false, message: "Only image files are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, message: "File size must be less than 2MB" },
                { status: 400 }
            );
        }

        // Create storage directory if it doesn't exist
        const storageDir = path.join(process.cwd(), "storage", "logos");
        if (!existsSync(storageDir)) {
            await mkdir(storageDir, { recursive: true });
        }

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${degreeId}-${Date.now()}${ext}`;
        const filepath = path.join(storageDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return the logo URL (relative path)
        const logoUrl = `/storage/logos/${filename}`;

        return NextResponse.json({
            success: true,
            logoUrl,
            message: "Logo uploaded successfully"
        });

    } catch (error) {
        console.error("Logo upload error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to upload logo" },
            { status: 500 }
        );
    }
}
