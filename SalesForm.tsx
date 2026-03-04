import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUniqueValues } from './data';

const Sales = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10),
        customerName: '',
        gallons: '',
        product: '',
        paymentTerms: '',
        carrier: '',
        units: '',
        moleculeCost: '',
        salePrice: '',
        supplier: ''
    });

    const customers = getUniqueValues('customer');
    const products = getUniqueValues('product');
    const carriers = getUniqueValues('carrier');
    // Suppliers aren't explicitly in the CSV but we can infer or leave as free text for now, 
    // or use Terminals as proxy if that fits, but let's stick to free text or maybe Terminals?
    // The CSV has 'Terminal' which might be the supplier source. Let's use Terminal for Supplier suggestion.
    const terminals = getUniqueValues('terminal');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Sales Data Submitted:', formData);
        // Here we will eventually add Supabase integration
        alert('Venta registrada (simulación)');
    };

    return (
        <div className="min-h-screen bg-background-dark pb-32 text-slate-100 font-sans selection:bg-accent-orange/30">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
            </div>

            <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-center">
                <div className="w-full max-w-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-all active:scale-95 group">
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Registrar Venta</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Nuevo Pedido</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                        <span className="material-symbols-outlined text-accent-orange text-xl">point_of_sale</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 px-6 pt-8 pb-12 flex justify-center">
                <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-8">

                    {/* Section 1: Transaction Details */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#121212]/60 backdrop-blur-md shadow-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <span className="material-symbols-outlined text-sm">receipt_long</span>
                            </div>
                            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Detalles Generales</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-blue-400 transition-colors">Fecha de Venta</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-blue-400 transition-colors">Cliente</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">person</span>
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder="Nombre del Cliente"
                                        list="customers-list"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        required
                                    />
                                    <datalist id="customers-list">
                                        {customers.map(c => <option key={String(c)} value={String(c)} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-blue-400 transition-colors">Producto</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">category</span>
                                    <select
                                        name="product"
                                        value={formData.product}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                                        required
                                    >
                                        <option value="" className="bg-gray-900 text-gray-500">Seleccionar Producto</option>
                                        {products.map(p => <option key={String(p)} value={String(p)} className="bg-gray-900">{String(p)}</option>)}
                                    </select>
                                    <span className="absolute right-4 top-3.5 material-symbols-outlined text-gray-600 text-sm pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-blue-400 transition-colors">Términos de Pago</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">credit_card</span>
                                    <select
                                        name="paymentTerms"
                                        value={formData.paymentTerms}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                                        required
                                    >
                                        <option value="" className="bg-gray-900 text-gray-500">Seleccionar Términos</option>
                                        <option value="Contado" className="bg-gray-900">Contado</option>
                                        <option value="Crédito 15 días" className="bg-gray-900">Crédito 15 días</option>
                                        <option value="Crédito 30 días" className="bg-gray-900">Crédito 30 días</option>
                                    </select>
                                    <span className="absolute right-4 top-3.5 material-symbols-outlined text-gray-600 text-sm pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Logistics & Pricing */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#121212]/60 backdrop-blur-md shadow-xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <div className="w-8 h-8 rounded-full bg-accent-orange/10 flex items-center justify-center text-accent-orange border border-accent-orange/20">
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                            </div>
                            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Logística y Precios</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-accent-orange transition-colors">Transportista (Carrier)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">local_shipping</span>
                                    <input
                                        type="text"
                                        name="carrier"
                                        value={formData.carrier}
                                        onChange={handleChange}
                                        placeholder="Nombre del Carrier"
                                        list="carriers-list"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50 transition-all"
                                        required
                                    />
                                    <datalist id="carriers-list">
                                        {carriers.map(c => <option key={String(c)} value={String(c)} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-accent-orange transition-colors">Proveedor</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">warehouse</span>
                                    <input
                                        type="text"
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleChange}
                                        placeholder="Nombre del Proveedor / Terminal"
                                        list="terminals-list"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50 transition-all"
                                        required
                                    />
                                    <datalist id="terminals-list">
                                        {terminals.map(t => <option key={String(t)} value={String(t)} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-accent-orange transition-colors">Volumen (Galones)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">water_drop</span>
                                    <input
                                        type="number"
                                        name="gallons"
                                        value={formData.gallons}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-accent-orange transition-colors">Cantidad de Unidades</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 material-symbols-outlined text-gray-600 text-[18px]">numbers</span>
                                    <input
                                        type="number"
                                        name="units"
                                        value={formData.units}
                                        onChange={handleChange}
                                        placeholder="1"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-green-500 transition-colors">Costo de Molécula</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500 font-mono text-lg">$</span>
                                    <input
                                        type="number"
                                        name="moleculeCost"
                                        value={formData.moleculeCost}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-400 group-focus-within:text-green-500 transition-colors">Precio de Venta</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500 font-mono text-lg">$</span>
                                    <input
                                        type="number"
                                        name="salePrice"
                                        value={formData.salePrice}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button type="button" onClick={() => navigate('/')} className="px-6 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent-orange to-orange-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            Confirmar Venta
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default Sales;
