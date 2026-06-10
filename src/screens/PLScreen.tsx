import React, { useState } from 'react';
import { usePLData } from '../hooks/usePLData';
import { useCompany } from '../context/CompanyContext';
import CompanySwitcher from '../components/CompanySwitcher';

const PLScreen = () => {
    const { selectedCompanyName } = useCompany();
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'ytd'>('monthly');
    const { metrics, productBreakdown, customerBreakdown, trend, loading } = usePLData(timeframe);

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm animate-pulse">Cargando P&L...</p>
                </div>
            </div>
        );
    }

    const sortedProducts = [...productBreakdown].sort((a, b) => b.revenue - a.revenue);
    const topCustomers = [...customerBreakdown].slice(0, 8);

    return (
        <div className="min-h-screen bg-background-dark pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-center">
                <div className="w-full max-w-6xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/50">
                                <span className="material-symbols-outlined text-lg">trending_up</span>
                            </div>
                            <div>
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">{selectedCompanyName}</h1>
                                <p className="text-lg font-bold leading-none text-white">P&L Statement</p>
                            </div>
                        </div>
                        <CompanySwitcher />
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex gap-2 p-1 bg-gray-900 rounded-lg border border-gray-800 w-fit">
                        {(['daily', 'weekly', 'monthly', 'ytd'] as const).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                                    timeframe === tf
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                {tf.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 w-full max-w-6xl mx-auto">
                {/* KPI Cards */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Revenue */}
                    <div className="bg-card-dark p-6 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-green-500">trending_up</span>
                        </div>
                        <div className="text-xs text-green-400 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Revenue
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${metrics.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-3 flex justify-between items-end border-t border-gray-700 pt-3">
                            <span className="text-xs text-gray-400">{metrics.count} transacciones</span>
                            <span className="text-sm font-mono text-green-400">${(metrics.revenue / Math.max(1, metrics.count)).toLocaleString('en-US', { maximumFractionDigits: 0 })}/tx</span>
                        </div>
                    </div>

                    {/* COGS */}
                    <div className="bg-card-dark p-6 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-red-500">local_shipping</span>
                        </div>
                        <div className="text-xs text-red-400 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> COGS
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${metrics.cogs.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-3 flex justify-between items-end border-t border-gray-700 pt-3">
                            <span className="text-xs text-gray-400">{metrics.volumeGallons.toLocaleString()} GL</span>
                            <span className="text-sm font-mono text-red-400">${(metrics.cogs / Math.max(1, metrics.volumeGallons)).toLocaleString('en-US', { maximumFractionDigits: 2 })}/GL</span>
                        </div>
                    </div>

                    {/* Gross Profit */}
                    <div className="bg-card-dark p-6 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-blue-500">savings</span>
                        </div>
                        <div className="text-xs text-blue-400 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Gross Profit
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${metrics.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-3 flex justify-between items-end border-t border-gray-700 pt-3">
                            <span className="text-xs text-gray-400">Ganancia bruta</span>
                            <span className="text-sm font-mono text-blue-400">{metrics.grossMargin.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Gross Margin */}
                    <div className="bg-gradient-to-br from-card-dark to-[#1a1a1a] p-6 rounded-2xl border border-blue-500/20 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-blue-400">percent</span>
                        </div>
                        <div className="text-xs text-blue-400 font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Gross Margin
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white">{metrics.grossMargin.toFixed(1)}</span>
                            <span className="text-lg text-gray-400">%</span>
                        </div>
                        <div className="mt-3 w-full bg-gray-800 h-2 rounded-full overflow-hidden border border-gray-700">
                            <div
                                className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, metrics.grossMargin)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 text-right">Margen de ganancia</div>
                    </div>
                </section>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 bg-card-dark p-6 rounded-2xl border border-gray-800 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-400">show_chart</span>
                            Revenue vs COGS Trend
                        </h3>
                        <div className="h-64 flex items-end justify-between gap-1 px-2">
                            {trend.length === 0 ? (
                                <div className="w-full flex items-center justify-center text-gray-500">Sin datos disponibles</div>
                            ) : (
                                trend.map((point, idx) => {
                                    const maxValue = Math.max(...trend.map(t => Math.max(t.revenue, t.cogs)));
                                    const revPct = (point.revenue / maxValue) * 100;
                                    const cogsPct = (point.cogs / maxValue) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                                            <div className="flex gap-0.5 h-48 items-end w-full justify-center">
                                                <div className="w-1.5 bg-green-500/60 rounded-t" style={{ height: `${revPct}%` }}></div>
                                                <div className="w-1.5 bg-red-500/60 rounded-t" style={{ height: `${cogsPct}%` }}></div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition opacity-0 group-hover:opacity-100">
                                                {point.date.split('-').slice(1).join('/')}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="mt-4 flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-gray-400">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span className="text-gray-400">COGS</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-card-dark p-6 rounded-2xl border border-gray-800 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-orange">people</span>
                            Top Customers
                        </h3>
                        <div className="space-y-3">
                            {topCustomers.length === 0 ? (
                                <div className="text-xs text-gray-500">Sin datos</div>
                            ) : (
                                topCustomers.map((customer, idx) => (
                                    <div key={idx} className="space-y-1 pb-3 border-b border-gray-700 last:border-0">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-white truncate">{customer.name}</span>
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{customer.margin.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500">
                                            <span>${customer.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                            <span>{customer.volume.toLocaleString()} GL</span>
                                        </div>
                                        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (customer.margin / 100) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Breakdown */}
                <div className="mt-8 bg-card-dark p-6 rounded-2xl border border-gray-800 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400">local_gas_station</span>
                        Product Performance
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">Producto</th>
                                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">Revenue</th>
                                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">COGS</th>
                                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">Profit</th>
                                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">Margin</th>
                                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">Sin datos disponibles</td>
                                    </tr>
                                ) : (
                                    sortedProducts.map((product, idx) => (
                                        <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition">
                                            <td className="py-3 font-medium text-white">{product.name}</td>
                                            <td className="text-right py-3 text-green-400 font-mono text-sm">${product.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                                            <td className="text-right py-3 text-red-400 font-mono text-sm">${product.cogs.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                                            <td className="text-right py-3 text-blue-400 font-mono text-sm">${product.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                                            <td className="text-right py-3">
                                                <span className={`font-semibold ${product.margin >= 20 ? 'text-green-400' : product.margin >= 10 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                                    {product.margin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="text-right py-3 text-gray-400 text-sm">{product.volume.toLocaleString()} GL</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PLScreen;
