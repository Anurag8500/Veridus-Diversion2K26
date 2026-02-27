import Degree from "@/models/Degree";
import User from "@/models/User";
import { generateDegreeId } from "@/lib/degreeUtils";

/**
 * Interface for the degree issuance payload.
 */
export interface IssueDegreePayload {
    studentEmail: string;
    studentName: string;
    degreeTitle: string;
    branch: string;
    credentialHash?: string | null;
}

/**
 * Issues a new degree record after validation and unique ID generation.
 * 
 * @param universityId - The ID of the issuing university/institution.
 * @param payload - The degree details from the request.
 * @returns The created degree document.
 * @throws Error if validation fails or student is not found.
 */
export const issueDegree = async (universityId: string, payload: IssueDegreePayload) => {
    const { studentEmail, studentName, degreeTitle, branch } = payload;

    // 1. Validate required fields
    if (!studentEmail || !studentName || !degreeTitle || !branch) {
        throw new Error("Missing required fields: studentEmail, studentName, degreeTitle, branch");
    }

    // 2. Find student (must have role "student" or "institution" depending on your User model roles)
    // Note: In your User.ts, roles are "student" | "institution"
    const student = await User.findOne({ 
        email: studentEmail.toLowerCase(), 
        role: "student" 
    });

    if (!student) {
        throw new Error(`Student with email ${studentEmail} not found.`);
    }

    // 3. Generate UNIQUE degreeId (loop until unused)
    let uniqueDegreeId: string = "";
    let isUnique = false;

    while (!isUnique) {
        uniqueDegreeId = generateDegreeId();
        const existingDegree = await Degree.findOne({ degreeId: uniqueDegreeId }).lean();
        if (!existingDegree) {
            isUnique = true;
        }
    }

    // 4. Create Degree document
    const newDegree = await Degree.create({
        degreeId: uniqueDegreeId,
        studentId: student._id,
        universityId,
        studentName, // Snapshot of name at issuance time
        degreeTitle,
        branch,
        credentialHash: payload.credentialHash ?? null,
        status: "valid",
    });

    return newDegree;
};

/**
 * Fetches all degrees belonging to a specific student.
 * 
 * @param studentId - The ID of the student.
 * @returns An array of degree documents with university info populated.
 */
export const getStudentDegrees = async (studentId: string) => {
    return await Degree.find({ studentId })
        .sort({ createdAt: -1 })
        .populate("universityId", "name")
        .lean();
};

/**
 * Fetches all degrees issued by a specific university/institution.
 * 
 * @param universityId - The ID of the university.
 * @returns An array of degree documents.
 */
export const getInstitutionDegrees = async (universityId: string) => {
    return await Degree.find({ universityId })
        .sort({ createdAt: -1 })
        .populate("studentId", "name email")
        .lean();
};


