import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOCR, ExtractedBOLData } from '../hooks/useOCR';
import { useCompany } from '../context/CompanyContext';
import CompanySwitcher from '../components/CompanySwitcher';

const OCRScreen = () => {
    const navigate = useNavigate();
    const { selectedCompanyName } = useCompany();
    const { extractFromImage, processing, progress, error } = useOCR();

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [extracted, setExtracted] = useState<ExtractedBOLData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        setSelectedImage(file);
        setExtracted(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Process OCR
        const result = await extractFromImage(file);
        if (result) {
            setExtracted(result);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleCameraClick = () => {
        cameraInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUseData = () => {
        if (extracted) {
            // Navigate to sales form with extracted data
            // This would require passing state or storing in context
            navigate('/sales/new', { state: { ocrData: extracted } });
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setPreview(null);
        setExtracted(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    return (
        <div className="min-h-screen bg-background-dark pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-center">
                <div className="w-full max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold shadow-lg shadow-green-900/50">
                                <span className="material-symbols-outlined text-lg">document_scanner</span>
                            </div>
                            <div>
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">{selectedCompanyName}</h1>
                                <p className="text-lg font-bold leading-none text-white">BOL OCR</p>
                            </div>
                        </div>
                        <CompanySwitcher />
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 w-full max-w-4xl mx-auto">
                {!preview ? (
                    // Upload Area
                    <div className="bg-card-dark border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center hover:border-blue-500/50 transition">
                        <span className="material-symbols-outlined text-6xl text-gray-500 block mb-4">cloud_upload</span>
                        <h2 className="text-xl font-bold text-white mb-2">Upload BOL Image</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Take a photo or upload a document of your Bill of Lading
                        </p>

                        <div className="flex gap-4 justify-center mb-4">
                            <button
                                onClick={handleCameraClick}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                            >
                                <span className="material-symbols-outlined">photo_camera</span>
                                Capture Camera
                            </button>
                            <button
                                onClick={handleUploadClick}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                            >
                                <span className="material-symbols-outlined">upload_file</span>
                                Upload File
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                        />
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        <p className="text-xs text-gray-500">Supported: JPG, PNG, PDF</p>
                    </div>
                ) : (
                    // Processing/Results Area
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Image Preview */}
                        <div className="bg-card-dark rounded-2xl border border-gray-800 overflow-hidden">
                            <div className="aspect-square bg-black flex items-center justify-center">
                                <img src={preview} alt="BOL" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        {/* Extracted Data */}
                        <div className="space-y-4">
                            {processing ? (
                                <div className="bg-card-dark p-6 rounded-2xl border border-gray-800">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-400 font-medium mb-2">Processing OCR...</p>
                                        <p className="text-sm text-gray-500">{progress}%</p>
                                        <div className="w-full bg-gray-800 h-2 rounded-full mt-4 overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-400 mt-1">error</span>
                                        <div>
                                            <h3 className="text-red-400 font-semibold">OCR Error</h3>
                                            <p className="text-sm text-red-300/80 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : extracted ? (
                                <>
                                    <div className="bg-card-dark p-6 rounded-2xl border border-gray-800 space-y-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400">task_alt</span>
                                            Extracted Data
                                        </h3>

                                        {/* BOL */}
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">BOL Number</label>
                                            <p className="text-white font-mono text-lg mt-1">
                                                {extracted.bol || <span className="text-gray-500">Not detected</span>}
                                            </p>
                                        </div>

                                        {/* Product */}
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Product</label>
                                            <p className="text-white text-lg mt-1">
                                                {extracted.product || <span className="text-gray-500">Not detected</span>}
                                            </p>
                                        </div>

                                        {/* Volume */}
                                        {extracted.volume && (
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Volume</label>
                                                <p className="text-white text-lg mt-1">
                                                    {extracted.volume} {extracted.volumeUnit}
                                                </p>
                                            </div>
                                        )}

                                        {/* Customer */}
                                        {extracted.customer && (
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Customer</label>
                                                <p className="text-white text-lg mt-1">{extracted.customer}</p>
                                            </div>
                                        )}

                                        {/* Date */}
                                        {extracted.date && (
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Date</label>
                                                <p className="text-white text-lg mt-1">{extracted.date}</p>
                                            </div>
                                        )}

                                        {/* Truck */}
                                        {extracted.truck && (
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Truck</label>
                                                <p className="text-white text-lg mt-1">{extracted.truck}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Raw OCR Text */}
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 max-h-48 overflow-y-auto">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Raw OCR Text</p>
                                        <p className="text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                                            {extracted.rawText.slice(0, 500)}...
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleUseData}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Use Data & Create Sale
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OCRScreen;
