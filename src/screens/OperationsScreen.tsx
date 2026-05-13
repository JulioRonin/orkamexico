import React from 'react';
import { useOperations } from '../hooks/useOperations';
import { useCompany } from '../context/CompanyContext';
import CompanySwitcher from '../components/CompanySwitcher';

const OperationsScreen = () => {
    const { selectedCompanyName } = useCompany();
    const { operationsByStatus, stats, loading, statusOrder } = useOperations();

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm animate-pulse">Cargando operaciones...</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
            INTENTION: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', icon: 'lightbulb' },
            APPROVED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: 'check_circle' },
            LOADING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: 'local_shipping' },
            'ON TRACK': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', icon: 'directions_car' },
            'BOL UPDATED': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: 'description' },
            'POD PENDING': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', icon: 'pending_actions' },
            DONE: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', icon: 'task_alt' },
        };
        return colors[status] || colors.INTENTION;
    };

    return (
        <div className="min-h-screen bg-background-dark pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-center">
                <div className="w-full max-w-7xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-900/50">
                                <span className="material-symbols-outlined text-lg">workflow</span>
                            </div>
                            <div>
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">{selectedCompanyName}</h1>
                                <p className="text-lg font-bold leading-none text-white">Operations Workflow</p>
                            </div>
                        </div>
                        <CompanySwitcher />
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-7 gap-2">
                        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Intention</p>
                            <p className="text-lg font-bold text-gray-300">{stats.intention}</p>
                        </div>
                        <div className="bg-blue-600/10 rounded-lg p-2 border border-blue-500/30 text-center">
                            <p className="text-[10px] text-blue-400 uppercase tracking-wide font-bold">Approved</p>
                            <p className="text-lg font-bold text-blue-300">{stats.approved}</p>
                        </div>
                        <div className="bg-yellow-600/10 rounded-lg p-2 border border-yellow-500/30 text-center">
                            <p className="text-[10px] text-yellow-400 uppercase tracking-wide font-bold">Loading</p>
                            <p className="text-lg font-bold text-yellow-300">{stats.loading}</p>
                        </div>
                        <div className="bg-cyan-600/10 rounded-lg p-2 border border-cyan-500/30 text-center">
                            <p className="text-[10px] text-cyan-400 uppercase tracking-wide font-bold">On Track</p>
                            <p className="text-lg font-bold text-cyan-300">{stats.onTrack}</p>
                        </div>
                        <div className="bg-purple-600/10 rounded-lg p-2 border border-purple-500/30 text-center">
                            <p className="text-[10px] text-purple-400 uppercase tracking-wide font-bold">BOL</p>
                            <p className="text-lg font-bold text-purple-300">{stats.bolUpdated}</p>
                        </div>
                        <div className="bg-orange-600/10 rounded-lg p-2 border border-orange-500/30 text-center">
                            <p className="text-[10px] text-orange-400 uppercase tracking-wide font-bold">POD</p>
                            <p className="text-lg font-bold text-orange-300">{stats.podPending}</p>
                        </div>
                        <div className="bg-green-600/10 rounded-lg p-2 border border-green-500/30 text-center">
                            <p className="text-[10px] text-green-400 uppercase tracking-wide font-bold">Done</p>
                            <p className="text-lg font-bold text-green-300">{stats.done}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 w-full max-w-7xl mx-auto">
                {/* Kanban Board */}
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {statusOrder.map(status => {
                        const operations = operationsByStatus[status];
                        const colorScheme = getStatusColor(status);

                        return (
                            <div key={status} className={`${colorScheme.bg} border ${colorScheme.border} rounded-xl p-4 min-h-[500px]`}>
                                {/* Column Header */}
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
                                    <span className={`material-symbols-outlined text-lg ${colorScheme.text}`}>
                                        {colorScheme.icon}
                                    </span>
                                    <div>
                                        <h3 className={`font-bold text-sm ${colorScheme.text} uppercase tracking-wide`}>
                                            {status}
                                        </h3>
                                        <p className="text-xs text-gray-500">{operations.length} ops</p>
                                    </div>
                                </div>

                                {/* Operation Cards */}
                                <div className="space-y-2">
                                    {operations.length === 0 ? (
                                        <div className="text-xs text-gray-600 italic py-8 text-center">Sin operaciones</div>
                                    ) : (
                                        operations.map(op => (
                                            <div
                                                key={op.id}
                                                className="bg-card-dark border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition cursor-pointer hover:shadow-lg hover:shadow-gray-900/50"
                                            >
                                                {/* Product & Volume */}
                                                <div className="mb-2">
                                                    <p className="text-xs font-bold text-white truncate">{op.product}</p>
                                                    <p className="text-[11px] text-gray-400">{op.gallons.toLocaleString()} GL</p>
                                                </div>

                                                {/* Customer & Truck */}
                                                <div className="mb-2 space-y-1 pb-2 border-b border-gray-700">
                                                    <p className="text-[11px] text-gray-300 truncate">
                                                        <span className="text-gray-500">👤</span> {op.customer}
                                                    </p>
                                                    <p className="text-[11px] text-gray-300 truncate">
                                                        <span className="text-gray-500">🚚</span> {op.truck}
                                                    </p>
                                                </div>

                                                {/* BOL & Rate */}
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase">BOL</p>
                                                        <p className="text-xs font-mono text-gray-300 truncate">{op.bol || '—'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-500 uppercase">Rate</p>
                                                        <p className="text-xs font-mono text-green-400">${op.rate.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <p className="text-[10px] text-gray-500">
                                                    {new Date(op.date).toLocaleDateString('es-MX')}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {stats.total === 0 && (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 block">inbox</span>
                        <p className="text-gray-400 text-sm">Sin operaciones registradas</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OperationsScreen;
