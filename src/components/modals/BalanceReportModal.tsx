import React from 'react';
import { Sale } from '../../../data';

// --- Balance Report PDF Modal ---
const BalanceReportModal = ({
    isOpen,
    onClose,
    reports
}: {
    isOpen: boolean;
    onClose: () => void;
    reports: any[]
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0 print:block print:static">
            <div className="bg-white text-black w-full max-w-4xl h-[90vh] rounded-sm shadow-2xl flex flex-col relative print:h-auto print:static print:overflow-visible print:shadow-none print:max-w-none">
                {/* Toolbar */}
                <div className="sticky top-0 z-50 bg-slate-900 text-white p-4 flex justify-between items-center print:hidden border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <span className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-orange">analytics</span>
                            Reporte de Saldos y Cierres
                        </span>
                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded border border-white/10">VISTA PREVIA DE REPORTE</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-lg shadow-green-900/20 text-white">
                            <span className="material-symbols-outlined text-sm">download</span> Descargar PDF
                        </button>
                        <button onClick={onClose} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10">
                            Cerrar Vista
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 font-sans bg-slate-50 print:bg-white print:p-0 print:overflow-visible print:h-auto print:static">
                    <div className="max-w-3xl mx-auto space-y-12 print:space-y-0 print:max-w-none print:block">
                        {reports.map((report, idx) => (
                            <div key={idx} className={`bg-white p-8 md:p-12 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 ${idx > 0 ? 'print:break-before-page' : ''}`}>
                                {/* PDF Header */}
                                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-2xl shadow-xl">O</div>
                                            <div>
                                                <h2 className="font-black text-2xl tracking-tighter text-slate-900">ORKA MEXICO</h2>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Operations & Finance Hub</p>
                                            </div>
                                        </div>
                                        <div className="text-sm space-y-0.5 text-slate-600">
                                            <p className="font-bold text-slate-900">{report.client}</p>
                                            <p>RFC: XAXX010101000</p>
                                            <p>Estado de Cuenta: {report.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-3xl font-black text-slate-900 mb-1 leading-none">REPORTE DE<br />BALANCE</h1>
                                        <p className="text-xs font-bold text-slate-400 mb-4 tracking-widest">SUMMARY REPORT</p>
                                        <div className="inline-block bg-slate-100 rounded-lg p-3 border border-slate-200">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Folio Reporte</p>
                                            <p className="text-lg font-mono font-black text-slate-900">ORKA-{Math.floor(Math.random() * 90000 + 10000)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Totals */}
                                <div className="grid grid-cols-3 gap-6 mb-10">
                                    <div className="bg-slate-50 p-5 rounded-sm border-l-4 border-slate-400">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Saldo Apertura (Inicio de Día)</p>
                                        <p className="text-2xl font-black text-slate-900">
                                            ${report.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-sm border-l-4 border-slate-400">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cargas del Día (Total)</p>
                                        <p className="text-2xl font-black text-slate-900">
                                            +${report.dailyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-sm border-l-4 border-green-500/30">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pagos Efectuados</p>
                                        <p className="text-2xl font-black text-green-600">
                                            -${report.dailyPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-slate-900 p-5 rounded-sm border-l-4 border-green-500 col-span-3 md:col-span-1">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase mb-1 text-white/70">Saldo Final (Cierre)</p>
                                        <p className="text-2xl font-black text-white">
                                            ${(report.openingBalance + report.dailyTotal - report.dailyPayments).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                {/* Activity Table */}
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4">Desglose de Operaciones Diarias</h3>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-slate-900 text-slate-400 text-[10px] uppercase font-black">
                                                <th className="py-3 text-left">BOL / ID</th>
                                                <th className="py-3 text-left">Producto</th>
                                                <th className="py-3 text-left">Terminal</th>
                                                <th className="py-3 text-right">Volumen (GAL)</th>
                                                <th className="py-3 text-right">Estatus</th>
                                                <th className="py-3 text-right">Importe Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.todayLoads.map((sale: Sale) => (
                                                <tr key={sale.id} className="text-slate-700">
                                                    <td className="py-4 font-mono font-bold">{sale.bol || sale.id.substring(0, 8)}</td>
                                                    <td className="py-4 font-bold">{sale.product}</td>
                                                    <td className="py-4 text-slate-500">{sale.terminal}</td>
                                                    <td className="py-4 text-right">{sale.gallons.toLocaleString()}</td>
                                                    <td className="py-4 text-right">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${sale.status === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                                            }`}>
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right font-black text-slate-900">${sale.totalSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                            {report.todayLoads.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No se registraron cargas el día de hoy.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 font-black border-t-2 border-slate-900">
                                                <td colSpan={5} className="py-4 text-right uppercase text-[10px]">Total Operativo del Día</td>
                                                <td className="py-4 text-right text-lg text-slate-900">${report.dailyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Payments Table */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-black text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4">Desglose de Pagos Recibidos</h4>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-slate-900 text-slate-400 text-[10px] uppercase font-black">
                                                <th className="py-3 text-left">BOL / ID</th>
                                                <th className="py-3 text-left">Producto</th>
                                                <th className="py-3 text-left">Terminal</th>
                                                <th className="py-3 text-right">Importe Pagado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.todayPayments && report.todayPayments.map((sale: Sale) => (
                                                <tr key={`pay-${sale.id}`} className="text-slate-700">
                                                    <td className="py-4 font-mono font-bold">{sale.bol || sale.id.substring(0, 8)}</td>
                                                    <td className="py-4 font-bold">{sale.product}</td>
                                                    <td className="py-4 text-slate-500">{sale.terminal}</td>
                                                    <td className="py-4 text-right font-black text-green-600">${(sale.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                            {(!report.todayPayments || report.todayPayments.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">No se registraron pagos aplicados el día de hoy.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {report.todayPayments && report.todayPayments.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-green-50/50 font-black border-t-2 border-slate-900">
                                                    <td colSpan={3} className="py-4 text-right uppercase text-[10px]">Total Pagos</td>
                                                    <td className="py-4 text-right text-green-700">${report.dailyPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>

                                {/* Footer Signals */}
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-6">
                                    <div className="flex gap-4">
                                        <p>SISTEMA: V4.0.0-CORE</p>
                                        <p>GENERADO: {new Date().toLocaleTimeString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
                                        <p>DOCUMENTO VALIDADO POR INFRAESTRUCTURA ORKA</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceReportModal;
