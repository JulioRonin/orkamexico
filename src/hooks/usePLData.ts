import { useMemo } from 'react';
import { useSales } from './useSales';
import { useCompany } from '../context/CompanyContext';

export interface PLMetrics {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMargin: number;
    count: number;
    volumeGallons: number;
    averageRate: number;
}

export interface PLBreakdown {
    name: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    margin: number;
    volume: number;
}

export interface PLTrendPoint {
    date: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
}

export const usePLData = (timeframe: 'daily' | 'weekly' | 'monthly' | 'ytd' = 'monthly') => {
    const { selectedCompanyId } = useCompany();
    const { sales, loading } = useSales();

    const metrics = useMemo(() => {
        const validSales = sales.filter(s => s.unitCost && s.unitCost > 0);

        const revenue = validSales.reduce((acc, s) => acc + (s.totalSale || 0), 0);
        const cogs = validSales.reduce((acc, s) => acc + ((s.unitCost || 0) * (s.netBarrels || 0)), 0);
        const grossProfit = revenue - cogs;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const volumeGallons = validSales.reduce((acc, s) => acc + (s.gallons || 0), 0);
        const averageRate = validSales.length > 0 ? validSales.reduce((acc, s) => acc + (s.rate || 0), 0) / validSales.length : 0;

        return {
            revenue: Math.round(revenue * 100) / 100,
            cogs: Math.round(cogs * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            grossMargin: Math.round(grossMargin * 100) / 100,
            count: validSales.length,
            volumeGallons: Math.round(volumeGallons),
            averageRate: Math.round(averageRate * 100) / 100,
        } as PLMetrics;
    }, [sales]);

    const productBreakdown = useMemo(() => {
        const byProduct: Record<string, { revenue: number; cogs: number; volume: number }> = {};

        sales.forEach(s => {
            if (!s.unitCost || s.unitCost === 0) return;
            if (!byProduct[s.product]) {
                byProduct[s.product] = { revenue: 0, cogs: 0, volume: 0 };
            }
            byProduct[s.product].revenue += s.totalSale || 0;
            byProduct[s.product].cogs += (s.unitCost || 0) * (s.netBarrels || 0);
            byProduct[s.product].volume += s.gallons || 0;
        });

        return Object.entries(byProduct).map(([name, data]) => ({
            name,
            revenue: Math.round(data.revenue * 100) / 100,
            cogs: Math.round(data.cogs * 100) / 100,
            grossProfit: Math.round((data.revenue - data.cogs) * 100) / 100,
            margin: data.revenue > 0 ? Math.round(((data.revenue - data.cogs) / data.revenue) * 10000) / 100 : 0,
            volume: Math.round(data.volume),
        })) as PLBreakdown[];
    }, [sales]);

    const customerBreakdown = useMemo(() => {
        const byCustomer: Record<string, { revenue: number; cogs: number; volume: number }> = {};

        sales.forEach(s => {
            if (!s.unitCost || s.unitCost === 0) return;
            if (!byCustomer[s.customer]) {
                byCustomer[s.customer] = { revenue: 0, cogs: 0, volume: 0 };
            }
            byCustomer[s.customer].revenue += s.totalSale || 0;
            byCustomer[s.customer].cogs += (s.unitCost || 0) * (s.netBarrels || 0);
            byCustomer[s.customer].volume += s.gallons || 0;
        });

        return Object.entries(byCustomer)
            .map(([name, data]) => ({
                name,
                revenue: Math.round(data.revenue * 100) / 100,
                cogs: Math.round(data.cogs * 100) / 100,
                grossProfit: Math.round((data.revenue - data.cogs) * 100) / 100,
                margin: data.revenue > 0 ? Math.round(((data.revenue - data.cogs) / data.revenue) * 10000) / 100 : 0,
                volume: Math.round(data.volume),
            }))
            .sort((a, b) => b.revenue - a.revenue) as PLBreakdown[];
    }, [sales]);

    const trend = useMemo(() => {
        const byDate: Record<string, { revenue: number; cogs: number }> = {};

        sales.forEach(s => {
            if (!s.unitCost || s.unitCost === 0) return;
            if (!byDate[s.date]) {
                byDate[s.date] = { revenue: 0, cogs: 0 };
            }
            byDate[s.date].revenue += s.totalSale || 0;
            byDate[s.date].cogs += (s.unitCost || 0) * (s.netBarrels || 0);
        });

        return Object.entries(byDate)
            .map(([date, data]) => ({
                date,
                revenue: Math.round(data.revenue * 100) / 100,
                cogs: Math.round(data.cogs * 100) / 100,
                grossProfit: Math.round((data.revenue - data.cogs) * 100) / 100,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)) as PLTrendPoint[];
    }, [sales]);

    return {
        metrics,
        productBreakdown,
        customerBreakdown,
        trend,
        loading,
    };
};
