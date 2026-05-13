import React, { useState, useMemo } from 'react';
import { useCobranza, CustomerSummary, MonthlyRow } from '../hooks/useCobranza';

type Tab = 'resumen' | 'operaciones' | 'cobros';

const fmt = (n: number) =>
    n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : n >= 1_000
            ? `$${(n / 1_000).toFixed(1)}K`
            : `$${n.toFixed(2)}`;

const fmtFull = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (d: string) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Balance chip ──────────────────────────────────────────────────────────────
const BalanceChip = ({ balance }: { balance: number }) => {
    const positive = balance > 0;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${positive
            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
            : 'bg-green-500/15 text-green-400 border border-green-500/30'
            }`}>
            <span className="material-symbols-outlined text-base">
                {positive ? 'warning' : 'check_circle'}
            </span>
            {positive ? `${fmtFull(balance)} pendiente` : 'Al corriente'}
        </span>
    );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
    <div className="bg-card-dark border border-gray-800 rounded-xl p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
);

// ── Monthly Table ─────────────────────────────────────────────────────────────
const MonthlyTable = ({ rows }: { rows: MonthlyRow[] }) => {
    const maxSales = Math.max(...rows.map(r => r.sales), 1);

    return (
        <div className="bg-card-dark border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">calendar_month</span>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Estado Mensual</p>
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
};

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

// ── Customer Hero Card ────────────────────────────────────────────────────────
const CustomerCard = ({ c }: { c: CustomerSummary }) => (
    <div className="bg-gradient-to-br from-gray-900 to-[#0f0f0f] border border-gray-700 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-blue-400">corporate_fare</span>
                </div>
                <div>
                    <h2 className="text-xl font-black text-white tracking-wide">{c.customer}</h2>
                    <p className="text-xs text-gray-400">{c.salesCount} operaciones · {c.products.join(', ')}</p>
                </div>
            </div>
            <BalanceChip balance={c.balance} />
        </div>

        <div className="grid grid-cols-3 gap-4">
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Facturado 2025+</p>
                <p className="text-lg font-bold text-white">{fmt(c.totalSales)}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cobrado Total</p>
                <p className="text-lg font-bold text-green-400">{fmt(c.totalPaid)}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Saldo Pendiente</p>
                <p className={`text-lg font-bold ${c.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {fmtFull(c.balance)}
                </p>
            </div>
        </div>

        {c.lastPaymentDate && (
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-sm text-green-400">paid</span>
                    Último pago recibido: <span className="text-white font-bold">{fmtDate(c.lastPaymentDate)}</span>
                </div>
                <span className="text-sm font-bold text-green-400">{fmtFull(c.lastPaymentAmount)}</span>
            </div>
        )}
    </div>
);

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
                                {['Fecha', 'Producto', 'BOL', 'Pipa', 'Galones', 'Rate', 'Total', 'Margen', 'Status'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-10 text-gray-500 text-sm">Sin resultados</td></tr>
                            ) : filtered.map(s => {
                                const marginPct = s.total > 0 ? (s.margin / s.total) * 100 : 0;
                                return (
                                    <tr key={s.id} className="border-b border-gray-800 hover:bg-white/3 transition">
                                        <td className="py-2 px-3 text-xs text-gray-300 whitespace-nowrap">{fmtDate(s.date)}</td>
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
    const { sales, payments, customerSummaries, monthlyRows, agingBuckets, loading } = useCobranza();

    const totalSales = useMemo(() => sales.reduce((a, s) => a + s.total, 0), [sales]);
    const totalPaid = useMemo(() => payments.reduce((a, p) => a + p.amount, 0), [payments]);
    const netBalance = useMemo(() => customerSummaries.reduce((a, c) => a + c.balance, 0), [customerSummaries]);
    const lastPayment = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date))[0], [payments]);
    const totalMargin = useMemo(() => sales.reduce((a, s) => a + s.margin, 0), [sales]);

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
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cuentas por Cobrar · 2025–Hoy</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-xl border text-sm font-black ${netBalance > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                            {netBalance > 0 ? '⚠' : '✓'} {fmtFull(Math.abs(netBalance))}
                        </div>
                    </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <KPI label="Facturado" value={fmt(totalSales)} sub="desde Ene 2025" color="text-white" />
                    <KPI label="Cobrado" value={fmt(totalPaid)} sub={`${payments.length} pagos`} color="text-green-400" />
                    <KPI label="Saldo" value={fmt(Math.abs(netBalance))} sub={netBalance > 0 ? 'pendiente' : 'a favor'} color={netBalance > 0 ? 'text-red-400' : 'text-green-400'} />
                    <KPI label="Margen" value={fmt(totalMargin)} sub={`${totalSales > 0 ? ((totalMargin / totalSales) * 100).toFixed(1) : 0}% del total`} color="text-cyan-400" />
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
                        {/* Customer cards */}
                        {customerSummaries.map(c => (
                            <CustomerCard key={c.customerId} c={c} />
                        ))}

                        {/* Aging */}
                        <AgingView buckets={agingBuckets} />

                        {/* Monthly table */}
                        <MonthlyTable rows={monthlyRows} />
                    </>
                )}

                {tab === 'operaciones' && <OperacionesView sales={sales} />}
                {tab === 'cobros' && <CobrosView payments={payments} />}
            </div>
        </div>
    );
};

export default CobranzaScreen;
