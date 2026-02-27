import { Schema, Document, model, models, Types } from "mongoose";

/**
 * Interface representing a Degree document in MongoDB.
 */
export interface IDegree extends Document {
    degreeId: string;
    studentId: Types.ObjectId;
    universityId: Types.ObjectId;
    studentName: string; // Snapshot of name at issuance time
    degreeTitle: string;
    branch: string;
    issueDate: Date;
    status: "valid" | "revoked";
    ipfsHash?: string | null;
    blockchainTxHash?: string | null;
    credentialHash?: string | null;
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
        studentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student reference is required"],
        },
        universityId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "University reference is required"],
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
        credentialHash: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true, // Enables createdAt and updatedAt
    }
);

DegreeSchema.index({ degreeId: 1 });

// Prevent model re-compilation during hot reload
const Degree = models.Degree || model<IDegree>("Degree", DegreeSchema);

export default Degree;
