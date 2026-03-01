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
    cgpa?: number | null; // Optional CGPA/GPA field for ZK-proof generation
    status: "valid" | "revoked";
    ipfsHash?: string | null;
    ipfsPdfCID?: string | null;
    ipfsImageCID?: string | null;
    ipfsMetadataCID?: string | null;
    tokenURI?: string | null;
    blockchainTxHash?: string | null;
    anchoredAt?: Date | null;
    sbtTokenId?: number | null;
    sbtContract?: string | null;
    sbtTxHash?: string | null;
    credentialHash?: string | null;
    hashAlgorithm?: string;
    verificationUrl?: string;
    qrCode?: string;
    customization?: {
        headerColor?: string;
        borderColor?: string;
        accentColor?: string;
        backgroundColor?: string;
        titleFont?: string;
        nameFont?: string;
        bodyFont?: string;
        layout?: string;
        showQR?: boolean;
        showBorder?: boolean;
        showWatermark?: boolean;
        logoPosition?: string;
        logoUrl?: string;
        borderStyle?: string;
        headerStyle?: string;
    };
    customizationUpdatedAt?: Date | null;
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
        cgpa: {
            type: Number,
            default: null,
            min: 0,
            max: 10,
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
        ipfsPdfCID: {
            type: String,
            default: null,
        },
        ipfsImageCID: {
            type: String,
            default: null,
        },
        ipfsMetadataCID: {
            type: String,
            default: null,
        },
        tokenURI: {
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
        customization: {
            type: {
                headerColor: { type: String, default: "#000000" },
                borderColor: { type: String, default: "#1C1C1C" },
                accentColor: { type: String, default: "#8B5CF6" },
                backgroundColor: { type: String, default: "#FFFFFF" },
                titleFont: { type: String, default: "Times-Roman" },
                nameFont: { type: String, default: "Times-Bold" },
                bodyFont: { type: String, default: "Helvetica" },
                layout: { type: String, default: "classic" },
                showQR: { type: Boolean, default: true },
                showBorder: { type: Boolean, default: true },
                showWatermark: { type: Boolean, default: false },
                logoPosition: { type: String, default: "top-center" },
                logoUrl: { type: String, default: null },
                borderStyle: { type: String, default: "double" },
                headerStyle: { type: String, default: "centered" },
            },
            default: {},
        },
        customizationUpdatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // Enables createdAt and updatedAt
    }
);

// Prevent model re-compilation during hot reload
const Degree = models.Degree || model<IDegree>("Degree", DegreeSchema);

export default Degree;
