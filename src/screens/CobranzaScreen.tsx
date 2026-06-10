import React, { useState, useMemo } from 'react';
import { useCobranza, PartnerBalance, MonthlyRow, DUE_INVOICE_ALERTS } from '../hooks/useCobranza';

type Tab = 'resumen' | 'operaciones' | 'cobros';

const fmt = (n: number) =>
    Math.abs(n) >= 1_000_000
        ? `$${(Math.abs(n) / 1_000_000).toFixed(2)}M`
        : Math.abs(n) >= 1_000
            ? `$${(Math.abs(n) / 1_000).toFixed(1)}K`
            : `$${Math.abs(n).toFixed(2)}`;

const fmtFull = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (d: string) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
    <div className="bg-card-dark border border-gray-800 rounded-xl p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
);

// ── Partner Balance Row ───────────────────────────────────────────────────────
const PartnerRow = ({ p, isAlpha }: { p: PartnerBalance; isAlpha?: boolean }) => (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition hover:bg-white/3 ${
        isAlpha
            ? 'border-orange-500/40 bg-orange-500/6'
            : p.isDebtor
                ? 'border-red-500/20 bg-red-500/4'
                : 'border-green-500/20 bg-green-500/4'
    }`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isAlpha ? 'bg-orange-500/20' : p.isDebtor ? 'bg-red-500/15' : 'bg-green-500/15'
        }`}>
            <span className={`material-symbols-outlined text-base ${
                isAlpha ? 'text-orange-400' : p.isDebtor ? 'text-red-400' : 'text-green-400'
            }`}>
                {p.isDebtor ? 'corporate_fare' : 'arrow_upward'}
            </span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold truncate ${isAlpha ? 'text-orange-300' : 'text-white'}`}>
                    {p.name}
                </span>
                {isAlpha && (
                    <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                        Prioridad
                    </span>
                )}
            </div>
            <p className="text-[10px] text-gray-500">
                {p.isDebtor ? 'Debe a ORKA' : 'ORKA debe'}
                {p.creditLimit > 0 && (
                    <span className="ml-2 text-gray-600">límite {fmtFull(p.creditLimit)}</span>
                )}
            </p>
        </div>
        <div className="text-right flex-shrink-0">
            <p className={`text-sm font-black font-mono ${
                isAlpha ? 'text-orange-400' : p.isDebtor ? 'text-red-400' : 'text-green-400'
            }`}>
                {p.isDebtor ? '' : '-'}{fmtFull(Math.abs(p.balance))}
            </p>
        </div>
    </div>
);

// ── DUE Invoice Alert Row ─────────────────────────────────────────────────────
const DueAlertRow = ({ name, amount, note }: { name: string; amount: number; note: string }) => (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 hover:bg-white/3 transition">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-base text-yellow-400">warning</span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{name}</span>
                <span className="text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                    Vencida
                </span>
            </div>
            <p className="text-[10px] text-gray-500">{note}</p>
        </div>
        <div className="text-right flex-shrink-0">
            <p className="text-sm font-black font-mono text-yellow-400">{fmtFull(amount)}</p>
        </div>
    </div>
);

// ── Monthly Table ─────────────────────────────────────────────────────────────
const MonthlyTable = ({ rows }: { rows: MonthlyRow[] }) => (
    <div className="bg-card-dark border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-blue-400">calendar_month</span>
            <p className="text-xs font-bold text-white uppercase tracking-wider">Estado Mensual · ALPHA</p>
            <span className="text-[10px] text-gray-500 ml-auto">2025 – Hoy</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/40">
                        <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider py-2 px-3">Mes</th>
                        <th className="text-right text-[10px] text-gray-500 uppercase tracking-wider py-2 px-3">Facturado</th>
                        <th className="text-right text-[10px] text-gray-500 uppercase tracking-wider py-2 px-3">Cobrado</th>
                        <th className="text-right text-[10px] text-gray-500 uppercase tracking-wider py-2 px-3">Neto Mes</th>
                        <th className="text-right text-[10px] text-gray-500 uppercase tracking-wider py-2 px-3">Acumulado</th>
                        <th className="text-[10px] text-gray-500 uppercase tracking-wider py-2 px-3 w-32">Cobranza</th>
                    </tr>
                </thead>
                <tbody>
                    {[...rows].reverse().map(row => {
                        const pct = Math.min((row.payments / (row.sales || 1)) * 100, 100);
                        const runPositive = row.running > 0;
                        return (
                            <tr key={row.month} className="border-b border-gray-800/60 hover:bg-white/3 transition">
                                <td className="py-2.5 px-3 text-xs font-bold text-white">{row.label}</td>
                                <td className="py-2.5 px-3 text-xs font-mono text-right text-gray-300">{fmt(row.sales)}</td>
                                <td className="py-2.5 px-3 text-xs font-mono text-right text-green-400">{fmt(row.payments)}</td>
                                <td className={`py-2.5 px-3 text-xs font-mono text-right font-bold ${row.net > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {row.net > 0 ? '+' : ''}{fmt(row.net)}
                                </td>
                                <td className={`py-2.5 px-3 text-xs font-mono text-right font-bold ${runPositive ? 'text-orange-400' : 'text-green-400'}`}>
                                    {runPositive ? '+' : ''}{fmt(row.running)}
                                </td>
                                <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-mono w-8 text-right ${pct >= 100 ? 'text-green-400' : pct >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {Math.round(pct)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

// ── Aging Buckets ─────────────────────────────────────────────────────────────
const AgingView = ({ buckets }: { buckets: ReturnType<typeof useCobranza>['agingBuckets'] }) => {
    const total = buckets.reduce((a, b) => a + b.amount, 0);
    return (
        <div className="bg-card-dark border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-base text-orange-400">schedule</span>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Antigüedad de Saldo (Aging)</p>
                {total > 0 && <span className="ml-auto text-xs font-bold text-orange-400">{fmtFull(total)} total</span>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {buckets.map(b => (
                    <div key={b.label} className="rounded-xl p-3 border" style={{ backgroundColor: b.color + '14', borderColor: b.color + '44' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: b.color }}>{b.label}</p>
                        <p className="text-lg font-black text-white">{b.amount > 0 ? fmt(b.amount) : '—'}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">{b.days}</p>
                        {b.amount > 0 && total > 0 && (
                            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(b.amount / total) * 100}%`, backgroundColor: b.color }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Operaciones Tab ───────────────────────────────────────────────────────────
const OperacionesView = ({ sales }: { sales: ReturnType<typeof useCobranza>['sales'] }) => {
    const [search, setSearch] = useState('');
    const [filterProduct, setFilterProduct] = useState('ALL');

    const products = useMemo(() => ['ALL', ...Array.from(new Set(sales.map(s => s.product)))], [sales]);

    const filtered = useMemo(() => {
        let list = sales;
        if (filterProduct !== 'ALL') list = list.filter(s => s.product === filterProduct);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                s.bol.toLowerCase().includes(q) ||
                s.truck.toLowerCase().includes(q) ||
                s.customer.toLowerCase().includes(q)
            );
        }
        return list;
    }, [sales, filterProduct, search]);

    const totalFiltered = useMemo(() => filtered.reduce((a, s) => a + s.total, 0), [filtered]);

    return (
        <div>
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Buscar BOL, pipa, cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <select
                    value={filterProduct}
                    onChange={e => setFilterProduct(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                    {products.map(p => <option key={p} value={p}>{p === 'ALL' ? 'Todos productos' : p}</option>)}
                </select>
                <div className="flex items-center gap-2 text-xs text-gray-400 self-center">
                    <span>{filtered.length} ops</span>
                    <span className="text-white font-bold">{fmtFull(totalFiltered)}</span>
                </div>
            </div>

            <div className="bg-card-dark border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-700 bg-gray-900/50">
                            <tr>
                                {['Fecha', 'Cliente', 'Producto', 'BOL', 'Pipa', 'Galones', 'Rate', 'Total', 'Margen', 'Status'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-10 text-gray-500 text-sm">Sin resultados</td></tr>
                            ) : filtered.map(s => {
                                const marginPct = s.total > 0 ? (s.margin / s.total) * 100 : 0;
                                return (
                                    <tr key={s.id} className="border-b border-gray-800 hover:bg-white/3 transition">
                                        <td className="py-2 px-3 text-xs text-gray-300 whitespace-nowrap">{fmtDate(s.date)}</td>
                                        <td className="py-2 px-3 text-xs font-bold text-blue-300 font-mono whitespace-nowrap">{s.customer}</td>
                                        <td className="py-2 px-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${s.product === 'NAPHTHA' ? 'bg-blue-500/15 text-blue-300'
                                                : s.product === 'ETHANOL' ? 'bg-purple-500/15 text-purple-300'
                                                    : 'bg-yellow-500/15 text-yellow-300'
                                                }`}>{s.product}</span>
                                        </td>
                                        <td className="py-2 px-3 text-[10px] font-mono text-gray-400">{s.bol}</td>
                                        <td className="py-2 px-3 text-xs font-mono text-gray-300">{s.truck}</td>
                                        <td className="py-2 px-3 text-xs font-mono text-right text-white">{s.gallons.toLocaleString()}</td>
                                        <td className="py-2 px-3 text-xs font-mono text-right text-cyan-400">${s.rate.toFixed(4)}</td>
                                        <td className="py-2 px-3 text-xs font-mono text-right font-bold text-white">{fmt(s.total)}</td>
                                        <td className="py-2 px-3 text-xs font-mono text-right">
                                            <span className={marginPct >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                {marginPct >= 0 ? '+' : ''}{marginPct.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className="text-[10px] text-gray-500 font-mono">{s.status}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ── Cobros Tab ────────────────────────────────────────────────────────────────
const CobrosView = ({ payments }: { payments: ReturnType<typeof useCobranza>['payments'] }) => {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search) return payments;
        const q = search.toLowerCase();
        return payments.filter(p =>
            p.customer.toLowerCase().includes(q) ||
            (p.notes || '').toLowerCase().includes(q) ||
            (p.bankRef || '').toLowerCase().includes(q)
        );
    }, [payments, search]);

    const totalFiltered = useMemo(() => filtered.reduce((a, p) => a + p.amount, 0), [filtered]);

    return (
        <div>
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Buscar cliente, referencia, notas..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-3 text-xs self-center">
                    <span className="text-gray-400">{filtered.length} pagos</span>
                    <span className="text-green-400 font-bold">{fmtFull(totalFiltered)} cobrado</span>
                </div>
            </div>

            <div className="bg-card-dark border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-700 bg-gray-900/50">
                            <tr>
                                {['Fecha', 'Cliente', 'Monto', 'Referencia', 'Notas'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500 text-sm">Sin resultados</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p.id} className="border-b border-gray-800 hover:bg-white/3 transition">
                                    <td className="py-2.5 px-3 text-xs text-gray-300 whitespace-nowrap">{fmtDate(p.date)}</td>
                                    <td className="py-2.5 px-3">
                                        <span className="text-xs font-bold text-blue-300 font-mono bg-blue-500/10 px-2 py-0.5 rounded">{p.customer}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-sm font-black text-green-400 font-mono">{fmtFull(p.amount)}</td>
                                    <td className="py-2.5 px-3 text-[10px] text-gray-500 font-mono">{p.bankRef || '—'}</td>
                                    <td className="py-2.5 px-3 text-xs text-gray-400 max-w-xs truncate">{p.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const CobranzaScreen = () => {
    const [tab, setTab] = useState<Tab>('resumen');
    const {
        sales, payments, partnerBalances, monthlyRows, agingBuckets,
        loading, totalDebtors, totalCreditors,
    } = useCobranza();

    const debtors = useMemo(() => partnerBalances.filter(p => p.isDebtor), [partnerBalances]);
    const creditors = useMemo(() => partnerBalances.filter(p => !p.isDebtor), [partnerBalances]);

    const alphaPartner = useMemo(() => debtors.find(p => p.name === 'ALPHA'), [debtors]);
    const alphaII = useMemo(() => creditors.find(p => p.name === 'ALPHA II'), [creditors]);

    const totalSales2025 = useMemo(() => sales.reduce((a, s) => a + s.total, 0), [sales]);
    const totalPaid2025 = useMemo(() => payments.reduce((a, p) => a + p.amount, 0), [payments]);
    const lastPayment = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date))[0], [payments]);

    const dueTotal = DUE_INVOICE_ALERTS.reduce((a, d) => a + d.amount, 0);
    const totalExposure = totalDebtors + dueTotal;

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Cargando cobranza...</p>
                </div>
            </div>
        );
    }

    const TABS: { id: Tab; label: string; icon: string }[] = [
        { id: 'resumen', label: 'Resumen', icon: 'bar_chart' },
        { id: 'operaciones', label: 'Operaciones', icon: 'receipt_long' },
        { id: 'cobros', label: 'Cobros', icon: 'payments' },
    ];

    return (
        <div className="min-h-screen bg-background-dark pb-28">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background-dark/95 backdrop-blur border-b border-gray-800 px-4 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-orange-400">account_balance</span>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tight">Cobranza</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cuentas por Cobrar · Todos los clientes</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="px-3 py-1 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-400">
                            {fmtFull(totalExposure)} total
                        </div>
                        <p className="text-[9px] text-gray-500">{debtors.length} clientes · exposición total</p>
                    </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <KPI
                        label="CxC Activos"
                        value={fmt(totalDebtors)}
                        sub={`${debtors.length} clientes`}
                        color="text-red-400"
                    />
                    <KPI
                        label="Facturas Venc."
                        value={fmt(dueTotal)}
                        sub={`${DUE_INVOICE_ALERTS.length} clientes`}
                        color="text-yellow-400"
                    />
                    <KPI
                        label="Facturado 2025"
                        value={fmt(totalSales2025)}
                        sub={`${sales.length} ops`}
                        color="text-white"
                    />
                    <KPI
                        label="Cobrado 2025"
                        value={fmt(totalPaid2025)}
                        sub={`${payments.length} pagos`}
                        color="text-green-400"
                    />
                </div>

                {/* Last payment info */}
                {lastPayment && (
                    <div className="flex items-center gap-2 text-xs bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2 mb-3">
                        <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                        <span className="text-gray-400">Último pago:</span>
                        <span className="text-white font-bold">{fmtDate(lastPayment.date)}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-green-400 font-bold">{fmtFull(lastPayment.amount)}</span>
                        <span className="text-gray-500">· {lastPayment.customer}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t.id
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pt-4 space-y-4">
                {tab === 'resumen' && (
                    <>
                        {/* ── ALPHA priority card ── */}
                        {alphaPartner && (
                            <div className="bg-gradient-to-br from-orange-950/40 to-gray-900 border border-orange-500/40 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-orange-400 text-xl">star</span>
                                    <h2 className="text-sm font-black text-orange-300 uppercase tracking-wider">Cobranza Estratégica · ALPHA</h2>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Saldo Actual</p>
                                        <p className="text-2xl font-black text-orange-400">{fmtFull(alphaPartner.balance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Límite Crédito</p>
                                        <p className="text-xl font-bold text-white">{fmtFull(alphaPartner.creditLimit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Crédito Disponible</p>
                                        <p className="text-xl font-bold text-cyan-400">{fmtFull(alphaPartner.creditAvailable)}</p>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                        style={{ width: `${Math.min((alphaPartner.balance / alphaPartner.creditLimit) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {((alphaPartner.balance / alphaPartner.creditLimit) * 100).toFixed(1)}% del límite utilizado
                                </p>
                            </div>
                        )}

                        {/* ── Aging buckets ── */}
                        <AgingView buckets={agingBuckets} />

                        {/* ── Clientes que deben a ORKA ── */}
                        <div className="bg-card-dark border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-red-400">arrow_downward</span>
                                <p className="text-xs font-bold text-white uppercase tracking-wider">
                                    Clientes que Deben a ORKA
                                </p>
                                <span className="ml-auto text-xs font-bold text-red-400">{fmtFull(totalDebtors)}</span>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {debtors.length === 0 ? (
                                    <p className="text-center py-6 text-gray-500 text-sm">Sin saldos pendientes</p>
                                ) : debtors.map(p => (
                                    <PartnerRow key={p.id} p={p} isAlpha={p.name === 'ALPHA'} />
                                ))}
                            </div>
                        </div>

                        {/* ── Facturas vencidas alerts ── */}
                        <div className="bg-card-dark border border-yellow-500/20 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-yellow-400">warning</span>
                                <p className="text-xs font-bold text-white uppercase tracking-wider">
                                    Facturas Vencidas por Cobrar
                                </p>
                                <span className="ml-auto text-xs font-bold text-yellow-400">{fmtFull(dueTotal)}</span>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {DUE_INVOICE_ALERTS.map(d => (
                                    <DueAlertRow key={d.name} {...d} />
                                ))}
                            </div>
                        </div>

                        {/* ── Monthly table ── */}
                        {monthlyRows.length > 0 && <MonthlyTable rows={monthlyRows} />}

                        {/* ── ORKA debe a clientes ── */}
                        {creditors.length > 0 && (
                            <div className="bg-card-dark border border-gray-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-green-400">arrow_upward</span>
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                                        ORKA Debe a Clientes (CxP)
                                    </p>
                                    <span className="ml-auto text-xs font-bold text-green-400">{fmtFull(Math.abs(totalCreditors))}</span>
                                </div>
                                {/* ALPHA II highlight */}
                                {alphaII && (
                                    <div className="mx-3 mt-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg text-blue-400">business</span>
                                                <div>
                                                    <p className="text-sm font-black text-white">ALPHA II</p>
                                                    <p className="text-[10px] text-gray-400">Deuda más significativa · Proveedor relacionado</p>
                                                </div>
                                            </div>
                                            <p className="text-xl font-black text-blue-400">{fmtFull(Math.abs(alphaII.balance))}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 space-y-1.5 mt-1">
                                    {creditors.filter(p => p.name !== 'ALPHA II').map(p => (
                                        <PartnerRow key={p.id} p={p} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {tab === 'operaciones' && <OperacionesView sales={sales} />}
                {tab === 'cobros' && <CobrosView payments={payments} />}
            </div>
        </div>
    );
};

export default CobranzaScreen;
