import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMetrics } from '../../data';
import ReconciliationCard from '../components/ReconciliationCard';

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

                {/* Status Cards-Fixed layout */}
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
                                        } `}>
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

export default ComplianceScreen;
