import React, { useState, useMemo } from 'react';
import {
    useOperations,
    OperationStatus,
    Operation,
    STATUS_ORDER,
    TERMINAL_ROUTES,
} from '../hooks/useOperations';
import { useCompany } from '../context/CompanyContext';
import CompanySwitcher from '../components/CompanySwitcher';

type ViewMode = 'pipeline' | 'lista' | 'mapa';

// ─── Style config per status ─────────────────────────────────────────────────
const S: Record<OperationStatus, { label: string; text: string; bg: string; border: string; icon: string; hex: string }> = {
    INTENTION:          { label: 'Intention',        text: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   icon: 'lightbulb',        hex: '#9ca3af' },
    APPROVED:           { label: 'Approved',         text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   icon: 'check_circle',     hex: '#60a5fa' },
    LOADING:            { label: 'Loading',          text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'local_shipping',   hex: '#facc15' },
    'ON TRACK':         { label: 'On Track',         text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   icon: 'directions_car',   hex: '#22d3ee' },
    'BOL UPDATED':      { label: 'BOL Updated',      text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'description',      hex: '#c084fc' },
    'POD PENDING':      { label: 'POD Pending',      text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'pending_actions',  hex: '#fb923c' },
    'FRONTERA CRUZADA': { label: 'Frontera Cruzada', text: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/30',   icon: 'border_crossing',  hex: '#f472b6' },
    DONE:               { label: 'Done',             text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  icon: 'task_alt',         hex: '#4ade80' },
};

// ─── Map data ─────────────────────────────────────────────────────────────────
interface MapNode { x: number; y: number; label: string; country: 'US' | 'MX'; isTerminal?: boolean }

const MAP_NODES: Record<string, MapNode> = {
    // Actual loading terminals
    BLUEWING: { x: 920, y: 400, label: 'BLUEWING', country: 'US', isTerminal: true },
    TITAN:    { x: 780, y: 340, label: 'TITAN',    country: 'US', isTerminal: true },
    MOTUS:    { x: 930, y: 410, label: 'MOTUS',    country: 'US', isTerminal: true },
    SUNOCO:   { x: 910, y: 390, label: 'SUNOCO',   country: 'US', isTerminal: true },
    // Border reference cities
    EPT:      { x: 158, y: 114, label: 'El Paso',      country: 'US' },
    EGL:      { x: 522, y: 290, label: 'Eagle Pass',   country: 'US' },
    LRD:      { x: 658, y: 358, label: 'Laredo',       country: 'US' },
    BRO:      { x: 930, y: 420, label: 'Brownsville',  country: 'US' },
    SAT:      { x: 780, y: 252, label: 'San Antonio',  country: 'US' },
    NVO:      { x: 662, y: 378, label: 'Nvo. Laredo',  country: 'MX' },
    MTY:      { x: 718, y: 510, label: 'Monterrey',    country: 'MX' },
    JCZ:      { x: 162, y: 152, label: 'Juárez',       country: 'MX' },
    PNE:      { x: 528, y: 314, label: 'Piedras Neg.', country: 'MX' },
};

// Predefined map routes (visual flow lines)
const MAP_ROUTES: Array<{ from: string; to: string; border?: boolean }> = [
    { from: 'JCZ',  to: 'EPT' },
    { from: 'PNE',  to: 'EGL' },
    { from: 'NVO',  to: 'LRD' },
    { from: 'MTY',  to: 'NVO' },
    { from: 'EGL',  to: 'SAT' },
    { from: 'LRD',  to: 'SAT' },
    { from: 'BRO',  to: 'SAT' },
    // Terminal connections
    { from: 'BLUEWING', to: 'BRO' },
    { from: 'TITAN',    to: 'LRD' },
    { from: 'MOTUS',    to: 'EGL' },
    { from: 'SUNOCO',   to: 'SAT' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const OpCard = ({ op }: { op: Operation }) => (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 hover:border-gray-500 transition cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-white">{op.product}</p>
            <span className="text-[10px] text-gray-400 font-mono">{op.truck}</span>
        </div>
        <p className="text-[11px] text-gray-300 mb-1 truncate">👤 {op.customer}</p>
        <div className="flex justify-between items-center border-t border-gray-700 pt-2 mt-2">
            <span className="text-[10px] text-gray-400">{op.gallons.toLocaleString()} GL</span>
            <span className="text-[10px] text-cyan-400 font-mono">${op.rate.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-gray-500 font-mono">{op.bol || '—'}</span>
            <span className="text-[10px] text-gray-500">{new Date(op.date).toLocaleDateString('es-MX')}</span>
        </div>
    </div>
);

// ─── Pipeline (Kanban) ────────────────────────────────────────────────────────
const PipelineView = ({ operationsByStatus, statusCounts }: {
    operationsByStatus: Record<OperationStatus, Operation[]>;
    statusCounts: Record<OperationStatus, number>;
}) => (
    <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
            {STATUS_ORDER.map(status => {
                const cfg = S[status];
                const ops = operationsByStatus[status];
                return (
                    <div key={status} className={`w-52 ${cfg.bg} border ${cfg.border} rounded-xl p-3 flex flex-col`} style={{ minHeight: 520 }}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                            <span className={`material-symbols-outlined text-base ${cfg.text}`}>{cfg.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-[11px] ${cfg.text} uppercase tracking-wide leading-tight`}>{cfg.label}</p>
                                <p className="text-[10px] text-gray-500">{ops.length} op{ops.length !== 1 ? 's' : ''}</p>
                            </div>
                            <span className={`text-xs font-black ${cfg.text} ml-auto`}>{ops.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto flex-1" style={{ maxHeight: 500 }}>
                            {ops.length === 0
                                ? <p className="text-[11px] text-gray-600 italic text-center pt-8">Sin operaciones</p>
                                : ops.map(op => <OpCard key={op.id} op={op} />)
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

// ─── Lista (Table) ────────────────────────────────────────────────────────────
const ListaView = ({ operations }: { operations: Operation[] }) => {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<OperationStatus | 'ALL'>('ALL');
    const [filterTerminal, setFilterTerminal] = useState('ALL');
    const [sortField, setSortField] = useState<keyof Operation>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const terminals = useMemo(() => ['ALL', ...Array.from(new Set(operations.map(o => o.terminal)))], [operations]);

    const filtered = useMemo(() => {
        let list = operations;
        if (filterStatus !== 'ALL') list = list.filter(o => o.status === filterStatus);
        if (filterTerminal !== 'ALL') list = list.filter(o => o.terminal === filterTerminal);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(o =>
                o.customer.toLowerCase().includes(q) ||
                o.truck.toLowerCase().includes(q) ||
                o.bol.toLowerCase().includes(q) ||
                o.product.toLowerCase().includes(q)
            );
        }
        return [...list].sort((a, b) => {
            const va = String(a[sortField] ?? '');
            const vb = String(b[sortField] ?? '');
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
    }, [operations, filterStatus, filterTerminal, search, sortField, sortDir]);

    const toggleSort = (field: keyof Operation) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const Th = ({ field, children }: { field: keyof Operation; children: React.ReactNode }) => (
        <th
            className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2 px-3 cursor-pointer hover:text-white transition select-none"
            onClick={() => toggleSort(field)}
        >
            {children} {sortField === field && (sortDir === 'asc' ? '↑' : '↓')}
        </th>
    );

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Buscar cliente, camión, BOL..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as OperationStatus | 'ALL')}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                    <option value="ALL">Todos los status</option>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{S[s].label}</option>)}
                </select>
                <select
                    value={filterTerminal}
                    onChange={e => setFilterTerminal(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                    {terminals.map(t => <option key={t} value={t}>{t === 'ALL' ? 'Todos terminales' : t}</option>)}
                </select>
                <span className="text-xs text-gray-400 self-center">{filtered.length} operaciones</span>
            </div>

            {/* Table */}
            <div className="bg-card-dark rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-700 bg-gray-900/50">
                            <tr>
                                <Th field="date">Fecha</Th>
                                <Th field="terminal">Terminal</Th>
                                <Th field="product">Producto</Th>
                                <Th field="customer">Cliente</Th>
                                <Th field="truck">Pipa</Th>
                                <Th field="bol">BOL</Th>
                                <Th field="gallons">GL</Th>
                                <Th field="rate">Rate</Th>
                                <Th field="status">Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-12 text-gray-500 text-sm">Sin operaciones con los filtros actuales</td></tr>
                            ) : (
                                filtered.map(op => {
                                    const cfg = S[op.status];
                                    return (
                                        <tr key={op.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                                            <td className="py-2 px-3 text-xs text-gray-300">{new Date(op.date).toLocaleDateString('es-MX')}</td>
                                            <td className="py-2 px-3">
                                                <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{op.terminal}</span>
                                            </td>
                                            <td className="py-2 px-3 text-xs text-white font-medium">{op.product}</td>
                                            <td className="py-2 px-3 text-xs text-gray-300 max-w-32 truncate">{op.customer}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-gray-300">{op.truck}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-gray-400">{op.bol || '—'}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-right text-white">{op.gallons.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-right text-cyan-400">${op.rate.toFixed(2)}</td>
                                            <td className="py-2 px-3">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: cfg.hex }}></span>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── Mapa (SVG Route Map) ─────────────────────────────────────────────────────
const MapaView = ({ operations, terminalStats, routeStats }: {
    operations: Operation[];
    terminalStats: ReturnType<typeof useOperations>['terminalStats'];
    routeStats: ReturnType<typeof useOperations>['routeStats'];
}) => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Active terminals (have ops)
    const activeTerminals = useMemo(() =>
        new Set(operations.filter(o => o.status !== 'DONE').map(o => o.terminal)),
    [operations]);

    // Ops count per terminal
    const terminalOpCount = useMemo(() => {
        const m: Record<string, number> = {};
        operations.forEach(o => { if (o.status !== 'DONE') m[o.terminal] = (m[o.terminal] || 0) + 1; });
        return m;
    }, [operations]);

    // Active routes
    const activeRouteKeys = useMemo(() =>
        new Set(routeStats.map(r => `${r.origin}→${r.destination}`)),
    [routeStats]);

    const getRouteOps = (from: string, to: string) =>
        routeStats.find(r => r.origin === from && r.destination === to);

    return (
        <div className="space-y-4">
            {/* Route Scoreboards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {terminalStats.map(ts => (
                    <div key={ts.terminal} className="bg-card-dark border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-blue-300 font-mono tracking-wider">{ts.terminal}</span>
                            <span className="text-[10px] text-gray-500">{ts.activeOps} activas</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{ts.activeOps}</p>
                        <p className="text-[10px] text-gray-400">{ts.trucks.size} pipas · {Math.round(ts.totalGallons / 1000)}k GL</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(ts.statusBreakdown).slice(0, 3).map(([s, n]) => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    style={{ backgroundColor: S[s as OperationStatus]?.hex + '22', color: S[s as OperationStatus]?.hex }}>
                                    {n} {s}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Routes */}
            {routeStats.length > 0 && (
                <div className="bg-card-dark border border-gray-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-yellow-400">route</span>
                        Rutas Activas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {routeStats.map(r => (
                            <div key={`${r.origin}-${r.destination}`} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-blue-300 font-mono">{r.origin}</span>
                                    <span className="material-symbols-outlined text-yellow-400 text-sm">arrow_forward</span>
                                    <span className="text-xs font-bold text-cyan-300 font-mono">{r.destination}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400">
                                    <span>{r.activeOps} pipas activas</span>
                                    <span>{r.totalGallons.toLocaleString()} GL</span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {r.trucks.slice(0, 4).map(t => (
                                        <span key={t} className="text-[9px] text-gray-300 bg-gray-700 px-1.5 rounded font-mono">{t}</span>
                                    ))}
                                    {r.trucks.length > 4 && <span className="text-[9px] text-gray-500">+{r.trucks.length - 4}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SVG Map */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden">
                {/* Region Label */}
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] tracking-[0.25em] font-bold text-gray-500 uppercase">TEXAS · NEW MEXICO · ARIZONA</p>
                        <p className="text-[10px] tracking-[0.3em] text-gray-600 uppercase">United States</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Terminal US</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Ciudad MX</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block"></span> Ruta activa</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-600 border-dashed inline-block"></span> Frontera</span>
                    </div>
                </div>

                <svg viewBox="0 0 1000 550" className="w-full" style={{ height: 420 }}>
                    <defs>
                        {/* Arrow marker for route lines */}
                        <marker id="arrowActive" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#eab308" />
                        </marker>
                        <marker id="arrowInactive" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#374151" />
                        </marker>
                        <marker id="arrowPink" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#f472b6" />
                        </marker>
                        {/* Glow filter for active nodes */}
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Gradient background */}
                        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#0a0a0a" />
                        </linearGradient>
                    </defs>

                    {/* Background */}
                    <rect width="1000" height="550" fill="url(#bgGrad)" />

                    {/* Mexico zone label */}
                    <text x="600" y="535" fill="#374151" fontSize="11" fontFamily="monospace" letterSpacing="3" textAnchor="middle" fontWeight="bold">
                        MÉXICO
                    </text>
                    <text x="400" y="80" fill="#1e3a5f" fontSize="11" fontFamily="monospace" letterSpacing="3" textAnchor="middle" fontWeight="bold">
                        ESTADOS UNIDOS
                    </text>

                    {/* Rio Grande / Río Bravo border line (dashed) */}
                    <path
                        d="M 158 120 C 240 150 360 220 430 268 C 478 298 515 293 525 295 C 555 298 632 358 652 360 C 688 362 762 408 845 415 C 882 418 910 420 940 422"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        opacity="0.8"
                    />
                    <text x="500" y="285" fill="#374151" fontSize="9" fontFamily="monospace" letterSpacing="2" textAnchor="middle" transform="rotate(-10, 500, 285)">
                        — RÍO BRAVO · RÍO GRANDE —
                    </text>

                    {/* Route lines */}
                    {MAP_ROUTES.map(({ from, to }) => {
                        const a = MAP_NODES[from];
                        const b = MAP_NODES[to];
                        if (!a || !b) return null;
                        const isActive = activeRouteKeys.has(`${from}→${to}`) ||
                                        activeTerminals.has(from);
                        const isFrontera = operations.some(
                            o => o.terminal === from && o.status === 'FRONTERA CRUZADA'
                        );
                        const color = isFrontera ? '#f472b6' : isActive ? '#eab308' : '#1f2937';
                        const marker = isFrontera ? 'url(#arrowPink)' : isActive ? 'url(#arrowActive)' : 'url(#arrowInactive)';
                        const routeData = getRouteOps(from, to);
                        const strokeWidth = isActive ? (1.5 + Math.min((routeData?.activeOps || 0) * 0.5, 2)) : 1;

                        return (
                            <g key={`${from}-${to}`}>
                                <line
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke={color}
                                    strokeWidth={strokeWidth}
                                    opacity={isActive ? 0.9 : 0.3}
                                    markerEnd={marker}
                                />
                                {isActive && routeData && (
                                    <text
                                        x={(a.x + b.x) / 2}
                                        y={(a.y + b.y) / 2 - 6}
                                        fill="#eab308"
                                        fontSize="9"
                                        textAnchor="middle"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                    >
                                        {routeData.activeOps}🚚
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* City / reference nodes */}
                    {Object.entries(MAP_NODES).filter(([, n]) => !n.isTerminal).map(([code, node]) => (
                        <g key={code}>
                            <circle
                                cx={node.x} cy={node.y} r={4}
                                fill={node.country === 'US' ? '#1d4ed8' : '#166534'}
                                stroke={node.country === 'US' ? '#3b82f6' : '#22c55e'}
                                strokeWidth="1.5"
                                opacity="0.7"
                            />
                            <text x={node.x} y={node.y - 7} fill={node.country === 'US' ? '#93c5fd' : '#86efac'}
                                fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold" opacity="0.7">
                                {code}
                            </text>
                        </g>
                    ))}

                    {/* Terminal nodes (actual loading terminals with data) */}
                    {Object.entries(MAP_NODES).filter(([, n]) => n.isTerminal).map(([code, node]) => {
                        const count = terminalOpCount[code] || 0;
                        const isActive = activeTerminals.has(code);
                        const tsData = terminalStats.find(t => t.terminal === code);
                        const isHovered = hoveredNode === code;
                        const r = Math.max(10, Math.min(22, 10 + count * 2));

                        return (
                            <g key={code}
                                onMouseEnter={() => setHoveredNode(code)}
                                onMouseLeave={() => setHoveredNode(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Pulse ring for active terminals */}
                                {isActive && (
                                    <circle cx={node.x} cy={node.y} r={r + 6}
                                        fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.3"
                                        className="animate-ping"
                                    />
                                )}
                                {/* Main node */}
                                <circle
                                    cx={node.x} cy={node.y} r={r}
                                    fill={isActive ? '#1d4ed8' : '#1f2937'}
                                    stroke={isActive ? '#60a5fa' : '#374151'}
                                    strokeWidth={isActive ? 2 : 1}
                                    filter={isActive ? 'url(#glow)' : undefined}
                                />
                                {/* Count badge */}
                                {count > 0 && (
                                    <text x={node.x} y={node.y + 1} fill="white" fontSize="9"
                                        textAnchor="middle" dominantBaseline="middle" fontWeight="bold" fontFamily="monospace">
                                        {count}
                                    </text>
                                )}
                                {/* Terminal name */}
                                <text x={node.x} y={node.y + r + 12} fill={isActive ? '#93c5fd' : '#4b5563'}
                                    fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                                    {code}
                                </text>

                                {/* Hover tooltip */}
                                {isHovered && tsData && (
                                    <g>
                                        <rect x={node.x - 60} y={node.y - r - 60} width={120} height={55}
                                            fill="#111827" stroke="#374151" strokeWidth="1" rx="4" opacity="0.95" />
                                        <text x={node.x} y={node.y - r - 48} fill="#93c5fd" fontSize="9"
                                            textAnchor="middle" fontFamily="monospace" fontWeight="bold">{code}</text>
                                        <text x={node.x} y={node.y - r - 36} fill="#9ca3af" fontSize="8"
                                            textAnchor="middle" fontFamily="monospace">{tsData.totalOps} ops · {tsData.trucks.size} pipas</text>
                                        <text x={node.x} y={node.y - r - 22} fill="#6ee7b7" fontSize="8"
                                            textAnchor="middle" fontFamily="monospace">{Math.round(tsData.totalGallons / 1000)}k GL total</text>
                                        <text x={node.x} y={node.y - r - 10} fill="#facc15" fontSize="8"
                                            textAnchor="middle" fontFamily="monospace">{tsData.activeOps} activas</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OperationsScreen = () => {
    const { selectedCompanyName } = useCompany();
    const { operations, operationsByStatus, terminalStats, routeStats, globalStats, loading } = useOperations();
    const [activeView, setActiveView] = useState<ViewMode>('pipeline');

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

    return (
        <div className="min-h-screen bg-background-dark pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 px-6 py-4">
                <div className="w-full max-w-7xl mx-auto">
                    {/* Title row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                                <span className="material-symbols-outlined text-white text-lg">workflow</span>
                            </div>
                            <div>
                                <h1 className="text-xs font-semibold tracking-wide uppercase text-gray-400">{selectedCompanyName}</h1>
                                <p className="text-lg font-bold leading-none text-white">Operations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* View tabs */}
                            <div className="flex gap-1 p-1 bg-gray-900 rounded-lg border border-gray-800">
                                {([['pipeline', 'view_kanban', 'Pipeline'], ['lista', 'table_rows', 'Lista'], ['mapa', 'map', 'Mapa']] as const).map(([v, icon, lbl]) => (
                                    <button key={v} onClick={() => setActiveView(v)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === v ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-gray-300'}`}>
                                        <span className="material-symbols-outlined text-sm">{icon}</span>
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                            <CompanySwitcher />
                        </div>
                    </div>

                    {/* Stats scoreboard */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {/* Global KPIs */}
                        <div className="flex gap-2 mr-2 shrink-0">
                            <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-center min-w-20">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Total</p>
                                <p className="text-base font-black text-white">{globalStats.total}</p>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-center min-w-20">
                                <p className="text-[9px] text-blue-400 uppercase tracking-wide">Pipas Activas</p>
                                <p className="text-base font-black text-blue-300">{globalStats.activeTrucks}</p>
                            </div>
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-center min-w-24">
                                <p className="text-[9px] text-cyan-400 uppercase tracking-wide">Vol. Tránsito</p>
                                <p className="text-sm font-black text-cyan-300">{(globalStats.volumeInTransit / 1000).toFixed(0)}k GL</p>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="w-px bg-gray-700 mx-1 self-stretch shrink-0"></div>

                        {/* Per-status counts */}
                        {STATUS_ORDER.map(s => {
                            const cfg = S[s];
                            const n = globalStats.statusCounts[s];
                            return (
                                <div key={s} className={`${cfg.bg} border ${cfg.border} rounded-lg px-3 py-2 text-center min-w-16 shrink-0`}>
                                    <p className={`text-[9px] ${cfg.text} uppercase tracking-wide font-bold leading-tight`}>{cfg.label.replace(' ', '\n')}</p>
                                    <p className={`text-base font-black ${cfg.text}`}>{n}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-6 py-6 w-full max-w-7xl mx-auto">
                {activeView === 'pipeline' && (
                    <PipelineView operationsByStatus={operationsByStatus} statusCounts={globalStats.statusCounts} />
                )}
                {activeView === 'lista' && (
                    <ListaView operations={operations} />
                )}
                {activeView === 'mapa' && (
                    <MapaView operations={operations} terminalStats={terminalStats} routeStats={routeStats} />
                )}
            </main>
        </div>
    );
};

export default OperationsScreen;
