import { useMemo } from 'react';
import { useSales } from './useSales';
import { useCompany } from '../context/CompanyContext';

export type OperationStatus = 'INTENTION' | 'APPROVED' | 'LOADING' | 'ON TRACK' | 'BOL UPDATED' | 'POD PENDING' | 'DONE';

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

export interface OperationsByStatus {
    [key in OperationStatus]: Operation[];
}

const STATUS_ORDER: OperationStatus[] = ['INTENTION', 'APPROVED', 'LOADING', 'ON TRACK', 'BOL UPDATED', 'POD PENDING', 'DONE'];

export const useOperations = () => {
    const { selectedCompanyId } = useCompany();
    const { sales, loading } = useSales();

    const operationsByStatus = useMemo(() => {
        const grouped: OperationsByStatus = {
            INTENTION: [],
            APPROVED: [],
            LOADING: [],
            'ON TRACK': [],
            'BOL UPDATED': [],
            'POD PENDING': [],
            DONE: [],
        };

        sales.forEach(sale => {
            const operation: Operation = {
                id: sale.id,
                date: sale.date,
                product: sale.product,
                customer: sale.customer,
                truck: sale.truck,
                trailer: sale.trailer,
                bol: sale.bol,
                status: sale.status as OperationStatus,
                netBarrels: sale.netBarrels,
                gallons: sale.gallons,
                totalSale: sale.totalSale,
                rate: sale.rate,
                terminal: sale.terminal,
                carrier: sale.carrier,
            };

            const statusKey = sale.status as OperationStatus;
            if (statusKey in grouped) {
                grouped[statusKey].push(operation);
            }
        });

        // Sort operations within each status by date (newest first)
        Object.keys(grouped).forEach(status => {
            grouped[status as OperationStatus].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        });

        return grouped;
    }, [sales]);

    const stats = useMemo(() => {
        return {
            total: sales.length,
            intention: operationsByStatus.INTENTION.length,
            approved: operationsByStatus.APPROVED.length,
            loading: operationsByStatus.LOADING.length,
            onTrack: operationsByStatus['ON TRACK'].length,
            bolUpdated: operationsByStatus['BOL UPDATED'].length,
            podPending: operationsByStatus['POD PENDING'].length,
            done: operationsByStatus.DONE.length,
        };
    }, [operationsByStatus, sales.length]);

    return {
        operationsByStatus,
        stats,
        loading,
        statusOrder: STATUS_ORDER,
    };
};
