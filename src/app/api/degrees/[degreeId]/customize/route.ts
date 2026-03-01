import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Degree from "@/models/Degree";
import { uploadFile, uploadJSON } from "@/lib/ipfs/uploadToIPFS";
import { mintSoulbound } from "@/lib/blockchain/mintSBT";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ degreeId: string }> }
) {
    try {
        const resolvedParams = await params;
        const degreeId = resolvedParams.degreeId;
        
        // Parse form data
        const formData = await req.formData();
        const previewImage = formData.get("previewImage") as File;
        const customizationStr = formData.get("customization") as string;
        const degreeDataStr = formData.get("degreeData") as string;
        
        if (!previewImage || !customizationStr) {
            return NextResponse.json(
                { success: false, message: "Missing required data" },
                { status: 400 }
            );
        }

        const customization = JSON.parse(customizationStr);
        const degreeData = degreeDataStr ? JSON.parse(degreeDataStr) : null;

        await connectDB();

        const degree = await Degree.findOne({ degreeId });
        if (!degree) {
            return NextResponse.json(
                { success: false, message: "Credential not found" },
                { status: 404 }
            );
        }

        // Optional: Verify the institution owns this credential if session exists
        const session = await getServerSession();
        if (session?.user?.walletAddress) {
            if (degree.institutionWallet.toLowerCase() !== session.user.walletAddress.toLowerCase()) {
                return NextResponse.json(
                    { success: false, message: "Unauthorized to modify this credential" },
                    { status: 403 }
                );
            }
        }

        // Save customization to degree
        degree.customization = customization;
        degree.customizationUpdatedAt = new Date();
        await degree.save();

        // Process certificate with preview image
        try {
            console.log("=== CERTIFICATE GENERATION FROM PREVIEW ===");
            console.log("Degree ID:", degreeId);
            
            // Setup storage directory
            const storageDir = path.join(process.cwd(), "storage", "certificates");
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }

            const jpgPath = path.join(storageDir, `${degreeId}.jpg`);
            const pdfPath = path.join(storageDir, `${degreeId}.pdf`);

            // A. Save preview image as JPG
            console.log("Saving preview image...");
            const imageBuffer = Buffer.from(await previewImage.arrayBuffer());
            fs.writeFileSync(jpgPath, imageBuffer);
            console.log("Preview image saved:", jpgPath);

            // B. Create PDF with embedded image
            console.log("Creating PDF from preview image...");
            await new Promise<void>((resolve, reject) => {
                const doc = new PDFDocument({
                    size: "A4",
                    layout: "landscape",
                    margin: 0,
                    autoFirstPage: false, // Prevent automatic first page
                });

                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                doc.addPage(); // Add only one page
                doc.image(jpgPath, 0, 0, {
                    width: doc.page.width,
                    height: doc.page.height,
                    fit: [doc.page.width, doc.page.height],
                    align: "center",
                    valign: "center"
                });

                doc.end();

                writeStream.on("finish", () => {
                    console.log("PDF created:", pdfPath);
                    resolve();
                });

                writeStream.on("error", reject);
            });

            // C. Mint SBT first (with temporary metadata)
            console.log("Minting SBT to student wallet...");
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            
            // Create temporary metadata for minting
            const tempMetadata = {
                name: `${degree.studentName} - ${degree.degreeTitle}`,
                description: "VERIDUS Tamper-Proof Academic Credential. This token is soulbound and serves as permanent proof of achievement.",
                image: `${appUrl}/veridus-certificate-card.png`,
                external_url: degree.verificationUrl,
                attributes: [
                    { trait_type: "Institution", value: degree.institutionName },
                    { trait_type: "Branch", value: degree.branch },
                    { trait_type: "Degree ID", value: degree.degreeId },
                    { trait_type: "Status", value: degree.status.toUpperCase() },
                    { trait_type: "Layout", value: customization.layout || "classic" }
                ]
            };

            if (!degree.sbtTokenId) {
                // Upload temporary metadata
                console.log("Uploading temporary metadata to IPFS...");
                const tempMetadataCID = await uploadJSON(tempMetadata);
                const tempTokenURI = `${process.env.NEXT_PUBLIC_GATEWAY}${tempMetadataCID}`;
                
                const { txHash, tokenId } = await mintSoulbound(
                    degree.studentWallet,
                    tempTokenURI
                );

                degree.sbtTxHash = txHash;
                degree.sbtTokenId = tokenId;
                degree.sbtContract = process.env.SBT_CONTRACT_ADDRESS;
                await degree.save();
                console.log("SBT minted successfully. Token ID:", tokenId);
            } else {
                console.log("SBT already minted. Token ID:", degree.sbtTokenId);
            }

            // D. Upload PDF to IPFS
            console.log("Uploading certificate PDF to IPFS...");
            const pdfBuffer = fs.readFileSync(pdfPath);
            const pdfCID = await uploadFile(pdfBuffer, `${degreeId}.pdf`);
            const pdfURL = `${process.env.NEXT_PUBLIC_GATEWAY}${pdfCID}`;
            console.log("PDF uploaded to IPFS:", pdfURL);
            
            degree.ipfsPdfCID = pdfCID;

            // E. Create & Upload Final Metadata to IPFS
            const finalMetadata = {
                ...tempMetadata,
                animation_url: pdfURL, // Add certificate PDF URL
            };

            console.log("Uploading final metadata to IPFS...");
            const metadataCID = await uploadJSON(finalMetadata);
            const tokenURI = `${process.env.NEXT_PUBLIC_GATEWAY}${metadataCID}`;
            console.log("Final metadata uploaded to IPFS:", tokenURI);

            degree.ipfsMetadataCID = metadataCID;
            degree.tokenURI = tokenURI;
            await degree.save();

            console.log("=== CERTIFICATE GENERATION COMPLETE ===");

        } catch (error) {
            console.error("Error processing certificate:", error);
            return NextResponse.json(
                { success: false, message: "Failed to process certificate with customizations" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Certificate customized and minted successfully",
            degree
        });

    } catch (error) {
        console.error("Customization error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
