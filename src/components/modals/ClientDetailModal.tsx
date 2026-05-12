import React, { useState } from 'react';
import { getClientCollectionDetail } from '../../../data';

// --- Client Detail Modal (Collection Analysis) ---
const ClientDetailModal = ({
    isOpen,
    onClose,
    data: initialData,
    onGenerateOverdueReport
}: {
    isOpen: boolean;
    onClose: () => void;
    data: any | null;
    onGenerateOverdueReport: (clientName: string, date: string) => void;
}) => {
    const [localData, setLocalData] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    React.useEffect(() => {
        if (isOpen && initialData) {
            setLocalData(initialData);
            setSelectedDate(initialData.date);
        }
    }, [isOpen, initialData]);

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        if (localData) {
            const updatedData = getClientCollectionDetail(localData.client, newDate);
            setLocalData(updatedData);
        }
    };

    if (!isOpen || !localData) return null;

    const data = localData; // Use the local (potentially filtered) data

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
                                <span className="material-symbols-outlined text-4xl text-accent-orange">finance</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">{data.client}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest">Cuenta Activa</span>
                                    <span className="text-slate-400 text-xs font-medium italic">Análisis Integral de Cobranza</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha de Análisis</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-4 py-2 outline-none focus:border-accent-orange/50 transition-all shadow-inner"
                                />
                            </div>
                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
                                <span className="material-symbols-outlined text-white group-hover:rotate-90 transition-transform">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Límite de Crédito</p>
                            <p className="text-xl font-bold text-white">${data.creditLimit.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Pendiente</p>
                            <p className="text-xl font-bold text-accent-orange">${data.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cargas Totales</p>
                            <p className="text-xl font-bold text-white">{data.loads.length}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Plazo de Pago</p>
                            <p className="text-xl font-bold text-white">{data.loads[0]?.paymentTermDays || 7} Días</p>
                        </div>
                        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Facturas Vencidas</p>
                            <p className="text-xl font-bold text-red-500">{data.overdueCount}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Días Máx. Atraso</p>
                            <p className="text-xl font-bold text-red-500">{data.maxOverdueDays}</p>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-6 py-2">Fecha Carga</th>
                                <th className="px-6 py-2">Folio / BOL</th>
                                <th className="px-6 py-2 text-right">Monto Operativo</th>
                                <th className="px-6 py-2 text-center">Vencimiento</th>
                                <th className="px-6 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.loads.map((load: any) => (
                                <tr key={load.id} className="bg-white/[0.03] hover:bg-white/[0.05] transition-colors rounded-xl border border-white/5 group">
                                    <td className="px-6 py-5 first:rounded-l-2xl border-y border-l border-white/5 font-medium text-slate-300">
                                        {load.date}
                                    </td>
                                    <td className="px-6 py-5 border-y border-white/5 font-bold text-white tracking-widest">
                                        #{load.bol}
                                    </td>
                                    <td className="px-6 py-5 border-y border-white/5 text-right font-black text-white">
                                        ${load.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-5 border-y border-white/5 text-center font-bold text-slate-300">
                                        {load.dueDate}
                                    </td>
                                    <td className="px-6 py-5 last:rounded-r-2xl border-y border-r border-white/5">
                                        <div className="flex items-center gap-2">
                                            {load.collectionStatus === 'paid' && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-wider border border-green-500/20">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Pagado
                                                </span>
                                            )}
                                            {load.collectionStatus === 'overdue' && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                                                    <span className="material-symbols-outlined text-[14px]">error</span> Vencido
                                                </span>
                                            )}
                                            {load.collectionStatus === 'due-today' && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/20">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span> Vence Hoy
                                                </span>
                                            )}
                                            {load.collectionStatus === 'on-time' && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                                                    <span className="material-symbols-outlined text-[14px]">history</span> Al Día
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase italic">
                            Análisis generado por Orka Finance Hub Core
                        </p>
                        {data.overdueCount > 0 && (
                            <button
                                onClick={() => onGenerateOverdueReport(data.client, selectedDate)}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 animate-pulse"
                            >
                                <span className="material-symbols-outlined text-sm">assignment_late</span>
                                Generar Reporte de Vencidos ({data.overdueCount})
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10">
                        Cerrar Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailModal;
