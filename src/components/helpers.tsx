import React from 'react';
import { salesData as initialSalesData, Sale } from '../../data';

// --- Helper Components ---

const InvoiceGenerationModal = ({
    isOpen,
    onClose,
    onSelectSale,
    onManual
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectSale: (sale: Sale) => void;
    onManual: () => void;
}) => {
    if (!isOpen) return null;

    // Show all sales that are "ready" or "invoiced" so user knows status
    const availableSales = initialSalesData.filter(s =>
        ['DONE', 'BOL UPDATED', 'POD PENDING', 'ON TRACK'].includes(s.status)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">receipt_long</span>
                        Generar Nueva Factura
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={onManual}
                            className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-white">edit_document</span>
                            </div>
                            <span className="font-semibold text-white">Captura Manual</span>
                            <span className="text-xs text-gray-500 mt-1">Llenar formulario en blanco</span>
                        </button>

                        <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-green-500/20 bg-green-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1.5 bg-green-500 text-black text-[9px] font-bold uppercase rounded-bl-lg">Recomendado</div>
                            <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-green-400">local_shipping</span>
                            </div>
                            <span className="font-semibold text-white">Seleccionar Venta</span>
                            <span className="text-xs text-green-400/70 mt-1 text-center">Autocompletar con datos de operación</span>
                        </div>
                    </div>

                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ventas Disponibles para Facturar</h4>
                    <div className="space-y-2">
                        {availableSales.map(sale => (
                            <button
                                key={sale.id}
                                disabled={sale.invoiced}
                                onClick={() => !sale.invoiced && onSelectSale(sale)}
                                className={`w-full text-left rounded-xl p-3 flex items-center justify-between group transition-all border ${sale.invoiced
                                    ? 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'
                                    : 'bg-black/40 hover:bg-black/60 border-white/5 hover:border-green-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${sale.invoiced
                                        ? 'bg-green-900/20 text-green-500'
                                        : 'bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700'
                                        }`}>
                                        <span className="material-symbols-outlined">
                                            {sale.invoiced ? 'check_circle' : (sale.product.includes('Oil') ? 'water_drop' : 'local_shipping')}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-sm ${sale.invoiced ? 'text-gray-500' : 'text-white'}`}>{sale.customer}</span>
                                            <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-300">BOL: {sale.bol}</span>
                                            {sale.invoiced && (
                                                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 uppercase font-bold">
                                                    Facturado
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            <span>{sale.date}</span>
                                            <span>•</span>
                                            <span>{sale.product}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold text-sm ${sale.invoiced ? 'text-gray-600' : 'text-green-400'}`}>
                                        ${sale.totalSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[10px] text-gray-500">{sale.gallons.toLocaleString()} gal</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerationModal;
