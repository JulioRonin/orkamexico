import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesData, getUniqueValues } from './data';

const SalesScreen = () => {
    const navigate = useNavigate();

    // Filter States
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Derived Lists for Filters
    const customers = getUniqueValues('customer');
    const statuses = getUniqueValues('status');

    // Filter Logic
    const filteredSales = useMemo(() => {
        return salesData.filter(sale => {
            const matchesDate = selectedDate ? sale.date === selectedDate : true;
            const matchesStatus = selectedStatus ? sale.status === selectedStatus : true;
            const matchesCustomer = selectedCustomer ? sale.customer === selectedCustomer : true;
            const matchesSearch = searchTerm ?
                (sale.bol.includes(searchTerm) ||
                    sale.truck.includes(searchTerm) ||
                    sale.carrier.toLowerCase().includes(searchTerm.toLowerCase()))
                : true;

            return matchesDate && matchesStatus && matchesCustomer && matchesSearch;
        });
    }, [selectedDate, selectedStatus, selectedCustomer, searchTerm]);

    // --- Advanced Metrics Calculation ---

    // 1. Total Revenue Trend (Simulated Sparkline Data from last 7 entries)
    // In real app, aggregate by day. Here we just take last few sales for visual
    const revenueTrend = filteredSales.slice(-10).map(s => s.totalSale);
    const maxRevenue = Math.max(...revenueTrend, 1);
    const sparklinePoints = revenueTrend.map((val, i) => {
        const x = (i / (revenueTrend.length - 1)) * 100;
        const y = 100 - (val / maxRevenue) * 100;
        return `${x},${y}`;
    }).join(' ');

    // 2. Volume by Product
    const volumeByProduct = filteredSales.reduce((acc, sale) => {
        acc[sale.product] = (acc[sale.product] || 0) + sale.gallons;
        return acc;
    }, {} as Record<string, number>);
    const totalVol = Object.values(volumeByProduct).reduce((a: number, b: number) => a + b, 0);

    // 3. Top Carriers
    const carrierPerformance = filteredSales.reduce((acc, sale) => {
        acc[sale.carrier] = (acc[sale.carrier] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const sortedCarriers = Object.entries(carrierPerformance)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3); // Top 3

    // 4. Top Customers (New Metric)
    const customerPerformance = filteredSales.reduce((acc, sale) => {
        acc[sale.customer] = (acc[sale.customer] || 0) + sale.gallons;
        return acc;
    }, {} as Record<string, number>);
    const sortedCustomers = Object.entries(customerPerformance)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3); // Top 3 by Volume
    const maxCustomerVol = sortedCustomers.length > 0 ? (sortedCustomers[0][1] as number) : 1;


    // 5. Margin Calculations
    const marginMetrics = filteredSales.reduce((acc, sale) => {
        const cost = (sale.gallons * (sale.unitCost || 0));
        const profit = sale.totalSale - cost;

        if (sale.status === 'DONE' || sale.status === 'APPROVED') {
            acc.approvedProfit += profit;
            acc.approvedRevenue += sale.totalSale;
        } else {
            acc.pendingProfit += profit;
            acc.pendingRevenue += sale.totalSale;
        }
        return acc;
    }, { approvedProfit: 0, approvedRevenue: 0, pendingProfit: 0, pendingRevenue: 0 });

    const approvedMarginPercent = marginMetrics.approvedRevenue > 0 ? (marginMetrics.approvedProfit / marginMetrics.approvedRevenue) * 100 : 0;
    const pendingMarginPercent = marginMetrics.pendingRevenue > 0 ? (marginMetrics.pendingProfit / marginMetrics.pendingRevenue) * 100 : 0;

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalSale, 0);

    return (
        <div className="min-h-screen bg-background-dark pb-32 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Ambient Background Lights */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-center shadow-2xl">
                <div className="w-full max-w-[1400px] flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-all active:scale-95 group shadow-lg">
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">Historial de Ventas</h1>
                            <p className="text-xs text-blue-400 font-semibold tracking-widest uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Live Transaction Feed
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/sales/new')}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center gap-2 transition-all active:scale-95 border border-white/10"
                    >
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                        <span className="hidden sm:inline">Nueva Venta</span>
                    </button>
                </div>
            </header>

            <main className="relative z-10 px-6 pt-8 w-full max-w-[1400px] mx-auto space-y-8">

                {/* 1. Hyper-Realistic Dashboards Grid - Updated Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">

                    {/* Revenue Card */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a]/80 to-[#121212]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-white">payments</span>
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ingresos Totales</h3>
                        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-mono tracking-tight">
                            ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>

                        {/* Sparkline Visualization */}
                        <div className="h-12 mt-4 w-full relative">
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {sparklinePoints && (
                                    <>
                                        <path d={`M0,100 L0,100 ${sparklinePoints.split(' ').map((p, i) => `L${p}`).join(' ')} L100,100 Z`} fill="url(#revenueGradient)" />
                                        <polyline
                                            points={sparklinePoints}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                    </div>

                    {/* Approved Margin Card */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a]/80 to-[#121212]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Margen Aprobado
                        </h3>
                        <div className="text-3xl font-bold text-white font-mono tracking-tight">
                            ${marginMetrics.approvedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-400">
                                {approvedMarginPercent.toFixed(1)}% MARGEN
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                    </div>

                    {/* Pending Margin Card */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a]/80 to-[#121212]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">pending_actions</span>
                            Margen Pendiente
                        </h3>
                        <div className="text-3xl font-bold text-white font-mono tracking-tight">
                            ${marginMetrics.pendingProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400">
                                {pendingMarginPercent.toFixed(1)}% MARGEN
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
                    </div>

                    {/* Volume Product Breakdown */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a]/80 to-[#121212]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Volumen por Producto</h3>
                        <div className="space-y-4">
                            {Object.entries(volumeByProduct).map(([product, vol], i) => {
                                const percent = (vol / totalVol) * 100;
                                const color = product === 'ULSD' ? 'bg-orange-500' : product === 'ETHANOL' ? 'bg-green-500' : 'bg-purple-500';
                                return (
                                    <div key={product} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-gray-300">
                                            <span>{product}</span>
                                            <span className="text-white font-mono">{vol.toLocaleString()} <span className="text-[10px] text-gray-500">gal</span></span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
                                                style={{ width: `${percent}%`, transitionDelay: `${i * 100}ms` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Top Customers (New) */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a]/80 to-[#121212]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Clientes</h3>
                        <div className="space-y-4">
                            {sortedCustomers.map(([customer, vol], index) => {
                                const percent = (vol / maxCustomerVol) * 100;
                                return (
                                    <div key={customer} className="space-y-2 relative z-10">
                                        <div className="flex flex-col">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-gray-600'}`}></span>
                                                    {customer}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-400">{(vol / 1000).toFixed(1)}k gal</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                                                    style={{ width: `${percent}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Decorative background blur */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                    </div>

                    {/* Top Carriers */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a]/80 to-[#121212]/80 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Transportistas</h3>
                        <div className="space-y-3">
                            {sortedCarriers.map(([carrier, count], index) => (
                                <div key={carrier} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-700 text-gray-400'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-semibold text-gray-200 text-sm">{carrier}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-bold text-white leading-none">{count}</span>
                                        <span className="text-[9px] text-gray-500 uppercase">Viajes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Advanced Filters Bar */}
                <div className="sticky top-24 z-30 glass-panel p-4 rounded-2xl border border-white/5 bg-[#121212]/80 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between transition-all hover:border-white/10">
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        <div className="relative group">
                            <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-500 text-sm group-hover:text-blue-400 transition-colors">calendar_today</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 hover:bg-black/60 transition-colors cursor-pointer"
                            />
                        </div>

                        {['Customer', 'Status'].map(filterType => (
                            <div key={filterType} className="relative group">
                                <select
                                    value={filterType === 'Customer' ? selectedCustomer : selectedStatus}
                                    onChange={(e) => filterType === 'Customer' ? setSelectedCustomer(e.target.value) : setSelectedStatus(e.target.value)}
                                    className="pl-3 pr-8 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none min-w-[140px] hover:bg-black/60 transition-colors cursor-pointer"
                                >
                                    <option value="">All {filterType}s</option>
                                    {(filterType === 'Customer' ? customers : statuses).map(o => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
                                </select>
                                <span className="absolute right-2 top-2.5 material-symbols-outlined text-gray-500 text-sm pointer-events-none group-hover:text-white transition-colors">expand_more</span>
                            </div>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-500 group-focus-within:text-blue-400 transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Search BOL, Truck ID, Carrier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:bg-black/60 focus:border-blue-500/50 transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* 3. High-Fidelity Data List */}
                <div className="glass-panel rounded-2xl border border-white/5 bg-[#121212]/60 backdrop-blur-xl overflow-hidden shadow-2xl mb-20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/40 text-xs uppercase font-bold text-gray-500 border-b border-white/5 tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">Date / BOL</th>
                                    <th className="px-6 py-5">Customer</th>
                                    <th className="px-6 py-5">Product</th>
                                    <th className="px-6 py-5">Assigned Unit</th>
                                    <th className="px-6 py-5 text-right">Volume</th>
                                    <th className="px-6 py-5 text-right">Total USD</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredSales.map((sale, index) => (
                                    <tr key={sale.id} className="hover:bg-white/5 transition-all duration-300 group cursor-pointer animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col relative z-10">
                                                <span className="text-white font-bold text-base group-hover:text-blue-400 transition-colors">{sale.date}</span>
                                                <span className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-wide group-hover:text-gray-400">BOL: <span className="text-gray-300">{sale.bol}</span></span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center text-xs font-bold ring-2 ring-black/50">
                                                    {sale.customer.charAt(0)}
                                                </div>
                                                <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{sale.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${sale.product === 'ULSD' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]' :
                                                sale.product === 'ETHANOL' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                                                    'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                                                }`}>
                                                {sale.product}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                                    <span className="material-symbols-outlined text-orange-500 text-lg">local_shipping</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-200 font-bold text-xs">{sale.truck} <span className="text-gray-500 font-normal">/ {sale.trailer}</span></span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{sale.carrier}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-white font-mono font-bold tracking-tight">{sale.gallons.toLocaleString()} <span className="text-gray-500 text-[10px] font-sans">gal</span></span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-green-400 font-mono font-bold tracking-tight shadow-green-500/10 drop-shadow-sm">
                                                ${sale.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-lg border backdrop-blur-md
                                                ${sale.status === 'DONE' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-green-900/20' :
                                                    sale.status === 'LOADING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-900/20 animate-pulse' :
                                                        sale.status === 'ON TRACK' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                }`}>

                                                {sale.status === 'DONE' && <span className="material-symbols-outlined text-[12px]">verified</span>}
                                                {sale.status === 'LOADING' && <span className="material-symbols-outlined text-[12px] animate-spin">refresh</span>}
                                                {sale.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSales.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-gray-500">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 animate-bounce">
                                    <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-300">No transactions found</h3>
                                <p className="text-sm">Try adjusting your filters or search terms.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesScreen;
