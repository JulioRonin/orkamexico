import { useMemo } from 'react';
import { useSales } from './useSales';
import { useCompany } from '../context/CompanyContext';

export type OperationStatus =
    | 'INTENTION'
    | 'APPROVED'
    | 'LOADING'
    | 'ON TRACK'
    | 'BOL UPDATED'
    | 'POD PENDING'
    | 'FRONTERA CRUZADA'
    | 'DONE';

export interface Operation {
    id: string;
    date: string;
    product: string;
    customer: string;
    truck: string;
    trailer: string;
    bol: string;
    status: OperationStatus;
    netBarrels: number;
    gallons: number;
    totalSale: number;
    rate: number;
    terminal: string;
    carrier: string;
}

export interface TerminalStats {
    terminal: string;
    totalOps: number;
    activeOps: number;
    totalGallons: number;
    trucks: Set<string>;
    statusBreakdown: Partial<Record<OperationStatus, number>>;
}

export interface RouteStats {
    origin: string;
    destination: string;
    activeOps: number;
    totalGallons: number;
    trucks: string[];
}

export const STATUS_ORDER: OperationStatus[] = [
    'INTENTION',
    'APPROVED',
    'LOADING',
    'ON TRACK',
    'BOL UPDATED',
    'POD PENDING',
    'FRONTERA CRUZADA',
    'DONE',
];

const ACTIVE_STATUSES: OperationStatus[] = [
    'APPROVED', 'LOADING', 'ON TRACK', 'BOL UPDATED', 'POD PENDING', 'FRONTERA CRUZADA',
];

// Known routes between terminals and destinations
export const TERMINAL_ROUTES: Record<string, string[]> = {
    'BLUEWING':  ['BRO', 'SAT'],
    'TITAN':     ['LRD', 'SAT'],
    'MOTUS':     ['EGL', 'SAT'],
    'SUNOCO':    ['SAT', 'NXN'],
};

export const useOperations = () => {
    const { selectedCompanyId } = useCompany();
    const { sales, loading } = useSales();

    const operations: Operation[] = useMemo(() =>
        sales.map(s => ({
            id: s.id,
            date: s.date,
            product: s.product,
            customer: s.customer,
            truck: s.truck,
            trailer: s.trailer,
            bol: s.bol,
            status: s.status as OperationStatus,
            netBarrels: s.netBarrels,
            gallons: s.gallons,
            totalSale: s.totalSale,
            rate: s.rate,
            terminal: s.terminal,
            carrier: s.carrier,
        })),
    [sales]);

    const operationsByStatus = useMemo(() => {
        const grouped: Record<OperationStatus, Operation[]> = {
            INTENTION: [], APPROVED: [], LOADING: [], 'ON TRACK': [],
            'BOL UPDATED': [], 'POD PENDING': [], 'FRONTERA CRUZADA': [], DONE: [],
        };
        operations.forEach(op => {
            if (op.status in grouped) grouped[op.status].push(op);
        });
        Object.keys(grouped).forEach(s =>
            grouped[s as OperationStatus].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )
        );
        return grouped;
    }, [operations]);

    const terminalStats = useMemo((): TerminalStats[] => {
        const map: Record<string, TerminalStats> = {};
        operations.forEach(op => {
            if (!map[op.terminal]) {
                map[op.terminal] = {
                    terminal: op.terminal,
                    totalOps: 0, activeOps: 0, totalGallons: 0,
                    trucks: new Set(), statusBreakdown: {},
                };
            }
            const ts = map[op.terminal];
            ts.totalOps++;
            ts.totalGallons += op.gallons;
            ts.trucks.add(op.truck);
            if (ACTIVE_STATUSES.includes(op.status)) ts.activeOps++;
            ts.statusBreakdown[op.status] = (ts.statusBreakdown[op.status] || 0) + 1;
        });
        return Object.values(map).sort((a, b) => b.activeOps - a.activeOps);
    }, [operations]);

    const routeStats = useMemo((): RouteStats[] => {
        const map: Record<string, RouteStats> = {};
        operations.forEach(op => {
            if (!ACTIVE_STATUSES.includes(op.status)) return;
            const destinations = TERMINAL_ROUTES[op.terminal];
            if (!destinations) return;
            const key = `${op.terminal}→${destinations[0]}`;
            if (!map[key]) {
                map[key] = { origin: op.terminal, destination: destinations[0], activeOps: 0, totalGallons: 0, trucks: [] };
            }
            map[key].activeOps++;
            map[key].totalGallons += op.gallons;
            if (!map[key].trucks.includes(op.truck)) map[key].trucks.push(op.truck);
        });
        return Object.values(map).sort((a, b) => b.activeOps - a.activeOps);
    }, [operations]);

    const globalStats = useMemo(() => {
        const activeTrucks = new Set(
            operations.filter(o => ACTIVE_STATUSES.includes(o.status)).map(o => o.truck)
        );
        const volumeInTransit = operations
            .filter(o => ACTIVE_STATUSES.includes(o.status))
            .reduce((acc, o) => acc + o.gallons, 0);
        return {
            total: operations.length,
            activeTrucks: activeTrucks.size,
            volumeInTransit: Math.round(volumeInTransit),
            statusCounts: STATUS_ORDER.reduce((acc, s) => {
                acc[s] = operationsByStatus[s].length;
                return acc;
            }, {} as Record<OperationStatus, number>),
        };
    }, [operations, operationsByStatus]);

    return { operations, operationsByStatus, terminalStats, routeStats, globalStats, loading, statusOrder: STATUS_ORDER };
};
