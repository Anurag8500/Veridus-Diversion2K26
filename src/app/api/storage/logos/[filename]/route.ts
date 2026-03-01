import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const resolvedParams = await params;
        const filename = resolvedParams.filename;

        // Security: Prevent directory traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json(
                { success: false, message: "Invalid filename" },
                { status: 400 }
            );
        }

        const filepath = path.join(process.cwd(), "storage", "logos", filename);

        if (!existsSync(filepath)) {
            return NextResponse.json(
                { success: false, message: "File not found" },
                { status: 404 }
            );
        }

        const fileBuffer = await readFile(filepath);
        const ext = path.extname(filename).toLowerCase();
        
        let contentType = "image/jpeg";
        if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".gif") contentType = "image/gif";
        else if (ext === ".webp") contentType = "image/webp";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (error) {
        console.error("Error serving logo:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
