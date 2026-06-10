import React from 'react';

const ReconciliationCard = () => {
    // Mock data simulation
    const bolVolume = 32000;
    const meterVolume = 31820;
    const variance = bolVolume - meterVolume;
    const variancePercent = (variance / bolVolume) * 100;
    const tolerance = 0.5; // 0.5% tolerance
    const isRisk = variancePercent > tolerance;

    return (
        <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden transition-all ${isRisk ? 'bg-red-900/10 border-red-500/30' : 'bg-card-dark border-gray-800'} `}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRisk ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'} `}>
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
                    <div className={`text-lg font-bold ${isRisk ? 'text-red-400' : 'text-green-400'} `}>
                        {variance > 0 ? '-' : '+'}{Math.abs(variance)} L <span className="text-xs font-normal opacity-70">({variancePercent.toFixed(2)}%)</span>
                    </div>
                </div>
                <div className="h-10 w-32 relative">
                    {/* Simple Bar Chart Visualization */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 rounded-full transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 h-3 w-0.5 bg-gray-500 transform -translate-y-1/2 -translate-x-1/2"></div> {/* Center mark */}
                    {/* Actual value bar */}
                    <div
                        className={`absolute top-1/2 left-1/2 h-1.5 rounded-full -translate-y-1/2 origin-left ${isRisk ? 'bg-red-500' : 'bg-green-500'} `}
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

export default ReconciliationCard;
