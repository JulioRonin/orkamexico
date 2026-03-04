import React, { useState, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SalesForm from './SalesForm';
import SalesScreen from './SalesScreen';
import PartnersScreen from './PartnersScreen';
import PaymentRegistrationModal from './PaymentRegistrationModal';
import { getMetrics, getClientBalances, getDetailedBalanceReport, getClientCollectionDetail, salesData as initialSalesData, Sale } from './data';
import truckImage from './Public/orka_fuel_tanker.png';
import logoBlanco from './logo/ORKA MEXICO/ORKA-MEXICO-BLANCO.png';
import LoginScreen, { UserRole } from './LoginScreen';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Shared Components ---

const BottomNav = ({ role, onLogout }: { role: UserRole, onLogout: () => void }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;
    const getIconClass = (path: string) => isActive(path) ? "text-primary" : "text-gray-400 hover:text-white";

    const navItems = [
        { path: '/', label: 'Home', icon: 'dashboard', roles: ['ADMIN', 'CREDITO', 'VENTAS'] },
        { path: '/monitor', label: 'Monitor', icon: 'radar', roles: ['ADMIN', 'OPERACIONES', 'VENTAS'] },
        { path: '/compliance', label: 'Docs', icon: 'description', roles: ['ADMIN', 'OPERACIONES', 'CREDITO', 'VENTAS'] },
        { path: '/finance', label: 'Finance', icon: 'payments', roles: ['ADMIN', 'CREDITO'] },
        { path: '/sales', label: 'Sales', icon: 'point_of_sale', roles: ['ADMIN', 'CREDITO', 'VENTAS'] },
        { path: '/partners', label: 'Socios', icon: 'group', roles: ['ADMIN', 'CREDITO', 'VENTAS'] },
    ];

    const allowedItems = navItems.filter(item => item.roles.includes(role));

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-2xl px-6 pointer-events-auto">
                <div className="glass-panel backdrop-blur-md rounded-2xl p-2 flex justify-between items-center shadow-2xl border border-white/5 bg-[#171717]/90 min-h-[70px]">
                    <div className="flex justify-between items-center w-full px-2">
                        {allowedItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 hover:scale-110 ${getIconClass(item.path)}`}
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                            </button>
                        ))}

                        <div className="w-px h-8 bg-white/10 mx-2"></div>

                        <button
                            onClick={onLogout}
                            className="flex flex-col items-center gap-1 px-3 py-1 text-red-400 hover:text-red-300 transition-all hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-[22px]">logout</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav >
    );
};

// --- Component: Volume Reconciliation Card ---

const ReconciliationCard = () => {
    // Mock data simulation
    const bolVolume = 32000;
    const meterVolume = 31820;
    const variance = bolVolume - meterVolume;
    const variancePercent = (variance / bolVolume) * 100;
    const tolerance = 0.5; // 0.5% tolerance
    const isRisk = variancePercent > tolerance;

    return (
        <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden transition-all ${isRisk ? 'bg-red-900/10 border-red-500/30' : 'bg-card-dark border-gray-800'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRisk ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                        <span className="material-symbols-outlined">{isRisk ? 'warning' : 'verified'}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Volume Reconciliation</h3>
                        <p className="text-xs text-gray-400">Order #MX-4092</p>
                    </div>
                </div>
                {isRisk && (
                    <span className="px-2 py-1 rounded bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Discrepancy
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">BOL (Loaded)</span>
                    <span className="text-lg font-mono text-white">{bolVolume.toLocaleString()} L</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 mb-1">vs</span>
                    <span className="material-symbols-outlined text-gray-600 text-sm">compare_arrows</span>
                </div>
                <div className="flex-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Meter (Delivered)</span>
                    <span className="text-lg font-mono text-white">{meterVolume.toLocaleString()} L</span>
                </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                <div>
                    <span className="text-xs text-gray-400">Variance Detected</span>
                    <div className={`text-lg font-bold ${isRisk ? 'text-red-400' : 'text-green-400'}`}>
                        {variance > 0 ? '-' : '+'}{Math.abs(variance)} L <span className="text-xs font-normal opacity-70">({variancePercent.toFixed(2)}%)</span>
                    </div>
                </div>
                <div className="h-10 w-32 relative">
                    {/* Simple Bar Chart Visualization */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 rounded-full transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 h-3 w-0.5 bg-gray-500 transform -translate-y-1/2 -translate-x-1/2"></div> {/* Center mark */}
                    {/* Actual value bar */}
                    <div
                        className={`absolute top-1/2 left-1/2 h-1.5 rounded-full transform -translate-y-1/2 origin-left ${isRisk ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{
                            width: `${Math.min(Math.abs(variancePercent) * 20, 50)}%`, // Scale for visual
                            transform: `translateY(-50%) ${variance > 0 ? 'rotate(180deg)' : ''}`
                        }}
                    ></div>
                </div>
            </div>

            {isRisk && (
                <div className="mt-3 flex gap-2">
                    <button className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition">
                        Report Theft
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700 transition">
                        View Audit Log
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Screen 1: Executive Dashboard ---

const DashboardScreen = () => {
    const navigate = useNavigate();
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
    const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL');
    const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');

    const metrics = useMemo(() => getMetrics({
        date: selectedDateFilter,
        client: selectedClientFilter,
        product: selectedProductFilter
    }), [selectedDateFilter, selectedClientFilter, selectedProductFilter]);

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

                {/* Truck Visual Container - Centered and Contained */}
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
                                    className="bg-green-500 h-full w-full opacity-80 group-hover:opacity-100 transition-opacity"
                                    style={{ width: `${Math.min(100, ((metrics.statusCounts['DONE'] || 0) / 10) * 100)}%` }}
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
            <section className="flex-1 bg-background-light dark:bg-[#0f0f0f] rounded-t-[2.5rem] -mt-10 z-30 relative shadow-[0_-10px_60px_rgba(0,0,0,0.7)] overflow-hidden border-t border-white/5">
                <div className="w-full max-w-5xl mx-auto p-6 space-y-4 pt-8">
                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full auto-rows-[160px]">

                        {/* Panel 1: Completion Gauge (Large Square, 4x4) */}
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
                                {/* SVG Gauge */}
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="80" cy="80" fill="none" r="68"
                                            stroke="rgba(255,255,255,0.05)" strokeWidth="12"
                                        ></circle>
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

                        {/* Panel 2: Estatus Pipeline (Wide Rect, 7x1) */}
                        <div className="md:col-span-7 md:row-span-1 bg-card-dark p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-sm">Flota Activa <span className="text-gray-500 font-normal">({metrics.activeFleet})</span></h3>
                            </div>

                            <div className="relative w-full h-16 flex items-center">
                                {/* Connecting Line */}
                                <div className="absolute left-[10%] right-[10%] h-0.5 bg-gray-800 top-1/2 -translate-y-1/2 z-0"></div>
                                <div
                                    className="absolute left-[10%] h-0.5 bg-gradient-to-r from-blue-500 to-green-500 top-1/2 -translate-y-1/2 z-0 transition-all duration-1000"
                                    style={{ width: `${Math.min(80, (metrics.activeFleet / 15) * 80)}%` }} // simulated progress
                                ></div>

                                {/* Nodes */}
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

                        {/* Panel 3: Productos Breakdown (Square, 4x1) */}
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
                                                className={`h-full rounded-full transition-all duration-1000 ease-out custom-gradient-${(idx % 3) + 1}`}
                                                style={{ width: `${(Number(volume) / Math.max(1, Number(metrics.totalVolume))) * 100}%`, backgroundColor: idx === 0 ? '#3B82F6' : idx === 1 ? '#10B981' : '#F59E0B' }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(metrics.revenueByProduct).length === 0 && (
                                    <div className="text-xs text-gray-500 h-full flex items-center justify-center italic">Sin datos</div>
                                )}
                            </div>
                        </div>

                        {/* Panel 4: Top Clientes (Small Rect, 3x1) */}
                        <div className="md:col-span-3 md:row-span-1 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5 rounded-[2rem] shadow-xl border border-white/5 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-both relative overflow-hidden">
                            {/* Decorative mesh */}
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

// --- Screen 2: Fleet Security Monitor ---

const MonitorScreen = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<Sale | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const filteredUnits = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return initialSalesData.filter(sale =>
            sale.carrier.toLowerCase().includes(lowerTerm) ||
            sale.truck.toLowerCase().includes(lowerTerm) ||
            sale.bol.toLowerCase().includes(lowerTerm)
        ).slice(0, 5); // Limit results
    }, [searchTerm]);

    return (
        <div className="relative h-screen w-full overflow-hidden flex flex-col bg-background-dark text-slate-100">
            {/* Background Map Simulation - Fixed at bottom z-0 */}
            <div className="absolute inset-0 z-0 map-bg w-full h-full">
                <div className="absolute top-1/3 left-1/4 w-0.5 h-32 bg-slate-700/50 rotate-45 transform"></div>
                <div className="absolute top-1/4 right-1/3 w-0.5 h-64 bg-slate-700/50 -rotate-12 transform"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-0.5 bg-slate-700/50 rotate-90 transform"></div>

                {/* Simulated Route Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <path className="opacity-40" d="M120 100 Q 200 300 180 450 T 250 600" fill="none" stroke="#3B82F6" strokeDasharray="8 4" strokeWidth="4"></path>
                    {/* Deviation Path in Red */}
                    <path d="M180 450 Q 150 500 100 520" fill="none" stroke="#EF4444" strokeDasharray="4 2" strokeWidth="3"></path>
                </svg>

                {/* Truck Marker - Centered better */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <div className={`w-16 h-16 ${selectedUnit ? 'bg-blue-500/20' : 'bg-accent-red/20'} rounded-full flex items-center justify-center ${selectedUnit ? 'animate-pulse' : 'animate-pulse-red'}`}>
                        <div className={`w-5 h-5 ${selectedUnit ? 'bg-blue-500' : 'bg-accent-red'} rounded-full border-2 border-white dark:border-background-dark shadow-lg`}></div>
                    </div>
                    <div className="bg-card-dark text-[10px] px-3 py-1.5 rounded-lg shadow-xl mt-2 font-mono border border-slate-700 text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedUnit ? 'bg-blue-500' : 'bg-accent-red'}`}></span> {selectedUnit ? `Unit ${selectedUnit.truck}` : 'TRUCK-802'}
                    </div>
                </div>

                {/* Vignette Overlay for dark mode feel */}
                <div className="absolute inset-0 pointer-events-none dark-mode-overlay"></div>
            </div>

            {/* Header */}
            <header className="relative z-20 px-6 pt-8 pb-4 flex justify-center pointer-events-none">
                <div className="w-full max-w-7xl flex justify-between items-center pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-white/5 hover:bg-slate-700 transition">
                            <span className="material-symbols-outlined text-slate-300">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Orka Mexico</h1>
                            <p className="text-lg font-bold">Fleet Monitor</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm relative border border-white/5">
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent-red rounded-full animate-pulse"></span>
                            <span className="material-symbols-outlined text-slate-300 text-xl">notifications</span>
                        </button>
                        <button className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-white/5">
                            <span className="material-symbols-outlined text-slate-300 text-xl">settings</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Overlay - Constrained width */}
            <main className="relative z-10 flex-1 flex flex-col justify-between px-4 pb-28 w-full max-w-6xl mx-auto pointer-events-none">
                {/* Search Bar - Floating below header */}
                <div className="w-full flex justify-center mt-2 mb-4 pointer-events-auto relative z-30">
                    <div className="w-full max-w-lg relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-blue-500 transition-colors">search</span>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-[#1a1a1a]/80 backdrop-blur-md text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-[#1a1a1a] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-lg"
                            placeholder="Buscar unidad por Carrier, Truck ID o BOL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                        {/* Search Results Dropdown */}
                        {isSearchFocused && filteredUnits.length > 0 && (
                            <div className="absolute mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                {filteredUnits.map((unit) => (
                                    <div
                                        key={unit.id}
                                        className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                        onMouseDown={() => {
                                            setSelectedUnit(unit);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-semibold text-white">Unit {unit.truck} <span className="text-slate-500 font-normal">({unit.carrier})</span></div>
                                                <div className="text-xs text-slate-400">BOL: {unit.bol} • {unit.product}</div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${unit.status === 'DONE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {unit.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area: Either Alert or Selected Unit Details */}
                <div className="mt-2 pointer-events-auto w-full flex justify-center">
                    {selectedUnit ? (
                        /* Selected Unit Details Card */
                        <div className="w-full max-w-2xl bg-[#1a1a1a]/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-blue-500/30 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Blue glow effect */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                                        <span className="material-symbols-outlined">local_shipping</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white leading-none">UNIT {selectedUnit.truck}</h2>
                                        <p className="text-xs text-blue-400 font-medium tracking-wide uppercase mt-1">{selectedUnit.carrier}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${selectedUnit.status === 'DONE' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                        {selectedUnit.status}
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-1 font-mono">BOL: {selectedUnit.bol}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Producto</p>
                                    <p className="text-sm font-bold text-white truncate">{selectedUnit.product}</p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Volumen</p>
                                    <p className="text-sm font-bold text-white">{selectedUnit.gallons.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">gal</span></p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cliente</p>
                                    <p className="text-sm font-bold text-white truncate">{selectedUnit.customer}</p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Terminal</p>
                                    <p className="text-sm font-bold text-white truncate">{selectedUnit.terminal}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 px-4 text-xs font-semibold shadow-lg shadow-blue-900/20 transition-all active:scale-95">
                                    View Manifest
                                </button>
                                <button
                                    onClick={() => setSelectedUnit(null)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Default Alert Card */
                        <div className="w-full max-w-2xl bg-[#1a1a1a]/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-red-500/30 relative overflow-hidden">
                            {/* Red glow effect */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-red/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className="flex items-center gap-2 text-accent-red font-bold tracking-tight">
                                    <span className="material-symbols-outlined animate-bounce">warning</span>
                                    <span>ROUTING DEVIATION</span>
                                </div>
                                <span className="text-[10px] font-mono bg-red-900/40 text-red-200 px-2 py-1 rounded border border-red-500/20">ALERT #902</span>
                            </div>
                            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                                Vehicle <span className="font-semibold text-white">TRUCK-802</span> has deviated from assigned Geo-Fence Corridor C-4.
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Deviation</p>
                                    <p className="text-lg font-bold text-accent-red">2.4 km</p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Huachicol Risk</p>
                                    <p className="text-lg font-bold text-orange-500">High</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Controls */}
                <div className="absolute right-4 top-1/3 flex flex-col gap-3 pointer-events-auto">
                    <button className="w-12 h-12 bg-[#1a1a1a] border border-white/10 rounded-xl flex items-center justify-center shadow-xl text-slate-300 hover:bg-[#252525] transition">
                        <span className="material-symbols-outlined">my_location</span>
                    </button>
                    <button className="w-12 h-12 bg-[#1a1a1a] border border-white/10 rounded-xl flex items-center justify-center shadow-xl text-slate-300 hover:bg-[#252525] transition">
                        <span className="material-symbols-outlined">layers</span>
                    </button>
                </div>

                {/* Bottom Stats Sheet */}
                <div className="space-y-3 pointer-events-auto w-full max-w-4xl mx-auto">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Speed</span>
                            <span className="text-xl font-bold font-mono mt-1">64 <span className="text-xs font-normal text-slate-400">km/h</span></span>
                        </div>
                        <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                            <span className="text-sm font-bold text-green-500 mt-1 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Transit
                            </span>
                        </div>
                        <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Fuel</span>
                            <span className="text-xl font-bold font-mono mt-1">82%</span>
                        </div>
                    </div>

                    {/* Live Activity Monitor */}
                    <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/5">
                        <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                            <span>Activity Monitor</span>
                            <span className="text-[10px] bg-red-900/50 text-red-200 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live
                            </span>
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Legal Stops</span>
                                    <span className="text-xs font-bold text-white">2</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-1/3"></div>
                                </div>
                            </div>
                            <div className="w-px bg-slate-700"></div>
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Illegal Stops</span>
                                    <span className="text-xs font-bold text-accent-red">1</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-red w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-accent-red hover:bg-red-700 text-white rounded-xl py-3.5 px-4 font-semibold shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                            <span className="material-symbols-outlined text-lg">shield</span>
                            Activate Protocol
                        </button>
                        <button className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3.5 px-4 font-medium shadow-lg flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95">
                            <span className="material-symbols-outlined text-lg">call</span>
                            Contact Driver
                        </button>
                    </div>
                </div>
            </main>

            {/* Coordinates Footer */}
            <div className="absolute bottom-24 left-0 w-full flex justify-center pointer-events-none z-0">
                <span className="font-mono text-[10px] text-slate-400 bg-black/70 px-3 py-1 rounded-full backdrop-blur border border-white/5 shadow-lg">
                    LAT: 19.4326° N • LNG: 99.1332° W
                </span>
            </div>
        </div>
    );
};

// --- Screen 3: Compliance & Documents ---

const ComplianceScreen = () => {
    const navigate = useNavigate();
    const metrics = useMemo(() => getMetrics(), []);
    return (
        <div className="min-h-screen bg-background-dark pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-center">
                <div className="w-full max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-orange flex items-center justify-center text-white font-bold shadow-lg shadow-orange-900/50">O</div>
                            <div>
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">Orka Mexico</h1>
                                <p className="text-lg font-bold leading-none text-white">Compliance Portal</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                                <span className="material-symbols-outlined text-xl text-white">notifications</span>
                            </button>
                            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                                <span className="material-symbols-outlined text-xl text-white">settings</span>
                            </button>
                        </div>
                    </div>
                    {/* Sub Navigation */}
                    <div className="mt-4 flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800">
                        <button className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-card-dark shadow-sm text-accent-orange border border-gray-700">Overview</button>
                        <button className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300">Audits</button>
                        <button className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300">Permits</button>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-6 space-y-6 w-full max-w-5xl mx-auto">
                {/* Gemini AI Feature Highlight */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative p-6 flex flex-col items-start gap-4 z-10">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/10 border border-accent-orange/30 backdrop-blur-sm">
                            <span className="material-symbols-outlined text-accent-orange text-sm">auto_awesome</span>
                            <span className="text-[10px] font-bold text-accent-orange uppercase tracking-wider">Gemini AI Scanner</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Process Terminal Tickets</h2>
                            <p className="text-gray-400 text-sm max-w-[90%] leading-relaxed">Instantly digitize BOLs and SDS using advanced OCR to detect volume inconsistencies.</p>
                        </div>
                        <button className="w-full py-3.5 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-lg active:scale-95 transform">
                            <span className="material-symbols-outlined">document_scanner</span>
                            Scan Document
                        </button>
                    </div>
                    {/* Decorative Blob */}
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent-orange/10 rounded-full blur-3xl"></div>
                </section>

                {/* Status Cards - Fixed layout */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-card-dark p-4 rounded-2xl shadow-sm border border-gray-800 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-gray-700 transition">
                        <div className="flex justify-between items-start z-10">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pending Audits</span>
                            <span className="material-symbols-outlined text-gray-500 text-sm">arrow_outward</span>
                        </div>
                        <div className="z-10">
                            <span className="text-4xl font-bold text-white">3</span>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-xs text-red-400 font-medium">Action Required</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-24 h-16 flex items-end gap-1 px-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-2 h-6 bg-accent-orange rounded-t-sm"></div>
                            <div className="w-2 h-10 bg-accent-orange rounded-t-sm"></div>
                            <div className="w-2 h-8 bg-accent-orange rounded-t-sm"></div>
                            <div className="w-2 h-12 bg-accent-orange rounded-t-sm"></div>
                        </div>
                    </div>

                    <div className="bg-card-dark p-4 rounded-2xl shadow-sm border border-gray-800 flex flex-col justify-between h-36 relative overflow-hidden hover:border-gray-700 transition">
                        <div className="flex justify-between items-start z-10">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Compliance Score</span>
                            <span className="material-symbols-outlined text-gray-500 text-sm">info</span>
                        </div>
                        <div className="z-10 flex items-end justify-between w-full">
                            <div>
                                <span className="text-4xl font-bold text-white">94%</span>
                                <p className="text-xs text-green-500 font-medium mt-1">CRE Validated</p>
                            </div>
                            <div className="relative w-12 h-12 mb-1">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle className="text-gray-800" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                                    <circle className="text-accent-orange" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125" strokeDashoffset="8" strokeWidth="4"></circle>
                                </svg>
                            </div>
                        </div>
                    </div>
                </section>

                {/* NEW FEATURE: Volume Reconciliation */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent-orange">compare_arrows</span> Financial Control
                    </h3>
                    <ReconciliationCard />
                </section>

                {/* Order List */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">Active Orders</h3>
                        <button onClick={() => navigate('/sales')} className="text-accent-orange text-xs font-bold uppercase tracking-wider hover:text-orange-400 transition-colors">View All</button>
                    </div>
                    <div className="space-y-3">
                        {metrics.activeOrders.slice(0, 4).map((sale) => (
                            <div key={sale.id} className="bg-card-dark p-4 rounded-2xl border border-gray-800 shadow-sm hover:border-gray-700 transition group cursor-pointer" onClick={() => navigate('/sales')}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:bg-gray-700 transition-colors">
                                            <span className="material-symbols-outlined text-gray-400">{sale.product.includes('Oil') ? 'water_drop' : 'local_shipping'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                                                Order #{sale.bol || sale.id.substring(0, 8)}
                                                <span className="text-[10px] font-normal text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700">{sale.customer}</span>
                                            </h4>
                                            <p className="text-xs text-gray-400">{sale.terminal} • {sale.product}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider
                                        ${sale.status === 'BOL UPDATED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            sale.status === 'POD PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                sale.status === 'LOADING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {sale.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Volume</p>
                                        <p className="text-sm font-medium text-gray-200">{sale.gallons.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">gal</span></p>
                                    </div>
                                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Action</p>
                                        {sale.status === 'POD PENDING' ?
                                            <button className="text-xs text-accent-orange font-bold flex items-center gap-1">Upload <span className="material-symbols-outlined text-sm">upload</span></button> :
                                            <button className="text-xs text-blue-400 font-bold flex items-center gap-1">View <span className="material-symbols-outlined text-sm">visibility</span></button>
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                        {metrics.activeOrders.length === 0 && (
                            <div className="bg-card-dark p-6 rounded-2xl border border-gray-800 text-center text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_cart_off</span>
                                <p className="text-sm">No active orders at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Permits Scroll */}
                <section className="pb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Regulatory Permits</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
                        <div className="min-w-[220px] bg-card-dark p-4 rounded-2xl border border-gray-800 relative">
                            <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">CRE-2024-X</h4>
                            <p className="text-xs text-gray-400 mt-1">Expires: Dec 2024</p>
                            <div className="mt-3 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-3/4"></div>
                            </div>
                        </div>

                        <div className="min-w-[220px] bg-card-dark p-4 rounded-2xl border border-gray-800 relative">
                            <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3 border border-orange-500/20">
                                <span className="material-symbols-outlined">warning_amber</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">SENER-IMP-09</h4>
                            <p className="text-xs text-gray-400 mt-1">Review Needed</p>
                            <div className="mt-3 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full w-1/4"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

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

// --- Invoice Content Component (Shared for Preview and PDF) ---
const InvoiceContent = ({ data, id }: { data: any, id?: string }) => (
    <div id={id} className="p-8 md:p-12 font-serif bg-white min-h-screen text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
            <div className="w-1/3">
                <div className="w-32 h-12 bg-gray-200 flex items-center justify-center text-gray-400 font-bold border border-gray-300 mb-2">LOGO</div>
                <h2 className="font-bold text-xl text-gray-900">ORKA ENERGY S.A. DE C.V.</h2>
                <p className="text-xs text-gray-600">RFC: OEN123456789</p>
                <p className="text-xs text-gray-600">Régimen Fiscal: 601 - General de Ley Personas Morales</p>
                <p className="text-xs text-gray-600">Lugar de Expedición: 66260</p>
            </div>
            <div className="w-1/3 text-right">
                <div className="border border-gray-300 rounded p-2 bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">FACTURA</h3>
                    <p className="text-sm text-red-600 font-bold">A - 12345</p>
                    <div className="mt-2 text-xs text-left space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">Folio Fiscal:</span> <span className="font-mono">75A2F...E12D</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Fecha:</span> <span>{new Date().toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tipo:</span> <span>I - Ingreso</span></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Client Info */}
        <div className="bg-gray-50 rounded border border-gray-200 p-4 mb-6 text-sm">
            <h4 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2 uppercase text-xs tracking-wider">Receptor</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-gray-500 text-xs">Razón Social</p>
                    <p className="font-bold">{data.customer}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">RFC</p>
                    <p className="font-bold">{data.rfc}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">Uso CFDI</p>
                    <p>{data.usoCfdi}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">Régimen Fiscal</p>
                    <p>{data.regimen}</p>
                </div>
            </div>
        </div>

        {/* Conceptos */}
        <table className="w-full text-sm mb-8">
            <thead>
                <tr className="bg-gray-800 text-white">
                    <th className="p-2 text-left w-20">Cant</th>
                    <th className="p-2 text-left w-20">Unidad</th>
                    <th className="p-2 text-left">Clave Prod/Serv - Descripción</th>
                    <th className="p-2 text-right w-32">Precio U.</th>
                    <th className="p-2 text-right w-32">Importe</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-gray-200">
                    <td className="p-2 align-top">{data.gallons.toLocaleString()}</td>
                    <td className="p-2 align-top text-gray-600">LTR - Litro</td>
                    <td className="p-2 align-top">
                        <span className="font-bold block text-gray-900">{data.product}</span>
                        <span className="text-xs text-gray-500">15101505 - Combustible diesel</span>
                    </td>
                    <td className="p-2 align-top text-right">${data.rate}</td>
                    <td className="p-2 align-top text-right font-bold">${data.totalSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        {/* Totals & QR */}
        <div className="flex border-t-2 border-gray-800 pt-6">
            <div className="w-2/3 pr-8">
                <div className="flex gap-4 mb-4">
                    <div className="w-24 h-24 bg-gray-900 flex items-center justify-center text-white text-xs text-center p-2">
                        QR Code Placeholder
                    </div>
                    <div className="flex-1 text-[10px] text-gray-500 break-all space-y-2">
                        <p><strong className="text-gray-700">Sello Digital del CFDI:</strong><br />abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890...</p>
                        <p><strong className="text-gray-700">Sello del SAT:</strong><br />1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef...</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="text-gray-500 block">Forma de Pago</span>
                        <span className="font-bold">99 - Por definir</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Método de Pago</span>
                        <span className="font-bold">{data.metodoPago}</span>
                    </div>
                </div>
            </div>
            <div className="w-1/3 bg-gray-50 p-4 rounded text-right space-y-2">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${data.totalSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>IVA (16%)</span>
                    <span>${(data.totalSale * 0.16).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-300 pt-2 mt-2">
                    <span>Total</span>
                    <span>${(data.totalSale * 1.16).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    (Importe con letra simulado)
                </div>
            </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            Este documento es una representación impresa de un CFDI (Simulación)
        </div>
    </div>
);

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

// --- CFDI 4.0 Helpers ---
const generateCFDI40XML = (data: any) => {
    const now = new Date().toISOString().split('.')[0];
    const subtotal = data.totalSale;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const folio = "12345";
    const serie = "A";
    const uuid = "75A2F2B4-C1E9-4D6C-A7E2-9B9D0E12D5C4"; // Simulated UUID

    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="${serie}" Folio="${folio}" Fecha="${now}" Sello="abcdef123..." FormaPago="99" NoCertificado="00001000000504465930" Certificado="MIIG..." SubTotal="${subtotal.toFixed(2)}" Moneda="MXN" Total="${total.toFixed(2)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${data.metodoPago}" LugarExpedicion="66260">
    <cfdi:Emisor Rfc="OEN123456789" Nombre="ORKA ENERGY S.A. DE C.V." RegimenFiscal="601"/>
    <cfdi:Receptor Rfc="${data.rfc}" Nombre="${data.customer}" DomicilioFiscalReceptor="66260" RegimenFiscalReceptor="601" UsoCFDI="${data.usoCfdi.split(' - ')[0]}"/>
    <cfdi:Conceptos>
        <cfdi:Concepto ClaveProdServ="15101505" NoIdentificacion="FUEL-001" Cantidad="${data.gallons}" ClaveUnidad="LTR" Unidad="Litro" Descripcion="${data.product}" ValorUnitario="${data.rate.toFixed(4)}" Importe="${subtotal.toFixed(2)}" ObjetoImp="02">
            <cfdi:Impuestos>
                <cfdi:Traslados>
                    <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}"/>
                </cfdi:Traslados>
            </cfdi:Impuestos>
        </cfdi:Concepto>
    </cfdi:Conceptos>
    <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
        <cfdi:Traslados>
            <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}"/>
        </cfdi:Traslados>
    </cfdi:Impuestos>
    <cfdi:Complemento>
        <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${uuid}" FechaTimbrado="${now}" RfcProvCertif="SAT970701NN3" SelloCFD="abcdef..." NoCertificadoSAT="00001000000504465028" SelloSAT="xyz123..."/>
    </cfdi:Complemento>
</cfdi:Comprobante>`;
};

const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// --- Invoicing Form Component ---
const CFDIForm = ({ initialData, onCancel }: { initialData?: Sale | null, onCancel: () => void }) => {
    // Form State
    const [formData, setFormData] = useState({
        customer: initialData?.customer ? `${initialData.customer} S.A. de C.V.` : '',
        rfc: 'XAXX010101000',
        usoCfdi: 'G03 - Gastos en general',
        regimen: '601 - General de Ley Personas Morales',
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
                                    <option>G03 - Gastos en general</option>
                                    <option>P01 - Por definir</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Régimen Fiscal</label>
                                <select
                                    value={formData.regimen}
                                    onChange={(e) => handleChange('regimen', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                >
                                    <option>601 - General de Ley Personas Morales</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Método de Pago</label>
                                <select
                                    value={formData.metodoPago}
                                    onChange={(e) => handleChange('metodoPago', e.target.value)}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none transition"
                                >
                                    <option value="PUE">PUE - Pago en una sola exhibición</option>
                                    <option value="PPD">PPD - Pago en parcialidades o diferido</option>
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
}

// --- Screen 4: Finance (Balances & Invoicing 4.0) ---

const FinanceScreen = ({
    sales,
    onUpdateSales
}: {
    sales: Sale[],
    onUpdateSales: (updatedSales: Sale[]) => void
}) => {
    const [activeTab, setActiveTab] = useState<'balances' | 'invoicing'>('balances');
    const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL');

    // Payment Registration State
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Invoicing State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showCFDIForm, setShowCFDIForm] = useState(false);
    const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);
    const [showBalanceReport, setShowBalanceReport] = useState(false);
    const [selectedClientForDetail, setSelectedClientForDetail] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [overdueReportMode, setOverdueReportMode] = useState(false);
    const [reportDate, setReportDate] = useState<string | undefined>(undefined);

    const handleViewDetail = (clientName: string) => {
        const detailData = getClientCollectionDetail(clientName);
        setSelectedClientForDetail(detailData);
        setShowDetailModal(true);
    };

    const handleGenerateOverdueReport = (clientName: string, date: string) => {
        // This will reuse the BalanceReportModal but in overdue-only mode with a specific date
        setSelectedClientFilter(clientName);
        setReportDate(date);
        setOverdueReportMode(true);
        setShowBalanceReport(true);
    };

    const handleSelectSale = (sale: Sale) => {
        setSelectedSaleForInvoice(sale);
        setShowInvoiceModal(false);
        setShowCFDIForm(true);
    };

    const handleManualInvoice = () => {
        setSelectedSaleForInvoice(null);
        setShowInvoiceModal(false);
        setShowCFDIForm(true);
    };

    const handleRegisterPayment = (paymentData: {
        customer: string;
        amount: number;
        date: string;
        selectedSaleIds: string[];
    }) => {
        const updatedSales = sales.map(sale => {
            if (paymentData.selectedSaleIds.includes(sale.id)) {
                // Simplified allocation: for simulation, we mark as PAID if selected, 
                // but we could do more complex math with paymentData.amount
                const currentPaid = sale.paidAmount || 0;
                const total = sale.totalSale;
                const newPaid = total; // Simple logic for demonstration

                return {
                    ...sale,
                    paidAmount: newPaid,
                    paymentStatus: 'PAID' as const,
                    paymentDate: paymentData.date
                };
            }
            return sale;
        });

        onUpdateSales(updatedSales);
        alert(`Pago registrado para ${paymentData.customer}. Unidades actualizadas.`);
    };

    // Helper functions for data analysis wrapped to use the current 'sales' state
    const currentGetClientBalances = (filter: string) => {
        const dates = sales.map(s => s.date).sort();
        const latestDate = dates[dates.length - 1];
        const clients = Array.from(new Set(sales.map(s => s.customer)));
        const results = clients.map(client => {
            const clientSales = sales.filter(s => s.customer === client);
            const currentTotal = clientSales.reduce((acc, s) => acc + s.totalSale, 0);
            const currentPaid = clientSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
            const currentPending = currentTotal - currentPaid;
            const prevSales = clientSales.filter(s => s.date < latestDate);
            const prevTotal = prevSales.reduce((acc, s) => acc + s.totalSale, 0);
            const prevPaid = prevSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
            const prevBalance = prevTotal - prevPaid;
            return {
                client,
                currentPending,
                prevBalance,
                limit: client === 'Trans. del Norte' ? 2000000 : (client === 'ALPHA' ? 1500000 : 500000),
                status: client === 'Gasolineras Lopez' ? 'Blocked' : 'Active'
            };
        });
        return filter !== 'ALL' ? results.filter(r => r.client === filter) : results;
    };

    const currentGetClientCollectionDetail = (clientName: string) => {
        const dates = sales.map(s => s.date).sort();
        const referenceDateStr = dates[dates.length - 1];
        const clientSales = sales.filter(s => s.customer === clientName);
        const details = clientSales.map(sale => {
            const loadDate = new Date(sale.date);
            const dueDate = new Date(loadDate);
            dueDate.setDate(dueDate.getDate() + 7);
            let status: 'paid' | 'on-time' | 'due-today' | 'overdue' = 'on-time';
            if (sale.paymentStatus === 'PAID') status = 'paid';
            else if (dueDate < new Date()) status = 'overdue';
            return { ...sale, dueDate: dueDate.toISOString().split('T')[0], collectionStatus: status };
        });
        return {
            client: clientName,
            currentBalance: details.filter(d => d.paymentStatus !== 'PAID').reduce((acc, d) => acc + d.totalSale, 0),
            loads: details.sort((a, b) => b.date.localeCompare(a.date))
        };
    };

    // Calculate Metrics based on Filter
    const clientBalances = useMemo(() => currentGetClientBalances(selectedClientFilter), [selectedClientFilter, sales]);

    const filteredSales = selectedClientFilter === 'ALL'
        ? sales
        : sales.filter(s => s.customer === selectedClientFilter);

    // 1. Nominated (Total Sales)
    const totalNominatedAmount = filteredSales.reduce((acc, curr) => acc + curr.totalSale, 0);
    const totalNominatedCount = filteredSales.length;

    // 2. Paid
    const totalPaidAmount = filteredSales.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalPaidCount = filteredSales.filter(s => s.paymentStatus === 'PAID').length;
    const partialPaidCount = filteredSales.filter(s => s.paymentStatus === 'PARTIAL').length;

    // 3. Pending
    const pendingAmount = totalNominatedAmount - totalPaidAmount;

    // 4. Previous Day Balance (Total)
    const totalPrevBalance = clientBalances.reduce((acc, curr) => acc + curr.prevBalance, 0);

    // Percentages for Progress bars
    const paidPercentage = totalNominatedAmount > 0 ? (totalPaidAmount / totalNominatedAmount) * 100 : 0;

    // Unique Clients
    const uniqueClients = Array.from(new Set(sales.map(s => s.customer))).sort();

    const pendingSales = useMemo(() => sales.filter(s => s.paymentStatus !== 'PAID'), [sales]);

    return (
        <div className="min-h-screen bg-background-dark pb-32">
            <ClientDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                data={selectedClientForDetail}
                onGenerateOverdueReport={handleGenerateOverdueReport}
            />

            <InvoiceGenerationModal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                onSelectSale={handleSelectSale}
                onManual={handleManualInvoice}
            />

            <PaymentRegistrationModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                pendingSales={pendingSales}
                onRegisterPayment={handleRegisterPayment}
            />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-center">
                <div className="w-full max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold shadow-lg shadow-green-900/50">
                                <span className="material-symbols-outlined text-lg">attach_money</span>
                            </div>
                            <div>
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">Orka Mexico</h1>
                                <p className="text-lg font-bold leading-none text-white">Finance Hub</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {activeTab === 'balances' && (
                                <select
                                    value={selectedClientFilter}
                                    onChange={(e) => setSelectedClientFilter(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-green-500 transition-colors"
                                >
                                    <option value="ALL">Todos los Clientes</option>
                                    {uniqueClients.map(client => (
                                        <option key={client} value={client}>{client}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={() => {
                                    setOverdueReportMode(false);
                                    setShowBalanceReport(true);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg px-4 py-2 border border-white/5 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm text-accent-orange">download</span>
                                Reporte de Balance
                            </button>
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg px-4 py-2 border border-green-500/20 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm">payments</span>
                                Registrar Pago
                            </button>
                        </div>
                    </div>
                    {/* Sub Navigation Tabs */}
                    <div className="mt-4 flex gap-1 p-1 bg-gray-900 rounded-xl border border-gray-800">
                        <button
                            onClick={() => { setActiveTab('balances'); setShowCFDIForm(false); }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'balances' ? 'bg-card-dark shadow-sm text-green-400 border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Balances (CXC/CXP)
                        </button>
                        <button
                            onClick={() => setActiveTab('invoicing')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'invoicing' ? 'bg-card-dark shadow-sm text-green-400 border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Facturación 4.0
                        </button>
                    </div>
                </div>
            </header>

            <BalanceReportModal
                isOpen={showBalanceReport}
                onClose={() => {
                    setShowBalanceReport(false);
                    setOverdueReportMode(false);
                    setReportDate(undefined);
                }}
                reports={getDetailedBalanceReport(selectedClientFilter, reportDate, overdueReportMode)}
            />

            <main className="px-6 py-6 w-full max-w-5xl mx-auto">
                {activeTab === 'balances' ? (
                    <>
                        {/* Summary Cards */}
                        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {/* Nominated */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-blue-500">inventory_2</span>
                                </div>
                                <div className="text-xs text-blue-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Nominado
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${totalNominatedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-4 flex justify-between items-end border-t border-gray-800 pt-3">
                                    <div className="text-xs text-gray-400">Volumen</div>
                                    <div className="text-sm font-bold text-white">{totalNominatedCount} <span className="text-xs font-normal text-gray-500">Cargas</span></div>
                                </div>
                            </div>

                            {/* Paid */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-green-500">payments</span>
                                </div>
                                <div className="text-xs text-green-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Pagado
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${totalPaidAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${paidPercentage}%` }}></div>
                                </div>
                                <div className="mt-2 flex justify-between items-end">
                                    <div className="text-[10px] text-gray-400">{paidPercentage.toFixed(1)}%</div>
                                    <div className="text-xs font-bold text-white">
                                        {totalPaidCount} <span className="text-[10px] text-gray-500 font-normal uppercase">P</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-red-500">pending_actions</span>
                                </div>
                                <div className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Pendiente
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${pendingAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-4 flex justify-between items-end border-t border-gray-800 pt-3">
                                    <div className="text-[10px] text-red-400 font-bold uppercase">Gestión de Cobro</div>
                                </div>
                            </div>

                            {/* Previous Day Balance */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-accent-orange/30 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-accent-orange">history</span>
                                </div>
                                <div className="text-xs text-accent-orange font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent-orange shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span> Saldo Anterior
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${totalPrevBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-4 flex justify-between items-end border-t border-gray-800 pt-3">
                                    <div className="text-xs text-gray-400">Cierre al Día Anterior</div>
                                </div>
                            </div>
                        </section>

                        {/* Customer List with Credit Limits */}
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center justify-between">
                                <span>Client Portfolios</span>
                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Sorted by Risk</span>
                            </h3>

                            <div className="space-y-4">
                                {clientBalances.map((data) => (
                                    <div key={data.client} className={`bg-card-dark p-4 rounded-2xl border ${data.status === 'Blocked' ? 'border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]' : 'border-gray-800'} shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-gray-700`}>
                                        {data.status === 'Blocked' && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>}
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${data.status === 'Blocked' ? 'bg-red-900/30 text-red-400 border-red-500/20' : 'bg-blue-900/30 text-blue-400 border-blue-500/20'}`}>
                                                    {data.client.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-white group-hover:text-primary transition-colors">{data.client}</h4>
                                                    <p className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-tight ${data.status === 'Blocked' ? 'text-red-500' : 'text-green-500'}`}>
                                                        {data.status === 'Blocked' ? <span className="material-symbols-outlined text-[10px]">block</span> : <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                                        {data.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-xl px-3 py-2 flex flex-col items-center min-w-[100px]">
                                                    <span className="text-[9px] text-accent-orange font-bold uppercase tracking-wider">Saldo Anterior</span>
                                                    <span className="text-sm font-bold text-white">${data.prevBalance.toLocaleString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleViewDetail(data.client)}
                                                    className={`text-[10px] h-fit self-center px-4 py-2 rounded-xl font-bold transition-all active:scale-95 ${data.status === 'Blocked' ? 'bg-red-500 text-white shadow-lg shadow-red-900/20 hover:bg-red-600' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'}`}
                                                >
                                                    {data.status === 'Blocked' ? 'COLLECT' : 'DETAILS'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                                    <span>Credit Usage</span>
                                                    <span className="text-white font-mono">${data.currentPending.toLocaleString()} / <span className="opacity-50">${data.limit.toLocaleString()}</span></span>
                                                </div>
                                                <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
                                                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${data.status === 'Blocked' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((data.currentPending / data.limit) * 100, 100)}%` }}></div>
                                                </div>
                                            </div>

                                            {data.status === 'Blocked' ? (
                                                <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-red-400 text-sm animate-pulse">warning</span>
                                                        <span className="text-[10px] text-red-400 font-bold uppercase">Aging Risk 90d+</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-red-500">EXCEEDED</span>
                                                </div>
                                            ) : (
                                                <div className="bg-green-500/5 rounded-xl border border-green-500/10 p-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-green-400 text-sm">verified</span>
                                                        <span className="text-[10px] text-green-400 font-bold uppercase">Status</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-green-500">COMPLIANT</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {showCFDIForm ? (
                            <CFDIForm initialData={selectedSaleForInvoice} onCancel={() => setShowCFDIForm(false)} />
                        ) : (
                            <>
                                {/* Invoicing Header Actions */}
                                <div className="flex gap-3 mb-2">
                                    <button
                                        onClick={() => setShowInvoiceModal(true)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span> New CFDI
                                    </button>
                                    <button className="flex-none w-12 bg-card-dark border border-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white">
                                        <span className="material-symbols-outlined">filter_list</span>
                                    </button>
                                </div>

                                {/* Recent Invoices List */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Recent Invoices (SAT)</h3>

                                    {/* Invoice Item 1 */}
                                    <div className="bg-card-dark p-4 rounded-2xl border border-gray-800 shadow-sm relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Folio Fiscal (UUID)</span>
                                                <span className="text-xs font-mono text-gray-300">...A492-4932-B831</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20 uppercase tracking-wide">
                                                Timbrado
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <h4 className="font-bold text-white text-lg">$145,230.00</h4>
                                                <p className="text-xs text-gray-400">Transportes del Norte S.A. de C.V.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-black/30 p-2 rounded border border-white/5">
                                                <div className="text-[9px] text-gray-500">Uso CFDI</div>
                                                <div className="text-xs text-gray-300">G03 - Gastos en general</div>
                                            </div>
                                            <div className="bg-black/30 p-2 rounded border border-white/5">
                                                <div className="text-[9px] text-gray-500">Método Pago</div>
                                                <div className="text-xs text-gray-300">PPD - Parcialidades</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 flex items-center justify-center gap-1 transition">
                                                <span className="material-symbols-outlined text-sm">description</span> XML
                                            </button>
                                            <button className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 flex items-center justify-center gap-1 transition">
                                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
                                            </button>
                                        </div>
                                    </div>

                                    {/* Invoice Item 2 */}
                                    <div className="bg-card-dark p-4 rounded-2xl border border-gray-800 shadow-sm relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Folio Interno</span>
                                                <span className="text-xs font-mono text-gray-300">F-2024-092</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20 uppercase tracking-wide">
                                                Pendiente
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <h4 className="font-bold text-white text-lg">$42,100.00</h4>
                                                <p className="text-xs text-gray-400">Logística Integral S.A.</p>
                                            </div>
                                        </div>
                                        <button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition">
                                            Timbrar en SAT
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};


// --- Main App Component ---

const App = () => {
    const [currentSales, setCurrentSales] = useState<Sale[]>(initialSalesData);
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    if (!userRole) {
        return <LoginScreen onLogin={(role) => setUserRole(role)} />;
    }

    const handleLogout = () => {
        setUserRole(null);
    };

    return (
        <Router>
            <div className="min-h-screen bg-background-dark">
                <Routes>
                    {/* Publicly visible but filtered by role in BottomNav */}
                    {(userRole === 'ADMIN' || userRole === 'CREDITO' || userRole === 'VENTAS') && (
                        <Route path="/" element={<DashboardScreen />} />
                    )}

                    {(userRole === 'ADMIN' || userRole === 'OPERACIONES' || userRole === 'VENTAS') && (
                        <Route path="/monitor" element={<MonitorScreen />} />
                    )}

                    <Route path="/compliance" element={<ComplianceScreen />} />

                    {(userRole === 'ADMIN' || userRole === 'CREDITO') && (
                        <Route path="/finance" element={<FinanceScreen sales={currentSales} onUpdateSales={setCurrentSales} />} />
                    )}

                    {(userRole === 'ADMIN' || userRole === 'CREDITO' || userRole === 'VENTAS') && (
                        <>
                            <Route path="/sales" element={<SalesScreen />} />
                            <Route path="/sales/new" element={<SalesForm />} />
                            <Route path="/partners" element={<PartnersScreen />} />
                        </>
                    )}

                    {/* Catch-all to redirect based on role if navigating to restricted route */}
                    <Route path="*" element={
                        userRole === 'OPERACIONES' ? <MonitorScreen /> : <DashboardScreen />
                    } />
                </Routes>
                <BottomNav role={userRole} onLogout={handleLogout} />
            </div>
        </Router>
    );
};

export default App;