import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { IDegree } from "@/models/Degree";

const fontsDir = path.join(process.cwd(), "public", "fonts");

const FONT_PATHS = {
    Helvetica: path.join(fontsDir, "Helvetica.ttf"),
    "Helvetica-Bold": path.join(fontsDir, "Helvetica-Bold.ttf"),
    "Times-Roman": path.join(fontsDir, "Times-Roman.ttf"),
    "Times-Bold": path.join(fontsDir, "Times-Bold.ttf"),
};

/**
 * Generates a professional academic certificate in PDF format with a verification QR code.
 * STRICTLY enforces a single-page layout by using manual centering and absolute positioning.
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
            
            // Force regeneration to ensure single-page layout is applied to existing records
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Could not delete old certificate file", e);
                }
            }

            // Initialize PDF with bufferPages to allow fine control
            const doc = new PDFDocument({
                size: "A4",
                layout: "landscape",
                margin: 0,
                autoFirstPage: false,
                bufferPages: true
            });

            // Register custom fonts
            doc.registerFont("Helvetica", FONT_PATHS.Helvetica);
            doc.registerFont("Helvetica-Bold", FONT_PATHS["Helvetica-Bold"]);
            doc.registerFont("Times-Roman", FONT_PATHS["Times-Roman"]);
            doc.registerFont("Times-Bold", FONT_PATHS["Times-Bold"]);

            // Setup write stream BEFORE adding page
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Add exactly one page
            doc.addPage();

            const PAGE_WIDTH = doc.page.width;
            const PAGE_HEIGHT = doc.page.height;

            // Helper for manual centering to avoid PDFKit's auto-pagination logic
            const centerText = (text: string, y: number, fontSize: number, fontName: string, color = "#000000") => {
                doc.font(fontName).fontSize(fontSize).fillColor(color);
                const textWidth = doc.widthOfString(text);
                const x = (PAGE_WIDTH - textWidth) / 2;
                doc.text(text, x, y, { lineBreak: false });
            };

            // 2. Draw Borders
            doc.rect(20, 20, PAGE_WIDTH - 40, PAGE_HEIGHT - 40)
               .lineWidth(2)
               .stroke("#1C1C1C");
            
            doc.rect(25, 25, PAGE_WIDTH - 50, PAGE_HEIGHT - 50)
               .lineWidth(1)
               .stroke("#333333");

            // 3. Header Section
            centerText("VERIDUS VERIFIED CREDENTIAL", 80, 10, "Helvetica-Bold", "#000000");
            centerText("Certificate of Graduation", 130, 40, "Times-Roman", "#000000");

            // 4. Body Section
            centerText("This is to certify that", 220, 14, "Helvetica", "#000000");
            centerText(degree.studentName, 260, 32, "Times-Bold", "#111111");
            centerText("has successfully completed the requirements for the degree of", 320, 14, "Helvetica", "#000000");
            centerText(degree.degreeTitle, 360, 22, "Helvetica-Bold", "#000000");
            centerText(`in ${degree.branch}`, 400, 16, "Helvetica", "#000000");

            // 5. Footer Section
            const formattedDate = new Date(degree.issueDate || Date.now()).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });

            // LEFT SIDE
            doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000");
            doc.text("Issuing Institution:", 80, 470, { lineBreak: false });
            doc.font("Helvetica").text(degree.institutionName || "Verified University", 80, 490, { lineBreak: false });
            
            doc.font("Helvetica-Bold").text("Issue Date:", 80, 520, { lineBreak: false });
            doc.font("Helvetica").text(formattedDate, 80, 540, { lineBreak: false });

            // RIGHT SIDE
            const rightColumnX = PAGE_WIDTH - 300;
            doc.font("Helvetica-Bold").text("Credential ID:", rightColumnX, 470, { lineBreak: false });
            doc.font("Helvetica").text(degree.degreeId, rightColumnX, 490, { lineBreak: false });

            // 6. QR Code
            const BASE_URL =
             process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const qrUrl = `${BASE_URL}/verify/${degree.degreeId}`;
            const qrBuffer = await QRCode.toBuffer(qrUrl, {
                errorCorrectionLevel: "H",
                margin: 1,
                width: 100,
                color: { dark: "#000000", light: "#FFFFFF" }
            });

            doc.image(qrBuffer, PAGE_WIDTH - 160, PAGE_HEIGHT - 160, { width: 100 });
            
            doc.fontSize(8).fillColor("#666666");
            const scanText = "Scan to verify authenticity";
            const scanTextWidth = doc.widthOfString(scanText);
            doc.text(scanText, PAGE_WIDTH - 160 + (100 - scanTextWidth) / 2, PAGE_HEIGHT - 50, { lineBreak: false });

            // 7. Finalize
            doc.end();

            writeStream.on("finish", () => {
                resolve(path.resolve(filePath));
            });

            writeStream.on("error", (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
}
