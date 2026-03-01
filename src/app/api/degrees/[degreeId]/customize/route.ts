import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Degree from "@/models/Degree";
import { uploadFile, uploadJSON } from "@/lib/ipfs/uploadToIPFS";
import { mintSoulbound } from "@/lib/blockchain/mintSBT";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

// Force Node.js runtime (required for blockchain operations)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for minting

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
            console.log("=== MINTING SBT ===");
            console.log("Student Wallet:", degree.studentWallet);
            
            // Environment check
            console.log("Environment Check:");
            console.log("- PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
            console.log("- PRIVATE_KEY length:", process.env.PRIVATE_KEY?.length || 0);
            console.log("- SBT_CONTRACT_ADDRESS:", process.env.SBT_CONTRACT_ADDRESS);
            console.log("- RPC_URL:", process.env.RPC_URL?.substring(0, 50) + "...");
            
            // Validate environment variables
            if (!process.env.PRIVATE_KEY) {
                throw new Error("PRIVATE_KEY not configured in deployment environment");
            }
            if (!process.env.SBT_CONTRACT_ADDRESS) {
                throw new Error("SBT_CONTRACT_ADDRESS not configured in deployment environment");
            }
            if (!process.env.RPC_URL) {
                throw new Error("RPC_URL not configured in deployment environment");
            }
            
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
                console.log("Temp metadata URI:", tempTokenURI);
                
                console.log("Calling mintSoulbound...");
                const { txHash, tokenId } = await mintSoulbound(
                    degree.studentWallet,
                    tempTokenURI
                );

                console.log("=== MINTING SUCCESS ===");
                console.log("TX Hash:", txHash);
                console.log("Token ID:", tokenId);

                degree.sbtTxHash = txHash;
                degree.sbtTokenId = tokenId;
                degree.sbtContract = process.env.SBT_CONTRACT_ADDRESS;
                await degree.save();
                console.log("SBT data saved to database");
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

        } catch (error: any) {
            console.error("=== CERTIFICATE PROCESSING ERROR ===");
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            // Provide detailed error information
            const errorDetails: any = {
                message: error.message,
                name: error.name,
            };
            
            // Add environment check to error response
            if (error.message?.includes("PRIVATE_KEY") || 
                error.message?.includes("RPC_URL") || 
                error.message?.includes("CONTRACT_ADDRESS")) {
                errorDetails.environmentCheck = {
                    hasPrivateKey: !!process.env.PRIVATE_KEY,
                    hasContractAddress: !!process.env.SBT_CONTRACT_ADDRESS,
                    hasRpcUrl: !!process.env.RPC_URL,
                    hint: "Check deployment environment variables"
                };
            }
            
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Failed to process certificate with customizations",
                    error: error.message,
                    details: errorDetails
                },
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
