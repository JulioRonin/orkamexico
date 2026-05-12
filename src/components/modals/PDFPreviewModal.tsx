import React from 'react';
import InvoiceContent from '../Invoice/InvoiceContent';

// --- PDF Preview Modal ---
const PDFPreviewModal = ({
    isOpen,
    onClose,
    data
}: {
    isOpen: boolean;
    onClose: () => void;
    data: any
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white text-black w-full max-w-4xl h-[90vh] overflow-y-auto rounded-sm shadow-2xl flex flex-col relative no-scrollbar">

                {/* PDF Toolbar */}
                <div className="sticky top-0 z-10 bg-gray-800 text-white p-4 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-4">
                        <span className="font-bold">Vista Previa (Sin Validez Oficial)</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30">Borrador</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-sm">print</span> Imprimir
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>

                <InvoiceContent data={data} id="pdf-invoice-content" />
            </div>
        </div>
    );
};

export default PDFPreviewModal;
