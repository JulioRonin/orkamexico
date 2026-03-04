import React, { useState, useMemo } from 'react';
import { Sale } from './data';

interface PaymentRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingSales: Sale[];
    onRegisterPayment: (paymentData: {
        customer: string;
        amount: number;
        date: string;
        selectedSaleIds: string[];
    }) => void;
}

const PaymentRegistrationModal: React.FC<PaymentRegistrationModalProps> = ({
    isOpen,
    onClose,
    pendingSales,
    onRegisterPayment
}) => {
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

    const customers = useMemo(() => {
        return Array.from(new Set(pendingSales.map(s => s.customer))).sort();
    }, [pendingSales]);

    const customerPendingSales = useMemo(() => {
        return pendingSales.filter(s => s.customer === selectedCustomer);
    }, [pendingSales, selectedCustomer]);

    const totalSelectedAmount = useMemo(() => {
        return customerPendingSales
            .filter(s => selectedSaleIds.includes(s.id))
            .reduce((acc, s) => acc + (s.totalSale - (s.paidAmount || 0)), 0);
    }, [customerPendingSales, selectedSaleIds]);

    const isOverLimit = useMemo(() => {
        return amount > 0 && totalSelectedAmount > amount;
    }, [amount, totalSelectedAmount]);

    if (!isOpen) return null;

    const handleToggleSale = (id: string) => {
        setSelectedSaleIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || amount <= 0 || selectedSaleIds.length === 0) {
            alert('Por favor completa todos los campos y selecciona al menos una unidad.');
            return;
        }
        if (isOverLimit) {
            alert('El monto de las unidades seleccionadas supera el monto del pago registrado.');
            return;
        }
        onRegisterPayment({
            customer: selectedCustomer,
            amount: amount,
            date: paymentDate,
            selectedSaleIds: selectedSaleIds
        });
        // Reset state
        setSelectedCustomer('');
        setAmount(0);
        setSelectedSaleIds([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-dark w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Registro de Pago</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Vincular monto a unidades</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selector de Cliente */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cliente</label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => {
                                    setSelectedCustomer(e.target.value);
                                    setSelectedSaleIds([]);
                                }}
                                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white focus:border-green-500/50 outline-none transition-all"
                                required
                            >
                                <option value="">Seleccionar Cliente</option>
                                {customers.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Monto del Pago */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Monto del Pago (MXN)</label>
                            <div className={`relative transition-all duration-300 ${isOverLimit ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-card-dark rounded-2xl' : ''}`}>
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount || ''}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-2xl pl-8 pr-4 py-3 text-white focus:border-green-500/50 outline-none transition-all font-mono"
                                    required
                                />
                            </div>
                            {isOverLimit && (
                                <p className="text-[10px] text-red-500 font-bold uppercase ml-1 animate-pulse">
                                    ⚠️ Monto insuficiente para las unidades seleccionadas
                                </p>
                            )}
                        </div>

                        {/* Fecha de Pago */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha del Pago</label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white focus:border-green-500/50 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {selectedCustomer && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest ml-1">Unidades / Cargas Pendientes</h3>
                                <div className={`text-[10px] px-3 py-1 rounded-full border font-black transition-all ${isOverLimit
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {selectedSaleIds.length} SELECCIONADAS
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {customerPendingSales.length > 0 ? (
                                    customerPendingSales.map(sale => {
                                        const pending = sale.totalSale - (sale.paidAmount || 0);
                                        const isSelected = selectedSaleIds.includes(sale.id);
                                        const willExceed = !isSelected && amount > 0 && (totalSelectedAmount + pending) > amount;

                                        return (
                                            <div
                                                key={sale.id}
                                                onClick={() => handleToggleSale(sale.id)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${isSelected
                                                    ? (isOverLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]')
                                                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                                                    } ${willExceed ? 'opacity-50' : ''}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected
                                                        ? (isOverLimit ? 'bg-red-500 border-red-500' : 'bg-green-500 border-green-500')
                                                        : 'border-gray-700'
                                                        }`}>
                                                        {isSelected && <span className="material-symbols-outlined text-white text-xs font-black">check</span>}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-mono font-bold transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                                #{sale.bol || sale.id.substring(0, 6)}
                                                            </span>
                                                            <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
                                                                {sale.truck}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1 font-medium">{sale.date} • {sale.product}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                        ${pending.toLocaleString()}
                                                    </p>
                                                    <p className={`text-[9px] font-bold uppercase ${isSelected ? 'text-green-500' : 'text-gray-500'}`}>
                                                        {isSelected ? 'SELECCIONADA' : 'PENDIENTE'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center bg-gray-900/30 rounded-3xl border border-gray-800 border-dashed">
                                        <p className="text-sm text-gray-500 italic">No hay cargas pendientes para este cliente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Summary Footer In Modal */}
                    <div className="mt-8 bg-gray-900/80 rounded-3xl p-6 border border-gray-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resumen de Aplicación</span>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${amount > 0 && amount >= totalSelectedAmount
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                }`}>
                                {amount > 0 && amount >= totalSelectedAmount ? 'Monto Cubierto' : 'Cubrimiento Parcial'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Importe Total Seleccionado</p>
                                <p className="text-xl font-black text-white font-mono">${totalSelectedAmount.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Diferencia / Remanente</p>
                                <p className={`text-xl font-black font-mono ${(amount - totalSelectedAmount) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    ${(amount - totalSelectedAmount).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 bg-gray-900/50 border-t border-gray-800 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 px-6 rounded-2xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-750 transition-all active:scale-95"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedCustomer || amount <= 0 || selectedSaleIds.length === 0}
                        className="flex-[2] py-4 px-6 rounded-2xl bg-green-600 text-white font-black shadow-lg shadow-green-900/20 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        CONFIRMAR Y REGISTRAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentRegistrationModal;
