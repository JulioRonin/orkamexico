import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '../hooks/useSales';
import truckImage from '../../public/orka_fuel_tanker.png';

const ACTIVE_STATUSES = new Set(['LOADING', 'ON TRACK', 'BOL UPDATED', 'POD PENDING', 'APPROVED']);

const DashboardScreen = () => {
    const navigate = useNavigate();
    const { sales, loading } = useSales();
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
    const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL');
    const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');

    const metrics = useMemo(() => {
        const filtered = sales.filter(s => {
            if (selectedDateFilter !== 'ALL' && s.date !== selectedDateFilter) return false;
            if (selectedClientFilter !== 'ALL' && s.customer !== selectedClientFilter) return false;
            if (selectedProductFilter !== 'ALL' && s.product !== selectedProductFilter) return false;
            return true;
        });

        const statusCounts: Record<string, number> = {};
        const volumeByProduct: Record<string, number> = {};
        const revenueByProduct: Record<string, number> = {};
        const revenueByClient: Record<string, number> = {};
        let totalVolume = 0;

        for (const s of filtered) {
            statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
            const gal = s.gallons || 0;
            volumeByProduct[s.product] = (volumeByProduct[s.product] || 0) + gal;
            totalVolume += gal;
            revenueByProduct[s.product] = (revenueByProduct[s.product] || 0) + s.totalSale;
            revenueByClient[s.customer] = (revenueByClient[s.customer] || 0) + s.totalSale;
        }

        return {
            statusCounts,
            totalOrdersCount: filtered.length,
            activeFleet: filtered.filter(s => ACTIVE_STATUSES.has(s.status)).length,
            volumeByProduct,
            revenueByProduct,
            revenueByClient,
            totalVolume,
            availableClients: Array.from(new Set(sales.map(s => s.customer))).sort(),
            availableProducts: Array.from(new Set(sales.map(s => s.product))).sort(),
        };
    }, [sales, selectedDateFilter, selectedClientFilter, selectedProductFilter]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm animate-pulse">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex flex-col bg-background-dark pb-32 overflow-x-hidden">
            <header className="fixed top-0 w-full z-50 px-6 pt-12 pb-4 flex justify-center pointer-events-none">
                <div className="w-full max-w-7xl flex justify-between items-center pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">O</div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold tracking-wide text-white leading-tight">ORKA MEXICO</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Operations View</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition border border-white/5">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </button>
                        <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition border border-white/5">
                            <span className="material-symbols-outlined text-xl">settings</span>
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="w-full max-w-5xl mx-auto mt-6 pointer-events-auto flex justify-center px-4 animate-in slide-in-from-top duration-500 delay-100 fill-mode-both z-50">
                    <div className="glass-panel bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-full overflow-x-auto no-scrollbar">

                        {/* Date Filter */}
                        <div className="relative flex items-center group">
                            <div className="absolute left-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors pointer-events-none z-10">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-[14px]">calendar_month</span>
                            </div>

                            {selectedDateFilter === 'ALL' && (
                                <div className="absolute left-11 right-4 top-1/2 -translate-y-1/2 text-xs text-white font-medium pointer-events-none z-10 flex items-center">
                                    Todos los Días
                                </div>
                            )}

                            <input
                                type="date"
                                value={selectedDateFilter === 'ALL' ? '' : selectedDateFilter}
                                onChange={(e) => setSelectedDateFilter(e.target.value || 'ALL')}
                                className={`bg-transparent text-xs pl-11 pr-4 py-2 outline-none cursor-pointer min-w-[150px] font-medium transition-all hover:bg-white/5 rounded-full border border-transparent hover:border-white/10 focus:bg-white/10 focus:border-primary/50 relative z-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${selectedDateFilter === 'ALL' ? 'text-transparent' : 'text-white'}`}
                            />
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 self-center mx-1"></div>

                        {/* Client Filter */}
                        <div className="relative flex items-center group">
                            <div className="absolute left-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-orange/20 transition-colors pointer-events-none z-10">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-accent-orange transition-colors text-[14px]">storefront</span>
                            </div>
                            <select
                                value={selectedClientFilter}
                                onChange={(e) => setSelectedClientFilter(e.target.value)}
                                className="bg-transparent text-white text-xs pl-11 pr-8 py-2 outline-none cursor-pointer appearance-none min-w-[160px] font-medium transition-all hover:bg-white/5 rounded-full border border-transparent hover:border-white/10 focus:bg-white/10 focus:border-accent-orange/50 relative z-10"
                            >
                                <option value="ALL" className="bg-gray-900 text-gray-300">Todos los Clientes</option>
                                {metrics.availableClients.map(client => (
                                    <option key={client} value={client} className="bg-gray-900">{client}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 text-gray-500 text-[16px] pointer-events-none group-hover:text-white transition-colors z-20">expand_more</span>
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 self-center mx-1"></div>

                        {/* Product Filter */}
                        <div className="relative flex items-center group">
                            <div className="absolute left-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-green-500/20 transition-colors pointer-events-none z-10">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-green-500 transition-colors text-[14px]">local_gas_station</span>
                            </div>
                            <select
                                value={selectedProductFilter}
                                onChange={(e) => setSelectedProductFilter(e.target.value)}
                                className="bg-transparent text-white text-xs pl-11 pr-8 py-2 outline-none cursor-pointer appearance-none min-w-[150px] font-medium transition-all hover:bg-white/5 rounded-full border border-transparent hover:border-white/10 focus:bg-white/10 focus:border-green-500/50 relative z-10"
                            >
                                <option value="ALL" className="bg-gray-900 text-gray-300">Todos los Prod.</option>
                                {metrics.availableProducts.map(product => (
                                    <option key={product} value={product} className="bg-gray-900">{product}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 text-gray-500 text-[16px] pointer-events-none group-hover:text-white transition-colors z-20">expand_more</span>
                        </div>

                    </div>
                </div>

                {/* Background Gradient for Header Legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent -z-10"></div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-[500px] h-[55vh] w-full bg-[#050505] overflow-hidden flex flex-col items-center justify-center pt-20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/10 via-black to-black"></div>

                <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-center px-4 h-full">
                    {/* Floating Title */}
                    <div className="absolute top-10 left-6 lg:left-0 z-20">
                        <h1 className="text-4xl font-light text-white leading-none tracking-tight">ORKA MEXICO</h1>
                        <p className="text-xs text-primary mt-2 flex items-center gap-1 bg-primary/10 w-fit px-2 py-1 rounded-full border border-primary/20">
                            <span className="material-symbols-outlined text-sm">location_on</span> Monterrey Nuevo Leon
                        </p>
                    </div>

                    <img
                        alt="ORKA Fuel Tanker"
                        className="w-full max-w-2xl h-auto object-contain drop-shadow-2xl opacity-90 mix-blend-screen grayscale contrast-125 brightness-90 mt-10"
                        src={truckImage}
                    />

                    <div className="absolute right-6 lg:right-0 bottom-20 z-20 w-44 animate-in slide-in-from-right duration-700 delay-300 fill-mode-both hover:-translate-y-1 transition-transform">
                        <div className="glass-panel rounded-xl p-4 border-l-2 border-l-green-500 bg-black/60 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Entregas</span>
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                            </div>
                            <div className="text-3xl font-light text-white relative z-10">
                                {metrics.statusCounts['DONE'] || 0}
                                <span className="text-sm text-gray-400"> unds</span>
                            </div>
                            <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden relative z-10">
                                <div
                                    className="bg-green-500 h-full opacity-80 group-hover:opacity-100 transition-opacity"
                                    style={{ width: `${Math.min(100, ((metrics.statusCounts['DONE'] || 0) / Math.max(1, metrics.totalOrdersCount)) * 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-[10px] text-right text-green-400 mt-1 font-medium relative z-10">Completadas</div>
                        </div>
                    </div>
                </div>

                {/* Center Floating Menu */}
                <div className="absolute bottom-6 z-20 w-full flex justify-center">
                    <div className="glass-panel rounded-full p-1.5 flex items-center gap-1 shadow-2xl border border-white/10">
                        <button onClick={() => navigate('/monitor')} className="px-5 py-2 rounded-full hover:bg-white/5 text-xs font-medium text-gray-400 transition">Fleet</button>
                        <button onClick={() => navigate('/sales')} className="px-5 py-2 rounded-full hover:bg-white/5 text-xs font-medium text-gray-400 transition">Sales</button>
                        <button onClick={() => navigate('/finance')} className="px-5 py-2 rounded-full bg-white/10 text-xs font-medium text-white shadow-sm border border-white/5">Finance</button>
                    </div>
                </div>
            </section>

            {/* Metrics Grid */}
            <section className="flex-1 bg-background-light rounded-t-[2.5rem] -mt-10 z-30 relative shadow-[0_-10px_60px_rgba(0,0,0,0.7)] overflow-hidden border-t border-white/5">
                <div className="w-full max-w-5xl mx-auto p-6 space-y-4 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full auto-rows-[160px]">

                        {/* Panel 1: Completion Gauge */}
                        <div className="md:col-span-5 md:row-span-2 bg-gradient-to-br from-card-dark to-[#1a1a1a] p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden group flex flex-col justify-between animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>

                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <h3 className="text-white font-bold text-lg">Entregas</h3>
                                    <p className="text-xs text-gray-400">Completadas vs Total</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                    <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center relative mt-4 z-10">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" fill="none" r="68" stroke="rgba(255,255,255,0.05)" strokeWidth="12"></circle>
                                        <circle
                                            cx="80" cy="80" fill="none" r="68"
                                            stroke="#10B981"
                                            strokeDasharray="427"
                                            strokeDashoffset={Math.max(0, 427 - (427 * ((Number(metrics.statusCounts['DONE']) || 0) / Math.max(1, Number(metrics.totalOrdersCount)))))}
                                            strokeLinecap="round" strokeWidth="12"
                                            className="transition-all duration-1500 ease-out"
                                        ></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-white">{metrics.statusCounts['DONE'] || 0}</span>
                                        <span className="text-xs text-gray-400 font-medium">/ {metrics.totalOrdersCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel 2: Flota Activa */}
                        <div className="md:col-span-7 md:row-span-1 bg-card-dark p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-sm">Flota Activa <span className="text-gray-500 font-normal">({metrics.activeFleet})</span></h3>
                            </div>

                            <div className="relative w-full h-16 flex items-center">
                                <div className="absolute left-[10%] right-[10%] h-0.5 bg-gray-800 top-1/2 -translate-y-1/2 z-0"></div>
                                <div
                                    className="absolute left-[10%] h-0.5 bg-gradient-to-r from-blue-500 to-green-500 top-1/2 -translate-y-1/2 z-0 transition-all duration-1000"
                                    style={{ width: `${Math.min(80, (metrics.activeFleet / 15) * 80)}%` }}
                                ></div>

                                <div className="w-full flex justify-between relative z-10 px-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-card-dark shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"></div>
                                        <span className="text-[10px] text-gray-400 font-mono">LOADING ({metrics.statusCounts['LOADING'] || 0})</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-yellow-500 border-4 border-card-dark shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                        <span className="text-[10px] text-gray-400 font-mono">ON TRACK ({metrics.statusCounts['ON TRACK'] || 0})</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-card-dark shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                                        <span className="text-[10px] text-gray-400 font-mono">POD ({metrics.statusCounts['POD PENDING'] || 0})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel 3: Productos Breakdown */}
                        <div className="md:col-span-4 md:row-span-1 bg-card-dark p-5 rounded-[2rem] shadow-xl border border-white/5 flex flex-col justify-between animate-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
                            <h3 className="text-white font-bold text-sm mb-3">Galones por Producto</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(metrics.volumeByProduct).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([product, volume], idx) => (
                                    <div key={product} className="space-y-1">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-300 font-medium">{product}</span>
                                            <span className="text-white font-mono">{Number(volume).toLocaleString()} <span className="text-[9px] text-gray-500">GL</span></span>
                                        </div>
                                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${(Number(volume) / Math.max(1, Number(metrics.totalVolume))) * 100}%`, backgroundColor: idx === 0 ? '#3B82F6' : idx === 1 ? '#10B981' : '#F59E0B' }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(metrics.volumeByProduct).length === 0 && (
                                    <div className="text-xs text-gray-500 h-full flex items-center justify-center italic">Sin datos</div>
                                )}
                            </div>
                        </div>

                        {/* Panel 4: Top Clientes */}
                        <div className="md:col-span-3 md:row-span-1 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5 rounded-[2rem] shadow-xl border border-white/5 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-both relative overflow-hidden">
                            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-accent-orange/10 rounded-full blur-2xl"></div>
                            <h3 className="text-white font-bold text-sm mb-3 relative z-10">Top Clientes</h3>
                            <div className="flex-1 flex flex-col justify-center gap-3 relative z-10">
                                {Object.entries(metrics.revenueByClient).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3).map(([client, revenue], idx) => (
                                    <div key={client} className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-300/20 text-gray-300' : 'bg-orange-400/20 text-orange-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 truncate text-xs text-gray-300 font-medium">{client}</div>
                                    </div>
                                ))}
                                {Object.keys(metrics.revenueByClient).length === 0 && (
                                    <div className="text-xs text-gray-500 text-center italic">No hay clientes activos</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default DashboardScreen;
