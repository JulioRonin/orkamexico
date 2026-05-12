import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesData as initialSalesData, Sale } from '../../data';

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
            {/* Background Map Simulation-Fixed at bottom z-0 */}
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

                {/* Truck Marker-Centered better */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <div className={`w-16 h-16 ${selectedUnit ? 'bg-blue-500/20' : 'bg-accent-red/20'} rounded-full flex items-center justify-center ${selectedUnit ? 'animate-pulse' : 'animate-pulse-red'} `}>
                        <div className={`w-5 h-5 ${selectedUnit ? 'bg-blue-500' : 'bg-accent-red'} rounded-full border-2 border-white dark:border-background-dark shadow-lg`}></div>
                    </div>
                    <div className="bg-card-dark text-[10px] px-3 py-1.5 rounded-lg shadow-xl mt-2 font-mono border border-slate-700 text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedUnit ? 'bg-blue-500' : 'bg-accent-red'} `}></span> {selectedUnit ? `Unit ${selectedUnit.truck} ` : 'TRUCK-802'}
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

            {/* Main Content Overlay-Constrained width */}
            <main className="relative z-10 flex-1 flex flex-col justify-between px-4 pb-28 w-full max-w-6xl mx-auto pointer-events-none">
                {/* Search Bar-Floating below header */}
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
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${unit.status === 'DONE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'} `}>
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
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${selectedUnit.status === 'DONE' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'} `}>
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

export default MonitorScreen;
