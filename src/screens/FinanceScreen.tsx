import React, { useState, useMemo } from 'react';
import { getClientBalances, getDetailedBalanceReport, getClientCollectionDetail, Sale } from '../../data';
import ClientDetailModal from '../components/modals/ClientDetailModal';
import BalanceReportModal from '../components/modals/BalanceReportModal';
import InvoiceGenerationModal from '../components/helpers';
import InvoicingForm from '../components/InvoicingForm';
import PaymentRegistrationModal from '../../PaymentRegistrationModal';

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
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'balances' ? 'bg-card-dark shadow-sm text-green-400 border border-gray-700' : 'text-gray-500 hover:text-gray-300'} `}
                        >
                            Balances (CXC/CXP)
                        </button>
                        <button
                            onClick={() => setActiveTab('invoicing')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'invoicing' ? 'bg-card-dark shadow-sm text-green-400 border border-gray-700' : 'text-gray-500 hover:text-gray-300'} `}
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
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${data.status === 'Blocked' ? 'bg-red-900/30 text-red-400 border-red-500/20' : 'bg-blue-900/30 text-blue-400 border-blue-500/20'} `}>
                                                    {data.client.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-white group-hover:text-primary transition-colors">{data.client}</h4>
                                                    <p className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-tight ${data.status === 'Blocked' ? 'text-red-500' : 'text-green-500'} `}>
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
                                                    className={`text-[10px] h-fit self-center px-4 py-2 rounded-xl font-bold transition-all active:scale-95 ${data.status === 'Blocked' ? 'bg-red-500 text-white shadow-lg shadow-red-900/20 hover:bg-red-600' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'} `}
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
                                                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${data.status === 'Blocked' ? 'bg-red-500' : 'bg-blue-500'} `} style={{ width: `${Math.min((data.currentPending / data.limit) * 100, 100)}%` }}></div>
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
                            <InvoicingForm initialData={selectedSaleForInvoice} onCancel={() => setShowCFDIForm(false)} />
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
                                                <div className="text-xs text-gray-300">G03-Gastos en general</div>
                                            </div>
                                            <div className="bg-black/30 p-2 rounded border border-white/5">
                                                <div className="text-[9px] text-gray-500">Método Pago</div>
                                                <div className="text-xs text-gray-300">PPD-Parcialidades</div>
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

export default FinanceScreen;
