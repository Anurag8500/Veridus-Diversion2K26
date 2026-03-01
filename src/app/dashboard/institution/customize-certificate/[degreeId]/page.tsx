"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Palette, Type, Layout, ArrowLeft, Save, Upload, Image as ImageIcon, X } from "lucide-react";
import { useAccount } from "wagmi";
import QRCode from "qrcode";

interface CertificateCustomization {
    headerColor: string;
    borderColor: string;
    accentColor: string;
    backgroundColor: string;
    titleFont: string;
    nameFont: string;
    bodyFont: string;
    layout: "classic" | "modern" | "minimal" | "elegant" | "bold";
    showQR: boolean;
    showBorder: boolean;
    showWatermark: boolean;
    logoPosition: "top-left" | "top-center" | "top-right" | "none";
    logoUrl?: string;
    borderStyle: "single" | "double" | "decorative" | "none";
    headerStyle: "centered" | "left-aligned" | "banner";
}

interface DegreeData {
    degreeId: string;
    studentName: string;
    degreeTitle: string;
    branch: string;
    institutionName: string;
    issueDate: string;
}

export default function CustomizeCertificatePage() {
    const params = useParams();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const degreeId = params.degreeId as string;

    const [degree, setDegree] = useState<DegreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [customization, setCustomization] = useState<CertificateCustomization>({
        headerColor: "#000000",
        borderColor: "#1C1C1C",
        accentColor: "#8B5CF6",
        backgroundColor: "#FFFFFF",
        titleFont: "Times-Roman",
        nameFont: "Times-Bold",
        bodyFont: "Helvetica",
        layout: "classic",
        showQR: true,
        showBorder: true,
        showWatermark: false,
        logoPosition: "top-center",
        borderStyle: "double",
        headerStyle: "centered",
    });

    useEffect(() => {
        if (!isConnected || !address) {
            router.push("/connect-wallet");
            return;
        }
        fetchDegree();
    }, [degreeId, isConnected, address]);

    useEffect(() => {
        // Generate QR code when degree is loaded
        if (degree?.degreeId) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            const verificationUrl = `${appUrl}/verify/${degree.degreeId}`;
            QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: "H",
                margin: 1,
                width: 200,
                color: { dark: "#000000", light: "#FFFFFF" }
            }).then(url => {
                setQrCodeUrl(url);
            }).catch(err => {
                console.error("Error generating QR code:", err);
            });
        }
    }, [degree]);

    const fetchDegree = async () => {
        try {
            const response = await fetch(`/api/degrees/${degreeId}`);
            const data = await response.json();

            if (data.success) {
                setDegree(data.degree);
            } else {
                setError(data.message || "Failed to load credential");
            }
        } catch (err) {
            console.error("Error fetching degree:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError("Logo file size must be less than 2MB");
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError("");
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview("");
        setCustomization({ ...customization, logoUrl: undefined });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSaveAndMint = async () => {
        setSaving(true);
        setError("");

        try {
            // 1. Upload logo if present
            let logoUrl = customization.logoUrl;
            if (logoFile) {
                const formData = new FormData();
                formData.append("logo", logoFile);
                formData.append("degreeId", degreeId);

                const uploadResponse = await fetch("/api/upload/logo", {
                    method: "POST",
                    body: formData,
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    logoUrl = uploadData.logoUrl;
                }
            }

            // 2. Capture the preview as an image
            const previewElement = document.getElementById("certificate-preview");
            if (!previewElement) {
                setError("Preview element not found");
                setSaving(false);
                return;
            }

            // Use html2canvas to capture the preview
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(previewElement, {
                scale: 3, // High quality
                backgroundColor: customization.backgroundColor || "#FFFFFF",
                logging: false,
                useCORS: true,
            });

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
            });

            // 3. Send everything to the server
            const formData = new FormData();
            formData.append("previewImage", blob, "certificate.jpg");
            formData.append("customization", JSON.stringify({
                ...customization,
                logoUrl
            }));
            formData.append("degreeData", JSON.stringify({
                studentName: degree?.studentName,
                degreeTitle: degree?.degreeTitle,
                branch: degree?.branch,
                institutionName: degree?.institutionName,
                issueDate: degree?.issueDate,
                degreeId: degree?.degreeId
            }));

            const response = await fetch(`/api/degrees/${degreeId}/customize`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                router.push("/dashboard/institution/records");
            } else {
                setError(data.message || "Failed to save customization");
            }
        } catch (err) {
            console.error("Error saving customization:", err);
            setError("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        router.push("/dashboard/institution/records");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                <p className="text-gray-400">Loading credential...</p>
            </div>
        );
    }

    if (error && !degree) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-3xl font-semibold tracking-tight">Customize Certificate</h1>
                    <p className="text-gray-400 mt-2">
                        Personalize the certificate design before minting
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Customization Options */}
                <div className="space-y-6">
                    {/* Layout Style */}
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#1C1C1C] pb-4">
                            <Layout className="w-5 h-5 text-brand" />
                            <h2 className="text-xl font-medium">Layout Style</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(["classic", "modern", "minimal", "elegant", "bold"] as const).map((layout) => (
                                <button
                                    key={layout}
                                    onClick={() => setCustomization({ ...customization, layout })}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        customization.layout === layout
                                            ? "border-brand bg-brand/10"
                                            : "border-[#222] hover:border-gray-600"
                                    }`}
                                >
                                    <p className="text-sm font-medium capitalize">{layout}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#1C1C1C] pb-4">
                            <ImageIcon className="w-5 h-5 text-brand" />
                            <h2 className="text-xl font-medium">Institution Logo</h2>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />

                        {!logoPreview ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-[#222] rounded-lg p-8 flex flex-col items-center justify-center hover:bg-[#0A0A0A] hover:border-gray-600 transition-all"
                            >
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-300">Upload Logo</p>
                                <p className="text-xs text-gray-500 mt-1">PNG or JPG (max 2MB)</p>
                            </button>
                        ) : (
                            <div className="relative">
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-full h-32 object-contain bg-white rounded-lg p-4"
                                />
                                <button
                                    onClick={removeLogo}
                                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Logo Position</label>
                            <select
                                value={customization.logoPosition}
                                onChange={(e) =>
                                    setCustomization({ ...customization, logoPosition: e.target.value as any })
                                }
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white"
                            >
                                <option value="top-left">Top Left</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-right">Top Right</option>
                                <option value="none">No Logo</option>
                            </select>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#1C1C1C] pb-4">
                            <Palette className="w-5 h-5 text-brand" />
                            <h2 className="text-xl font-medium">Color Scheme</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Header</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={customization.headerColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, headerColor: e.target.value })
                                        }
                                        className="w-12 h-12 rounded-lg border border-[#222] bg-transparent cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={customization.headerColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, headerColor: e.target.value })
                                        }
                                        className="flex-1 bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Border</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={customization.borderColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, borderColor: e.target.value })
                                        }
                                        className="w-12 h-12 rounded-lg border border-[#222] bg-transparent cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={customization.borderColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, borderColor: e.target.value })
                                        }
                                        className="flex-1 bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Accent</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={customization.accentColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, accentColor: e.target.value })
                                        }
                                        className="w-12 h-12 rounded-lg border border-[#222] bg-transparent cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={customization.accentColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, accentColor: e.target.value })
                                        }
                                        className="flex-1 bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Background</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={customization.backgroundColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, backgroundColor: e.target.value })
                                        }
                                        className="w-12 h-12 rounded-lg border border-[#222] bg-transparent cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={customization.backgroundColor}
                                        onChange={(e) =>
                                            setCustomization({ ...customization, backgroundColor: e.target.value })
                                        }
                                        className="flex-1 bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#1C1C1C] pb-4">
                            <Type className="w-5 h-5 text-brand" />
                            <h2 className="text-xl font-medium">Typography</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Title Font</label>
                                <select
                                    value={customization.titleFont}
                                    onChange={(e) =>
                                        setCustomization({ ...customization, titleFont: e.target.value })
                                    }
                                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white"
                                >
                                    <option value="Times-Roman">Times Roman</option>
                                    <option value="Times-Bold">Times Bold</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Helvetica-Bold">Helvetica Bold</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Name Font</label>
                                <select
                                    value={customization.nameFont}
                                    onChange={(e) =>
                                        setCustomization({ ...customization, nameFont: e.target.value })
                                    }
                                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white"
                                >
                                    <option value="Times-Roman">Times Roman</option>
                                    <option value="Times-Bold">Times Bold</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Helvetica-Bold">Helvetica Bold</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Body Font</label>
                                <select
                                    value={customization.bodyFont}
                                    onChange={(e) =>
                                        setCustomization({ ...customization, bodyFont: e.target.value })
                                    }
                                    className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white"
                                >
                                    <option value="Times-Roman">Times Roman</option>
                                    <option value="Times-Bold">Times Bold</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Helvetica-Bold">Helvetica Bold</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Design Elements */}
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <h2 className="text-xl font-medium border-b border-[#1C1C1C] pb-4">Design Elements</h2>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Border Style</label>
                            <select
                                value={customization.borderStyle}
                                onChange={(e) =>
                                    setCustomization({ ...customization, borderStyle: e.target.value as any })
                                }
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white"
                            >
                                <option value="single">Single Line</option>
                                <option value="double">Double Line</option>
                                <option value="decorative">Decorative</option>
                                <option value="none">No Border</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Header Style</label>
                            <select
                                value={customization.headerStyle}
                                onChange={(e) =>
                                    setCustomization({ ...customization, headerStyle: e.target.value as any })
                                }
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white"
                            >
                                <option value="centered">Centered</option>
                                <option value="left-aligned">Left Aligned</option>
                                <option value="banner">Banner Style</option>
                            </select>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customization.showQR}
                                    onChange={(e) =>
                                        setCustomization({ ...customization, showQR: e.target.checked })
                                    }
                                    className="w-5 h-5 rounded border-[#222] bg-[#0A0A0A] text-brand focus:ring-brand"
                                />
                                <span className="text-sm text-gray-300">Show QR Code</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customization.showBorder}
                                    onChange={(e) =>
                                        setCustomization({ ...customization, showBorder: e.target.checked })
                                    }
                                    className="w-5 h-5 rounded border-[#222] bg-[#0A0A0A] text-brand focus:ring-brand"
                                />
                                <span className="text-sm text-gray-300">Show Border</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customization.showWatermark}
                                    onChange={(e) =>
                                        setCustomization({ ...customization, showWatermark: e.target.checked })
                                    }
                                    className="w-5 h-5 rounded border-[#222] bg-[#0A0A0A] text-brand focus:ring-brand"
                                />
                                <span className="text-sm text-gray-300">Show Watermark</span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSkip}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-[#0A0A0A] border border-[#222] text-white font-medium rounded-lg hover:bg-[#111] transition-colors disabled:opacity-50"
                        >
                            Skip Customization
                        </button>
                        <button
                            onClick={handleSaveAndMint}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save & Mint
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <h2 className="text-xl font-medium border-b border-[#1C1C1C] pb-4">Live Preview</h2>
                        <div 
                            id="certificate-preview"
                            className="aspect-[1.414/1] rounded-lg p-8 relative overflow-hidden"
                            style={{ backgroundColor: customization.backgroundColor }}
                        >
                            {/* Logo */}
                            {logoPreview && customization.logoPosition !== "none" && (
                                <div
                                    className={`absolute ${
                                        customization.logoPosition === "top-left"
                                            ? "top-6 left-6"
                                            : customization.logoPosition === "top-center"
                                            ? "top-6 left-1/2 -translate-x-1/2"
                                            : "top-6 right-6"
                                    }`}
                                >
                                    <img src={logoPreview} alt="Logo" className="h-12 w-auto object-contain" />
                                </div>
                            )}

                            {/* Border */}
                            {customization.showBorder && customization.borderStyle !== "none" && (
                                <>
                                    {customization.borderStyle === "double" && (
                                        <>
                                            <div
                                                className="absolute inset-4 border-2 rounded"
                                                style={{ borderColor: customization.borderColor }}
                                            />
                                            <div
                                                className="absolute inset-5 border rounded"
                                                style={{ borderColor: customization.borderColor + "80" }}
                                            />
                                        </>
                                    )}
                                    {customization.borderStyle === "single" && (
                                        <div
                                            className="absolute inset-4 border-2 rounded"
                                            style={{ borderColor: customization.borderColor }}
                                        />
                                    )}
                                    {customization.borderStyle === "decorative" && (
                                        <>
                                            <div
                                                className="absolute inset-4 border-4 rounded-lg"
                                                style={{ 
                                                    borderColor: customization.borderColor,
                                                    borderStyle: "double"
                                                }}
                                            />
                                            <div
                                                className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg"
                                                style={{ borderColor: customization.accentColor }}
                                            />
                                            <div
                                                className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg"
                                                style={{ borderColor: customization.accentColor }}
                                            />
                                            <div
                                                className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg"
                                                style={{ borderColor: customization.accentColor }}
                                            />
                                            <div
                                                className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 rounded-br-lg"
                                                style={{ borderColor: customization.accentColor }}
                                            />
                                        </>
                                    )}
                                </>
                            )}

                            {/* Watermark */}
                            {customization.showWatermark && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                    <p className="text-6xl font-bold rotate-[-45deg]" style={{ color: customization.headerColor }}>
                                        VERIDUS
                                    </p>
                                </div>
                            )}

                            {/* Content */}
                            <div className={`relative h-full flex flex-col justify-center space-y-3 ${
                                customization.headerStyle === "centered" ? "items-center text-center" :
                                customization.headerStyle === "left-aligned" ? "items-start text-left pl-8" :
                                "items-center text-center"
                            }`}>
                                {customization.headerStyle === "banner" && (
                                    <div 
                                        className="absolute top-16 left-0 right-0 py-3"
                                        style={{ backgroundColor: customization.accentColor + "20" }}
                                    />
                                )}
                                
                                <p
                                    className="text-[10px] font-bold tracking-widest uppercase"
                                    style={{ 
                                        color: customization.headerColor,
                                        fontFamily: customization.bodyFont
                                    }}
                                >
                                    VERIDUS VERIFIED CREDENTIAL
                                </p>
                                <h3
                                    className="text-xl"
                                    style={{
                                        fontFamily: customization.titleFont,
                                        color: customization.layout === "modern" ? customization.accentColor : customization.headerColor,
                                    }}
                                >
                                    {customization.layout === "bold" ? "CERTIFICATE OF GRADUATION" : "Certificate of Graduation"}
                                </h3>
                                
                                {customization.layout === "modern" && (
                                    <div className="w-16 h-1 rounded" style={{ backgroundColor: customization.accentColor }} />
                                )}
                                
                                <p className="text-[10px]" style={{ 
                                    color: customization.headerColor + "99",
                                    fontFamily: customization.bodyFont
                                }}>
                                    This is to certify that
                                </p>
                                <p
                                    className={customization.layout === "bold" ? "text-lg font-bold uppercase" : "text-lg"}
                                    style={{
                                        fontFamily: customization.nameFont,
                                        color: customization.layout === "elegant" ? customization.accentColor : "#111111",
                                    }}
                                >
                                    {degree?.studentName || "Student Name"}
                                </p>
                                <p className="text-[10px]" style={{ 
                                    color: customization.headerColor + "99",
                                    fontFamily: customization.bodyFont
                                }}>
                                    has successfully completed the requirements for the degree of
                                </p>
                                <p className="text-xs font-semibold" style={{ 
                                    color: customization.headerColor,
                                    fontFamily: customization.bodyFont
                                }}>
                                    {degree?.degreeTitle || "Degree Title"}
                                </p>
                                <p className="text-[10px]" style={{ 
                                    color: customization.headerColor + "99",
                                    fontFamily: customization.bodyFont
                                }}>
                                    in {degree?.branch || "Field of Study"}
                                </p>

                                {customization.layout === "minimal" && (
                                    <div className="pt-4">
                                        <div className="w-24 h-px" style={{ backgroundColor: customization.borderColor }} />
                                    </div>
                                )}

                                {/* Credential ID */}
                                <p className="text-[9px] mt-4" style={{ 
                                    color: customization.headerColor + "66",
                                    fontFamily: customization.bodyFont,
                                    letterSpacing: "0.05em"
                                }}>
                                    Credential ID: {degree?.degreeId || "VER-XXXXXX"}
                                </p>

                                {/* QR Code */}
                                {customization.showQR && qrCodeUrl && (
                                    <div className="absolute bottom-4 right-4 w-12 h-12 rounded flex items-center justify-center overflow-hidden" style={{ backgroundColor: customization.borderColor + "20" }}>
                                        <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            This is a simplified preview. The final certificate will include all details.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
