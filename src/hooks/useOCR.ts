import { useState } from 'react';
import Tesseract from 'tesseract.js';

export interface ExtractedBOLData {
    bol: string;
    product: string;
    volume?: number;
    volumeUnit?: string;
    customer?: string;
    date?: string;
    truck?: string;
    trailer?: string;
    rate?: number;
    rawText: string;
}

export const useOCR = () => {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const extractFromImage = async (imageFile: File): Promise<ExtractedBOLData | null> => {
        setProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const reader = new FileReader();
            const imageSrc = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            const result = await Tesseract.recognize(imageSrc, 'eng+spa', {
                logger: (m) => {
                    if (m.status === 'recognizing') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const text = result.data.text;
            const extracted = parseOCRText(text);
            setProcessing(false);
            setProgress(0);

            return extracted;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error processing image';
            setError(errorMsg);
            setProcessing(false);
            setProgress(0);
            return null;
        }
    };

    const parseOCRText = (text: string): ExtractedBOLData => {
        // Remove extra whitespace and normalize
        const normalized = text.replace(/\s+/g, ' ').toLowerCase();

        // Extract BOL number (common patterns)
        const bolMatch = normalized.match(/bol[:\s]+([A-Z0-9\-]{6,20})/i) ||
                        normalized.match(/b\.?o\.?l[:\s]+([A-Z0-9\-]{6,20})/i) ||
                        normalized.match(/^\s*([A-Z0-9]{8,})/m);
        const bol = bolMatch ? bolMatch[1].trim().toUpperCase() : '';

        // Extract volume (look for numbers followed by GL, gal, gallon, barrel, bbl)
        const volumeMatch = normalized.match(/(\d+[.,]?\d*)\s*(gl|gal|gallon|barrel|bbl|bbls|b?\.?o?\.?b?|b)\b/i);
        const volume = volumeMatch ? parseFloat(volumeMatch[1].replace(',', '.')) : undefined;
        const volumeUnit = volumeMatch ? volumeMatch[2].toLowerCase() : undefined;

        // Extract product names (common fuel products)
        let product = '';
        const productPatterns = [
            /magna\s+sin/i,
            /premium\s+sin/i,
            /diesel\s+premium/i,
            /diesel\s+industrial/i,
            /magna/i,
            /premium/i,
            /diesel/i,
            /gasolina/i,
        ];
        for (const pattern of productPatterns) {
            const match = text.match(pattern);
            if (match) {
                product = match[0].trim();
                break;
            }
        }

        // Extract truck/trailer numbers (common patterns)
        const truckMatch = normalized.match(/truck[:\s]+([A-Z0-9\-]{2,10})/i) ||
                          normalized.match(/\b[A-Z]{2,3}[\s-]?\d{3,4}\b/);
        const truck = truckMatch ? truckMatch[1].trim().toUpperCase() : undefined;

        // Extract date (multiple formats)
        const dateMatch = normalized.match(
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/
        );
        const date = dateMatch ? dateMatch[0] : undefined;

        // Extract customer/shipper name (first capitalized phrase after "shipper", "customer", etc)
        const customerMatch = text.match(/(?:shipper|customer|from|al|para)[:\s]+([A-Z][A-Za-z\s]{3,30})/i);
        const customer = customerMatch ? customerMatch[1].trim() : undefined;

        return {
            bol,
            product,
            volume,
            volumeUnit,
            customer,
            date,
            truck,
            rawText: text,
        };
    };

    return {
        extractFromImage,
        processing,
        progress,
        error,
    };
};
