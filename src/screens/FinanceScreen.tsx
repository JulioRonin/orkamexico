import React, { useState, useMemo } from 'react';
import { getDetailedBalanceReport } from '../../data';
import { useSales } from '../hooks/useSales';
import { useClientBalances } from '../hooks/useClientBalances';
import { useCompany } from '../context/CompanyContext';
import CompanySwitcher from '../components/CompanySwitcher';
import ClientDetailModal from '../components/modals/ClientDetailModal';
import BalanceReportModal from '../components/modals/BalanceReportModal';
import InvoiceGenerationModal from '../components/helpers';
import InvoicingForm from '../components/InvoicingForm';
import PaymentRegistrationModal from '../../PaymentRegistrationModal';
import type { Sale } from '../../supabaseService';

const FinanceScreen = () => {
    const { selectedCompanyName } = useCompany();
    const { sales, setSales, loading: salesLoading } = useSales();
    const { balances: allClientBalances, loading: balancesLoading } = useClientBalances();

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

    // Client balances filtered client-side (avoid two hook calls)
    const clientBalances = selectedClientFilter === 'ALL'
        ? allClientBalances
        : allClientBalances.filter(b => b.client === selectedClientFilter);

    const uniqueClients = useMemo(
        () => allClientBalances.map(b => b.client).sort(),
        [allClientBalances]
    );

    const getClientCollectionDetail = (clientName: string) => {
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

    const handleViewDetail = (clientName: string) => {
        setSelectedClientForDetail(getClientCollectionDetail(clientName));
        setShowDetailModal(true);
    };

    const handleGenerateOverdueReport = (clientName: string, date: string) => {
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
                return { ...sale, paidAmount: sale.totalSale, paymentStatus: 'PAID' as const, paymentDate: paymentData.date };
            }
            return sale;
        });
        setSales(updatedSales);
        alert(`Pago registrado para ${paymentData.customer}. Unidades actualizadas.`);
    };

    // Summary metrics from v_client_balances (real Supabase data)
    const totalBalanceDue = clientBalances.reduce((acc, b) => acc + b.balanceDue, 0);
    const totalPaid = clientBalances.reduce((acc, b) => acc + b.totalPaid, 0);
    const totalBilled = clientBalances.reduce((acc, b) => acc + b.totalBilled, 0);
    const paidPercentage = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

    const pendingSales = useMemo(() => sales.filter(s => s.paymentStatus !== 'PAID'), [sales]);

    const isLoading = salesLoading || balancesLoading;

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
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">{selectedCompanyName}</h1>
                                <p className="text-lg font-bold leading-none text-white">Finance Hub</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <CompanySwitcher />
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
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 text-sm animate-pulse">Cargando balances...</p>
                        </div>
                    </div>
                ) : activeTab === 'balances' ? (
                    <>
                        {/* Summary Cards — sourced from v_client_balances */}
                        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {/* Total Facturado */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-blue-500">inventory_2</span>
                                </div>
                                <div className="text-xs text-blue-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total Facturado
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${totalBilled.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-4 flex justify-between items-end border-t border-gray-800 pt-3">
                                    <div className="text-xs text-gray-400">Histórico acumulado</div>
                                    <div className="text-sm font-bold text-white">{allClientBalances.filter(b => b.totalBilled > 0).length} <span className="text-xs font-normal text-gray-500">Clientes</span></div>
                                </div>
                            </div>

                            {/* Total Cobrado */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-green-500">payments</span>
                                </div>
                                <div className="text-xs text-green-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Total Cobrado
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${totalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${paidPercentage}%` }}></div>
                                </div>
                                <div className="mt-2 flex justify-between items-end">
                                    <div className="text-[10px] text-gray-400">{paidPercentage.toFixed(1)}% cobrado</div>
                                </div>
                            </div>

                            {/* Saldo Pendiente */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-red-500">pending_actions</span>
                                </div>
                                <div className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Saldo Pendiente
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    ${totalBalanceDue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    <span className="text-xs text-gray-500 font-normal ml-1">MXN</span>
                                </div>
                                <div className="mt-4 flex justify-between items-end border-t border-gray-800 pt-3">
                                    <div className="text-[10px] text-red-400 font-bold uppercase">Gestión de Cobro</div>
                                </div>
                            </div>

                            {/* Clientes con Saldo */}
                            <div className="bg-card-dark p-5 rounded-2xl shadow-lg border border-accent-orange/30 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-accent-orange">people</span>
                                </div>
                                <div className="text-xs text-accent-orange font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent-orange shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span> Con Saldo
                                </div>
                                <div className="text-xl font-bold text-white tracking-tight">
                                    {clientBalances.filter(b => b.balanceDue > 0).length}
                                    <span className="text-xs text-gray-500 font-normal ml-1">Clientes</span>
                                </div>
                                <div className="mt-4 flex justify-between items-end border-t border-gray-800 pt-3">
                                    <div className="text-xs text-gray-400">Con saldo vivo</div>
                                    <div className="text-xs font-bold text-accent-orange">{clientBalances.filter(b => b.status === 'Blocked').length} en riesgo</div>
                                </div>
                            </div>
                        </section>

                        {/* Client Portfolios from v_client_balances */}
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center justify-between">
                                <span>Client Portfolios</span>
                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Sorted by Balance</span>
                            </h3>

                            {clientBalances.length === 0 ? (
                                <div className="bg-card-dark p-8 rounded-2xl border border-gray-800 text-center">
                                    <span className="material-symbols-outlined text-4xl text-gray-600 mb-2 block">account_balance</span>
                                    <p className="text-gray-400 text-sm">Sin clientes con línea de crédito activa</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {clientBalances.map((data) => (
                                        <div key={data.clientId} className={`bg-card-dark p-4 rounded-2xl border ${data.status === 'Blocked' ? 'border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]' : 'border-gray-800'} shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-gray-700`}>
                                            {data.status === 'Blocked' && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>}
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${data.status === 'Blocked' ? 'bg-red-900/30 text-red-400 border-red-500/20' : 'bg-blue-900/30 text-blue-400 border-blue-500/20'}`}>
                                                        {data.client.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-sm text-white group-hover:text-primary transition-colors">{data.client}</h4>
                                                        <p className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-tight ${data.status === 'Blocked' ? 'text-red-500' : 'text-green-500'}`}>
                                                            {data.status === 'Blocked'
                                                                ? <span className="material-symbols-outlined text-[10px]">block</span>
                                                                : <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                                            {data.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-xl px-3 py-2 flex flex-col items-center min-w-[110px]">
                                                        <span className="text-[9px] text-accent-orange font-bold uppercase tracking-wider">Saldo Actual</span>
                                                        <span className="text-sm font-bold text-white">
                                                            ${data.balanceDue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                        </span>
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
                                                        <span className="text-white font-mono">
                                                            ${data.balanceDue.toLocaleString('en-US', { maximumFractionDigits: 0 })} / <span className="opacity-50">${data.creditLimit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                        </span>
                                                    </div>
                                                    <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${data.status === 'Blocked' ? 'bg-red-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${Math.min((data.balanceDue / Math.max(1, data.creditLimit)) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-gray-600">
                                                        <span>Disponible: ${data.creditAvailable.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                        <span>{data.lastSaleDate ? `Últ. venta: ${data.lastSaleDate}` : 'Sin ventas'}</span>
                                                    </div>
                                                </div>

                                                {data.status === 'Blocked' ? (
                                                    <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-red-400 text-sm animate-pulse">warning</span>
                                                            <span className="text-[10px] text-red-400 font-bold uppercase">Límite Excedido</span>
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
                            )}
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
