import Degree from "@/models/Degree";
import User from "@/models/User";
import { generateDegreeId } from "@/lib/degreeUtils";
import { generateCredentialHash } from "@/lib/hashCredential";
import QRCode from "qrcode";
import { anchorCredential } from "@/lib/blockchain/anchorCredential";
import { mintSoulbound } from "@/lib/blockchain/mintSBT";

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
        // We do not throw here, as per Part 5 requirements
    }

    // 9. Soulbound Token (SBT) Minting
    // If SBT minting fails, credential issuance must STILL succeed.
    try {
        const metadataURI = newDegree.verificationUrl;
        if (metadataURI) {
            const { txHash, tokenId } = await mintSoulbound(
                normalizedStudentWallet,
                metadataURI
            );
            newDegree.sbtTxHash = txHash;
            newDegree.sbtTokenId = tokenId;
            newDegree.sbtContract = process.env.SBT_CONTRACT_ADDRESS;
            await newDegree.save();
        }
    } catch (sbtError) {
        console.error("[SBT MINT ERROR]", sbtError);
    }

    return newDegree;
};

/**
 * Fetches all degrees belonging to a specific student using their wallet address.
 * 
 * @param studentWallet - The wallet address of the student.
 * @returns An array of degree documents.
 */
export const getStudentDegrees = async (studentWallet: string) => {
    const normalizedWallet = studentWallet.toLowerCase();
    
    // Migration: Handle legacy degrees if any
    // This is a simple migration logic as requested in PART F
    const legacyDegrees = await Degree.find({ studentId: { $exists: true }, studentWallet: { $exists: false } });
    for (const degree of legacyDegrees) {
        const student = await User.findById(degree.studentId);
        if (student && student.walletAddress) {
            degree.studentWallet = student.walletAddress.toLowerCase();
            const institution = await User.findById(degree.universityId);
            if (institution && institution.walletAddress) {
                degree.institutionWallet = institution.walletAddress.toLowerCase();
            }
            await (degree as any).save();
        }
    }

    return await Degree.find({ studentWallet: normalizedWallet })
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Fetches all degrees issued by a specific institution using their wallet address.
 * 
 * @param institutionWallet - The wallet address of the institution.
 * @returns An array of degree documents.
 */
export const getInstitutionDegrees = async (institutionWallet: string) => {
    const normalizedWallet = institutionWallet.toLowerCase();

    // Migration: Handle legacy degrees if any
    const legacyDegrees = await Degree.find({ universityId: { $exists: true }, institutionWallet: { $exists: false } });
    for (const degree of legacyDegrees) {
        const institution = await User.findById(degree.universityId);
        if (institution && institution.walletAddress) {
            degree.institutionWallet = institution.walletAddress.toLowerCase();
            const student = await User.findById(degree.studentId);
            if (student && student.walletAddress) {
                degree.studentWallet = student.walletAddress.toLowerCase();
            }
            await (degree as any).save();
        }
    }

    return await Degree.find({ institutionWallet: normalizedWallet })
        .sort({ createdAt: -1 })
        .lean();
};


