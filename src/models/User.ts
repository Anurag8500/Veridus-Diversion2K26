import { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
    walletAddress: string;
    role: "student" | "institution";
    profileCompleted: boolean;
    createdAt: Date;

    // Student specific fields
    fullName?: string;
    rollNumber?: string;
    department?: string;
    graduationYear?: number;
    dateOfBirth?: Date;
    linkedinUrl?: string;

    // Institution specific fields
    institutionName?: string;
    registrationId?: string;
    officialEmail?: string;
    domain?: string;
    adminContactNumber?: string;
    location?: string;
}

const UserSchema = new Schema<IUser>({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    role: {
        type: String,
        enum: ["student", "institution"],
        required: true,
    },
    profileCompleted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Student specific fields
    fullName: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    department: { type: String, trim: true },
    graduationYear: { type: Number },
    dateOfBirth: { type: Date },
    linkedinUrl: { type: String, trim: true },

    // Institution specific fields
    institutionName: { type: String, trim: true },
    registrationId: { type: String, trim: true },
    officialEmail: { 
        type: String, 
        lowercase: true, 
        trim: true,
        required: false,
        unique: false,
        sparse: true,
        index: true
    },
    domain: { type: String, trim: true },
    adminContactNumber: { type: String, trim: true },
    location: { type: String, trim: true },
});

// Prevent model re-compilation during hot reload
const User = models.User || model<IUser>("User", UserSchema);

export default User;
