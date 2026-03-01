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
    cgpa?: number | null; // Optional CGPA for ZK-proof generation
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
    const { studentWallet, studentName, degreeTitle, branch, cgpa } = payload;

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
        cgpa: cgpa !== undefined && cgpa !== null ? parseFloat(cgpa.toString()) : null,
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

    // 9. Certificate generation and IPFS upload DEFERRED until after customization
    // The certificate will be generated with customizations in the /api/degrees/[degreeId]/customize endpoint
    // This ensures all customizations are applied before IPFS upload and SBT minting
    console.log("Credential created. Certificate generation deferred until customization.");

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


