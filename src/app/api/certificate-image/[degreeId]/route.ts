import { NextRequest, NextResponse } from "next/server";

/**
 * Placeholder Certificate Image API
 * Returns a placeholder image for the NFT display.
 * In production, this will render the PDF as an image.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ degreeId: string }> }
) {
    const resolvedParams = await params;
    const degreeId = resolvedParams.degreeId;
    
    // Placeholder image for the credential
    const placeholderUrl = `https://placehold.co/600x600/080808/white?text=VERIDUS+CREDENTIAL%0A${degreeId}`;
    
    return NextResponse.redirect(placeholderUrl);
}
