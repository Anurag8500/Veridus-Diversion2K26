import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { IDegree } from "@/models/Degree";
import { generateCertificateImage } from "./certificateImageGenerator";

/**
 * Generates a professional academic certificate in PDF format.
 * First generates a high-quality JPG image, then embeds it in a PDF.
 * 
 * @param degree - The degree object containing student, university, and credential details.
 * @returns {Promise<string>} The absolute path to the generated PDF file.
 */
export async function generateCertificate(degree: IDegree | any): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Setup storage directory
            const storageDir = path.join(process.cwd(), "storage", "certificates");
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }

            const filePath = path.join(storageDir, `${degree.degreeId}.pdf`);
            const jpgPath = path.join(storageDir, `${degree.degreeId}.jpg`);
            
            // Force regeneration
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Could not delete old certificate file", e);
                }
            }

            // 2. Generate certificate as JPG image
            console.log("Generating certificate image...");
            const imageBuffer = await generateCertificateImage(degree);
            
            // Save JPG file
            fs.writeFileSync(jpgPath, imageBuffer);
            console.log("Certificate image saved:", jpgPath);

            // 3. Create PDF and embed the JPG image
            const doc = new PDFDocument({
                size: "A4",
                layout: "landscape",
                margin: 0,
                autoFirstPage: false,
            });

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Add page and embed image
            doc.addPage();
            doc.image(jpgPath, 0, 0, {
                width: doc.page.width,
                height: doc.page.height,
                fit: [doc.page.width, doc.page.height],
                align: "center",
                valign: "center"
            });

            // Finalize PDF
            doc.end();

            writeStream.on("finish", () => {
                console.log("Certificate PDF created:", filePath);
                resolve(path.resolve(filePath));
            });

            writeStream.on("error", (err) => {
                reject(err);
            });

        } catch (error) {
            console.error("Certificate generation error:", error);
            reject(error);
        }
    });
}
