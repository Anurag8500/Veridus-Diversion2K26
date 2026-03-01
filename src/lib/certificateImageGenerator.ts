import { createCanvas, loadImage, registerFont } from "canvas";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { IDegree } from "@/models/Degree";

const fontsDir = path.join(process.cwd(), "public", "fonts");

// Register fonts for canvas
try {
    registerFont(path.join(fontsDir, "Helvetica.ttf"), { family: "Helvetica" });
    registerFont(path.join(fontsDir, "Helvetica-Bold.ttf"), { family: "Helvetica-Bold" });
    registerFont(path.join(fontsDir, "Times-Roman.ttf"), { family: "Times-Roman" });
    registerFont(path.join(fontsDir, "Times-Bold.ttf"), { family: "Times-Bold" });
} catch (err) {
    console.error("Error registering fonts:", err);
}

/**
 * Generates a certificate as a JPG image
 * @param degree - The degree object containing student, university, and credential details
 * @returns Promise<Buffer> - The JPG image buffer
 */
export async function generateCertificateImage(degree: IDegree | any): Promise<Buffer> {
    // A4 landscape dimensions at 300 DPI
    const width = 3508;
    const height = 2480;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Get customization options or use defaults
    const customization = degree.customization || {};
    const headerColor = customization.headerColor || "#000000";
    const borderColor = customization.borderColor || "#1C1C1C";
    const accentColor = customization.accentColor || "#8B5CF6";
    const backgroundColor = customization.backgroundColor || "#FFFFFF";
    const titleFont = customization.titleFont || "Times-Roman";
    const nameFont = customization.nameFont || "Times-Bold";
    const bodyFont = customization.bodyFont || "Helvetica";
    const layout = customization.layout || "classic";
    const showQR = customization.showQR !== false;
    const showBorder = customization.showBorder !== false;
    const showWatermark = customization.showWatermark || false;
    const logoPosition = customization.logoPosition || "top-center";
    const logoUrl = customization.logoUrl;
    const borderStyle = customization.borderStyle || "double";
    const headerStyle = customization.headerStyle || "centered";

    console.log("Certificate customization:", {
        headerColor,
        borderColor,
        accentColor,
        backgroundColor,
        titleFont,
        nameFont,
        bodyFont,
        layout,
        logoPosition
    });

    // Helper function to draw centered text
    const drawCenteredText = (text: string, y: number, fontSize: number, fontFamily: string, color: string) => {
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = headerStyle === "left-aligned" ? "left" : "center";
        ctx.textBaseline = "top";
        const x = headerStyle === "left-aligned" ? 300 : width / 2;
        ctx.fillText(text, x, y);
    };

    // Helper to measure text width
    const measureText = (text: string, fontSize: number, fontFamily: string): number => {
        ctx.font = `${fontSize}px ${fontFamily}`;
        return ctx.measureText(text).width;
    };

    // 1. Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Logo (if provided)
    if (logoUrl && logoPosition !== "none") {
        try {
            const logoPath = logoUrl.startsWith('/storage/') 
                ? path.join(process.cwd(), logoUrl.replace('/storage/', 'storage/'))
                : path.join(process.cwd(), "storage", "logos", path.basename(logoUrl));
            
            if (fs.existsSync(logoPath)) {
                const logo = await loadImage(logoPath);
                const logoSize = 250;
                const logoX = logoPosition === "top-left" ? 150 : 
                             logoPosition === "top-center" ? (width - logoSize) / 2 : 
                             width - logoSize - 150;
                ctx.drawImage(logo, logoX, 100, logoSize, logoSize);
            }
        } catch (err) {
            console.error("Error loading logo:", err);
        }
    }

    // 3. Borders
    if (showBorder && borderStyle !== "none") {
        ctx.strokeStyle = borderColor;
        
        if (borderStyle === "double") {
            ctx.lineWidth = 6;
            ctx.strokeRect(60, 60, width - 120, height - 120);
            ctx.lineWidth = 3;
            ctx.strokeRect(75, 75, width - 150, height - 150);
        } else if (borderStyle === "single") {
            ctx.lineWidth = 6;
            ctx.strokeRect(60, 60, width - 120, height - 120);
        } else if (borderStyle === "decorative") {
            // Main border
            ctx.lineWidth = 9;
            ctx.strokeRect(60, 60, width - 120, height - 120);
            
            // Corner decorations
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 12;
            const cornerSize = 90;
            
            // Top-left
            ctx.beginPath();
            ctx.moveTo(60, 150);
            ctx.lineTo(60, 60);
            ctx.lineTo(150, 60);
            ctx.stroke();
            
            // Top-right
            ctx.beginPath();
            ctx.moveTo(width - 150, 60);
            ctx.lineTo(width - 60, 60);
            ctx.lineTo(width - 60, 150);
            ctx.stroke();
            
            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(60, height - 150);
            ctx.lineTo(60, height - 60);
            ctx.lineTo(150, height - 60);
            ctx.stroke();
            
            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(width - 150, height - 60);
            ctx.lineTo(width - 60, height - 60);
            ctx.lineTo(width - 60, height - 150);
            ctx.stroke();
        }
    }

    // 4. Watermark
    if (showWatermark) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-45 * Math.PI / 180);
        ctx.font = "360px Helvetica-Bold";
        ctx.fillStyle = headerColor;
        ctx.globalAlpha = 0.05;
        ctx.textAlign = "center";
        ctx.fillText("VERIDUS", 0, 0);
        ctx.restore();
    }

    // 5. Header Section
    const headerY = logoUrl && logoPosition === "top-center" ? 500 : 300;
    
    if (headerStyle === "banner") {
        ctx.fillStyle = accentColor + "33";
        ctx.fillRect(0, headerY - 40, width, 220);
    }
    
    // Small header text
    ctx.font = "36px Helvetica-Bold";
    ctx.fillStyle = headerColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("VERIDUS VERIFIED CREDENTIAL", width / 2, headerY);
    
    // Main title
    const titleText = layout === "bold" ? "CERTIFICATE OF GRADUATION" : "Certificate of Graduation";
    const titleY = headerY + 100;
    const titleColor = layout === "modern" ? accentColor : headerColor;
    ctx.font = `140px ${titleFont}`;
    ctx.fillStyle = titleColor;
    ctx.textAlign = "center";
    ctx.fillText(titleText, width / 2, titleY);
    
    // Accent line for modern layout
    if (layout === "modern") {
        const lineWidth = 400;
        const lineX = (width - lineWidth) / 2;
        ctx.fillStyle = accentColor;
        ctx.fillRect(lineX, titleY + 180, lineWidth, 12);
    }

    // 6. Body Section
    const bodyStartY = titleY + (layout === "modern" ? 350 : 280);
    
    // "This is to certify that"
    ctx.font = `48px ${bodyFont}`;
    ctx.fillStyle = headerColor;
    ctx.textAlign = "center";
    ctx.fillText("This is to certify that", width / 2, bodyStartY);
    
    // Student name
    const nameColor = layout === "elegant" ? accentColor : "#111111";
    const nameSize = layout === "bold" ? 120 : 110;
    ctx.font = `${nameSize}px ${nameFont}`;
    ctx.fillStyle = nameColor;
    ctx.fillText(degree.studentName, width / 2, bodyStartY + 100);
    
    // "has successfully completed..."
    ctx.font = `48px ${bodyFont}`;
    ctx.fillStyle = headerColor;
    ctx.fillText("has successfully completed the requirements for the degree of", width / 2, bodyStartY + 280);
    
    // Degree title
    ctx.font = `72px Helvetica-Bold`;
    ctx.fillStyle = headerColor;
    ctx.fillText(degree.degreeTitle, width / 2, bodyStartY + 380);
    
    // Branch
    ctx.font = `54px ${bodyFont}`;
    ctx.fillStyle = headerColor;
    ctx.fillText(`in ${degree.branch}`, width / 2, bodyStartY + 490);
    
    // Minimal layout separator
    if (layout === "minimal") {
        const separatorWidth = 500;
        const separatorX = (width - separatorWidth) / 2;
        ctx.fillStyle = borderColor;
        ctx.fillRect(separatorX, bodyStartY + 580, separatorWidth, 4);
    }

    // 7. Footer Section
    const formattedDate = new Date(degree.issueDate || Date.now()).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    // Left side
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "42px Helvetica-Bold";
    ctx.fillStyle = "#000000";
    ctx.fillText("Issuing Institution:", 240, 1900);
    
    ctx.font = "42px Helvetica";
    ctx.fillText(degree.institutionName || "Verified University", 240, 1960);
    
    ctx.font = "42px Helvetica-Bold";
    ctx.fillText("Issue Date:", 240, 2060);
    
    ctx.font = "42px Helvetica";
    ctx.fillText(formattedDate, 240, 2120);

    // Right side
    const rightColumnX = width - 1100;
    ctx.font = "42px Helvetica-Bold";
    ctx.fillText("Credential ID:", rightColumnX, 1900);
    
    ctx.font = "42px Helvetica";
    ctx.fillText(degree.degreeId, rightColumnX, 1960);

    // 8. QR Code
    if (showQR) {
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const qrUrl = `${BASE_URL}/verify/${degree.degreeId}`;
        const qrBuffer = await QRCode.toBuffer(qrUrl, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 300,
            color: { dark: "#000000", light: "#FFFFFF" }
        });
        
        const qrImage = await loadImage(qrBuffer);
        ctx.drawImage(qrImage, width - 480, height - 480, 300, 300);
        
        ctx.font = "24px Helvetica";
        ctx.fillStyle = "#666666";
        ctx.textAlign = "center";
        ctx.fillText("Scan to verify authenticity", width - 330, height - 150);
    }

    // Return as JPG buffer
    return canvas.toBuffer("image/jpeg", { quality: 0.95 });
}
