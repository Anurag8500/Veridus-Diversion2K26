import { Schema, Document, model, models } from "mongoose";

/**
 * Interface representing a Degree document in MongoDB.
 */
export interface IDegree extends Document {
    degreeId: string;
    studentWallet: string;
    institutionWallet: string;
    institutionName: string; // Snapshot of institution name at issuance time
    studentName: string; // Snapshot of name at issuance time
    degreeTitle: string;
    branch: string;
    issueDate: Date;
    status: "valid" | "revoked";
    ipfsHash?: string | null;
    blockchainTxHash?: string | null;
    anchoredAt?: Date | null;
    sbtTokenId?: number | null;
    sbtContract?: string | null;
    sbtTxHash?: string | null;
    credentialHash?: string | null;
    hashAlgorithm?: string;
    verificationUrl?: string;
    qrCode?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DegreeSchema = new Schema<IDegree>(
    {
        degreeId: {
            type: String,
            required: [true, "Degree public identifier is required"],
            unique: true,
            trim: true,
            index: true,
        },
        studentWallet: {
            type: String,
            required: [true, "Student wallet address is required"],
            lowercase: true,
            trim: true,
            index: true,
        },
        institutionWallet: {
            type: String,
            required: [true, "Institution wallet address is required"],
            lowercase: true,
            trim: true,
            index: true,
        },
        institutionName: {
            type: String,
            required: [true, "Institution name snapshot is required"],
            trim: true,
        },
        studentName: {
            type: String,
            required: [true, "Student name snapshot is required"],
            trim: true,
        },
        degreeTitle: {
            type: String,
            required: [true, "Degree title is required"],
            trim: true,
        },
        branch: {
            type: String,
            required: [true, "Branch/Specialization is required"],
            trim: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["valid", "revoked"],
            default: "valid",
        },
        ipfsHash: {
            type: String,
            default: null,
        },
        blockchainTxHash: {
            type: String,
            default: null,
        },
        anchoredAt: {
            type: Date,
            default: null,
        },
        sbtTokenId: {
            type: Number,
            default: null,
        },
        sbtContract: {
            type: String,
            default: null,
        },
        sbtTxHash: {
            type: String,
            default: null,
        },
        credentialHash: {
            type: String,
            default: null,
            index: true,
        },
        hashAlgorithm: {
            type: String,
            default: "SHA256",
        },
        verificationUrl: {
            type: String,
        },
        qrCode: {
            type: String, // Base64 or URL
        },
    },
    {
        timestamps: true, // Enables createdAt and updatedAt
    }
);

DegreeSchema.index({ degreeId: 1 });
DegreeSchema.index({ studentWallet: 1 });
DegreeSchema.index({ institutionWallet: 1 });

// Prevent model re-compilation during hot reload
const Degree = models.Degree || model<IDegree>("Degree", DegreeSchema);

export default Degree;
