import { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role?: "student" | "institution" | null;
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    oauthProvider?: "google";
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ["student", "institution", null],
        default: null,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    oauthProvider: {
        type: String,
        enum: ["google"],
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent model re-compilation during hot reload
const User = models.User || model<IUser>("User", UserSchema);

export default User;
