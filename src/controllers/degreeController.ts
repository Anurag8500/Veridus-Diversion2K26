import Degree from "@/models/Degree";
import User from "@/models/User";
import { generateDegreeId } from "@/lib/degreeUtils";
import { generateCredentialHash } from "@/lib/hashCredential";
import QRCode from "qrcode";
import { anchorCredential } from "@/lib/blockchain/anchorCredential";
import { mintSoulbound } from "@/lib/blockchain/mintSBT";
import { uploadFile, uploadJSON } from "@/lib/ipfs/uploadToIPFS";
import { generateCertificate } from "@/lib/certificateGenerator";
import fs from "fs";
import { safeSerialize } from "@/lib/utils/serialize";

/**
 * Interface for the degree issuance payload.
 */
export interface IssueDegreePayload {
    studentWallet: string;
    studentName: string;
    degreeTitle: string;
    branch: string;
    credentialHash?: string | null;
}

/**
 * Issues a new degree record after validation and unique ID generation.
 * 
 * @param institutionWallet - The wallet address of the issuing university/institution.
 * @param payload - The degree details from the request.
 * @returns The created degree document.
 * @throws Error if validation fails or student is not found.
 */
export const issueDegree = async (institutionWallet: string, payload: IssueDegreePayload) => {
    const { studentWallet, studentName, degreeTitle, branch } = payload;

    // 1. Validate required fields
    if (!studentWallet || !studentName || !degreeTitle || !branch || !institutionWallet) {
        throw new Error("Missing required fields: studentWallet, studentName, degreeTitle, branch, institutionWallet");
    }

    const normalizedStudentWallet = studentWallet.toLowerCase();
    const normalizedInstitutionWallet = institutionWallet.toLowerCase();

    // 2. Find student (must have role "student" or "institution" depending on your User model roles)
    // Note: In your User.ts, roles are "student" | "institution"
    const student = await User.findOne({
        walletAddress: normalizedStudentWallet,
        role: "student"
    });

    if (!student) {
        throw new Error(`Student with wallet address ${studentWallet} not found.`);
    }

    // 3. Find university to get its name for hashing
    const university = await User.findOne({ walletAddress: normalizedInstitutionWallet, role: "institution" });
    if (!university) {
        throw new Error("Institution not found.");
    }

    // 4. Generate UNIQUE degreeId (loop until unused)
    let uniqueDegreeId: string = "";
    let isUnique = false;

    while (!isUnique) {
        uniqueDegreeId = generateDegreeId();
        const existingDegree = await Degree.findOne({ degreeId: uniqueDegreeId }).lean();
        if (!existingDegree) {
            isUnique = true;
        }
    }

    // 5. Generate Credential Hash (SHA-256)
    const issueDate = new Date();
    const instName = university.institutionName || university.name || "Unknown Institution";
    const credentialHash = generateCredentialHash({
        degreeId: uniqueDegreeId,
        studentWallet: normalizedStudentWallet,
        institutionWallet: normalizedInstitutionWallet,
        studentName,
        degreeTitle,
        branch,
        issueDate,
    });

    // 6. Generate QR Code and Verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify/${uniqueDegreeId}`;
    const qrCodeBase64 = await QRCode.toDataURL(verificationUrl);

    // 7. Create Degree document
    const newDegree = await Degree.create({
        degreeId: uniqueDegreeId,
        studentWallet: normalizedStudentWallet,
        institutionWallet: normalizedInstitutionWallet,
        institutionName: instName,
        studentName, // Snapshot of name at issuance time
        degreeTitle,
        branch,
        issueDate,
        credentialHash,
        status: "valid",
        verificationUrl,
        qrCode: qrCodeBase64
    });

    // 8. Blockchain Anchoring
    // If blockchain anchoring fails, credential issuance must STILL succeed.
    try {
        if (newDegree.credentialHash) {
            const txHash = await anchorCredential(newDegree.credentialHash);
            newDegree.blockchainTxHash = txHash;
            newDegree.anchoredAt = new Date();
            await newDegree.save();
        }
    } catch (bcError) {
        console.error("[BLOCKCHAIN ANCHORING ERROR]", bcError);
    }

    // 9. IPFS Storage & Soulbound Token (SBT) Minting
    // If IPFS or SBT fails, credential issuance must STILL succeed.
    try {
        // A. Generate Certificate PDF
        console.log("Generating certificate PDF...");
        const pdfPath = await generateCertificate(newDegree);
        const pdfBuffer = fs.readFileSync(pdfPath);

        // B. Upload PDF to IPFS
        console.log("Uploading certificate PDF to IPFS...");
        const pdfCID = await uploadFile(pdfBuffer, `${newDegree.degreeId}.pdf`);
        const pdfURL = `${process.env.NEXT_PUBLIC_GATEWAY}${pdfCID}`;
        console.log("PDF URL:", pdfURL);
        newDegree.ipfsPdfCID = pdfCID;

        // C. Create & Upload ERC721 Metadata to IPFS
        // NFT image uses a static card; animation_url links to the full PDF on IPFS.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const metadata = {
            name: `${newDegree.studentName} - ${newDegree.degreeTitle}`,
            description: "VERIDUS Tamper-Proof Academic Credential. This token is soulbound and serves as permanent proof of achievement.",
            image: `${appUrl}/veridus-certificate-card.png`,
            animation_url: pdfURL,
            external_url: newDegree.verificationUrl,
            attributes: [
                { trait_type: "Institution", value: newDegree.institutionName },
                { trait_type: "Branch", value: newDegree.branch },
                { trait_type: "Degree ID", value: newDegree.degreeId },
                { trait_type: "Status", value: newDegree.status.toUpperCase() }
            ]
        };

        console.log("Uploading metadata to IPFS...");
        const metadataCID = await uploadJSON(metadata);
        console.log("Metadata CID:", metadataCID);

        const tokenURI = `${process.env.NEXT_PUBLIC_GATEWAY}${metadataCID}`;

        newDegree.ipfsMetadataCID = metadataCID;
        newDegree.tokenURI = tokenURI;
        await newDegree.save();

        // D. Mint Soulbound Token using the permanent IPFS tokenURI
        const { txHash, tokenId } = await mintSoulbound(
            normalizedStudentWallet,
            tokenURI
        );

        newDegree.sbtTxHash = txHash;
        newDegree.sbtTokenId = tokenId;
        newDegree.sbtContract = process.env.SBT_CONTRACT_ADDRESS;
        await newDegree.save();

    } catch (ipfsOrSbtError) {
        console.warn("IPFS unavailable — continuing issuance");
        console.error("[IPFS/SBT ERROR]", ipfsOrSbtError);
    }

    // Refetch with .lean() to get a plain object, then safeSerialize to strip
    // any remaining Mongoose internals, ObjectIds, and Date prototypes.
    const plainDegree = await Degree.findById(newDegree._id).lean();
    return safeSerialize(plainDegree);
};

/**
 * Fetches all degrees belonging to a specific student using their wallet address.
 * 
 * @param studentWallet - The wallet address of the student.
 * @returns An array of degree documents.
 */
export const getStudentDegrees = async (studentWallet: string) => {
    const normalizedWallet = studentWallet.toLowerCase();

    // Performance: Only run migration if explicitly needed or use a background task
    // For now, we fetch current degrees directly. Migration should ideally be handled elsewhere.
    const degrees = await Degree.find({ studentWallet: normalizedWallet })
        .sort({ createdAt: -1 })
        .lean();
    return safeSerialize(degrees);
};

/**
 * Fetches all degrees issued by a specific institution using their wallet address.
 * 
 * @param institutionWallet - The wallet address of the institution.
 * @returns An array of degree documents.
 */
export const getInstitutionDegrees = async (institutionWallet: string) => {
    const normalizedWallet = institutionWallet.toLowerCase();

    const degrees = await Degree.find({ institutionWallet: normalizedWallet })
        .sort({ createdAt: -1 })
        .lean();
    return safeSerialize(degrees);
};


