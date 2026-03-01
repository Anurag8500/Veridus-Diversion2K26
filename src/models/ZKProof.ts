import { Schema, Document, model, models } from "mongoose";

/**
 * Interface representing a ZK-Proof document for selective disclosure.
 */
export interface IZKProof extends Document {
    proofId: string; // Unique identifier for the proof (used in verification URL)
    degreeId: string; // Reference to the degree
    studentWallet: string; // Reference to student (for authorization)
    disclosureType: "full" | "degree_only" | "gpa_threshold"; // Type of selective disclosure
    gpaThreshold?: number | null; // If disclosureType is "gpa_threshold", this is the threshold value
    proofHash: string; // Hash of the proof data (links to Merkle root)
    merkleRoot: string; // The on-chain Merkle root this proof validates against
    proofData: {
        // The actual proof data (what can be verified without revealing full data)
        degreeTitle: string;
        institutionName: string;
        branch: string;
        issueDate: Date;
        gpaVerified?: boolean; // Whether GPA threshold is met (without revealing actual GPA)
        gpaThreshold?: number; // The threshold that was proven
    };
    createdAt: Date;
    expiresAt?: Date | null; // Optional expiration
}

const ZKProofSchema = new Schema<IZKProof>(
    {
        proofId: {
            type: String,
            required: [true, "Proof ID is required"],
            unique: true,
            trim: true,
            index: true,
        },
        degreeId: {
            type: String,
            required: [true, "Degree ID is required"],
            trim: true,
            index: true,
        },
        studentWallet: {
            type: String,
            required: [true, "Student wallet is required"],
            lowercase: true,
            trim: true,
            index: true,
        },
        disclosureType: {
            type: String,
            enum: ["full", "degree_only", "gpa_threshold"],
            required: true,
        },
        gpaThreshold: {
            type: Number,
            default: null,
            min: 0,
            max: 10,
        },
        proofHash: {
            type: String,
            required: [true, "Proof hash is required"],
            trim: true,
            index: true,
        },
        merkleRoot: {
            type: String,
            required: [true, "Merkle root is required"],
            trim: true,
        },
        proofData: {
            degreeTitle: { type: String, required: true },
            institutionName: { type: String, required: true },
            branch: { type: String, required: true },
            issueDate: { type: Date, required: true },
            gpaVerified: { type: Boolean, default: false },
            gpaThreshold: { type: Number, default: null },
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // Enables createdAt and updatedAt
    }
);

// Prevent model re-compilation during hot reload
const ZKProof = models.ZKProof || model<IZKProof>("ZKProof", ZKProofSchema);

export default ZKProof;

