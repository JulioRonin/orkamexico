import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Sale } from '../../data';
import { generateCFDI40XML, downloadFile } from '../lib/cfdi';
import PDFPreviewModal from './modals/PDFPreviewModal';
import InvoiceContent from './Invoice/InvoiceContent';

// --- Invoicing Form Component ---
const InvoicingForm = ({ initialData, onCancel }: { initialData?: Sale | null, onCancel: () => void }) => {
    // Form State
    const [formData, setFormData] = useState({
        customer: initialData?.customer ? `${initialData.customer} S.A.de C.V.` : '',
        rfc: 'XAXX010101000',
        usoCfdi: 'G03-Gastos en general',
        regimen: '601-General de Ley Personas Morales',
        metodoPago: 'PUE',
        product: initialData?.product || '',
        gallons: initialData?.gallons || 0,
        rate: initialData?.rate || 0,
        totalSale: initialData?.totalSale || 0
    });

    const [showPdf, setShowPdf] = useState(false);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            // Auto-calculate total if gallons or rate change
            if (field === 'gallons' || field === 'rate') {
                next.totalSale = next.gallons * next.rate;
            }
            return next;
        });
    };

    return (
        <>
            <PDFPreviewModal isOpen={showPdf} onClose={() => setShowPdf(false)} data={formData} />

            <div className="bg-card-dark rounded-2xl border border-gray-800 p-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">description</span>
                        Nueva Factura (CFDI 4.0)
                    </h3>
                    {initialData && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                            Autocompletado: Orden #{initialData.bol}
                        </span>
                    )}
                </div>

                <form className="space-y-6" onSubmit={async (e) => {
                    e.preventDefault();

                    const folioName = "A-12345";

                    try {
                        // 1. Generate XML
                        const xmlContent = generateCFDI40XML(formData);
                        downloadFile(`${folioName}.xml`, xmlContent, 'text/xml');

                        // 2. Generate PDF
                        const root = document.getElementById('pdf-invoice-capture-zone');
                        if (root) {
                            // Ensure the element is "ready" for capture
                            const canvas = await html2canvas(root, {
                                scale: 2,
                                useCORS: true,
                                logging: false,
                                backgroundColor: '#ffffff',
                                windowWidth: 800
                            });
                            const imgData = canvas.toDataURL('image/png');
                            const pdf = new jsPDF('p', 'mm', 'a4');
                            const pdfWidth = pdf.internal.pageSize.getWidth();
                            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                            pdf.save(`${folioName}.pdf`);
                            alert('Factura Timbrada: Archivos XML y PDF generados con éxito.');
                        } else {
                            throw new Error('Capture area not found');
                        }
                    } catch (err) {
                        console.error('Invoicing Error:', err);
                        alert('Error al generar los archivos. Revisa la consola para más detalles.');
                    }

                    onCancel();
                }}>
                    {/* 1. Receptor */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                            Datos del Cliente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Razón Social</label>
                                <input
                                    type="text"
                                    value={formData.customer}
                                    onChange={(e) => handleChange('customer', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">RFC</label>
                                <input
                                    type="text"
                                    value={formData.rfc}
                                    onChange={(e) => handleChange('rfc', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Uso CFDI</label>
                                <select
                                    value={formData.usoCfdi}
                                    onChange={(e) => handleChange('usoCfdi', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                >
                                    <option>G03-Gastos en general</option>
                                    <option>P01-Por definir</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Régimen Fiscal</label>
                                <select
                                    value={formData.regimen}
                                    onChange={(e) => handleChange('regimen', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                >
                                    <option>601-General de Ley Personas Morales</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Método de Pago</label>
                                <select
                                    value={formData.metodoPago}
                                    onChange={(e) => handleChange('metodoPago', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                >
                                    <option value="PUE">PUE-Pago en una sola exhibición</option>
                                    <option value="PPD">PPD-Pago en parcialidades o diferido</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 my-4"></div>

                    {/* 2. Conceptos */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
                            Conceptos
                        </h4>

                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="grid grid-cols-12 gap-3 mb-2 text-[10px] text-gray-500 uppercase tracking-wider">
                                <div className="col-span-1">Cant</div>
                                <div className="col-span-2">Unidad</div>
                                <div className="col-span-5">Descripción</div>
                                <div className="col-span-2 text-right">Precio U.</div>
                                <div className="col-span-2 text-right">Importe</div>
                            </div>
                            <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-1">
                                    <input
                                        type="number"
                                        value={formData.gallons}
                                        onChange={(e) => handleChange('gallons', Number(e.target.value))}
                                        className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-green-500 outline-none text-center"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input defaultValue="LTR" className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-green-500 outline-none" />
                                </div>
                                <div className="col-span-5">
                                    <input
                                        value={formData.product}
                                        onChange={(e) => handleChange('product', e.target.value)}
                                        className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        value={formData.rate}
                                        onChange={(e) => handleChange('rate', Number(e.target.value))}
                                        className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-green-500 outline-none text-right"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        value={formData.totalSale}
                                        readOnly
                                        className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-green-500 outline-none text-right font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Totals & Actions */}
                    <div className="flex justify-end gap-6 pt-4">
                        <div className="text-right space-y-1">
                            <div className="flex justify-between gap-8 text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span>${formData.totalSale.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-8 text-sm text-gray-400">
                                <span>IVA (16%)</span>
                                <span>${(formData.totalSale * 0.16).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-8 text-xl font-bold text-white pt-2 border-t border-gray-700">
                                <span>Total</span>
                                <span>${(formData.totalSale * 1.16).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white font-medium transition-colors">Cancelar</button>
                        <button
                            type="button"
                            onClick={() => setShowPdf(true)}
                            className="px-6 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-medium transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Vista Previa
                        </button>
                        <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                            Timbrar Factura
                        </button>
                    </div>
                </form>

                {/* Hidden Capture Area for PDF Generation */}
                <div style={{ position: 'absolute', left: '-9999px', top: '0', pointerEvents: 'none' }}>
                    <InvoiceContent data={formData} id="pdf-invoice-capture-zone" />
                </div>
            </div>
        </>
    );
};

export default InvoicingForm;
