import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import { useCompany } from '../context/CompanyContext';

export interface CobranzaSale {
    id: string;
    date: string;
    product: string;
    customer: string;
    customerId: string;
    bol: string;
    truck: string;
    gallons: number;
    rate: number;
    total: number;
    unitCost: number;
    margin: number;
    status: string;
}

export interface CobranzaPayment {
    id: string;
    date: string;
    customer: string;
    customerId: string;
    amount: number;
    bankRef?: string;
    notes?: string;
}

export interface MonthlyRow {
    month: string;      // "2025-01"
    label: string;      // "Ene 2025"
    sales: number;
    payments: number;
    net: number;
    running: number;
}

export interface CustomerSummary {
    customerId: string;
    customer: string;
    totalSales: number;
    totalPaid: number;
    balance: number;
    lastPaymentDate: string;
    lastPaymentAmount: number;
    salesCount: number;
    paymentsCount: number;
    products: string[];
}

export interface AgingBucket {
    label: string;
    days: string;
    amount: number;
    color: string;
}

const MONTH_LABELS: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

const fmtMonth = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${MONTH_LABELS[m]} ${y}`;
};

export const useCobranza = () => {
    const { selectedCompanyId } = useCompany();
    const [sales, setSales] = useState<CobranzaSale[]>([]);
    const [payments, setPayments] = useState<CobranzaPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const salesQuery = supabase
                    .from('sales')
                    .select(`
                        id, sale_date, gallons, rate, total_sale, unit_cost, bol_number,
                        truck_number, status,
                        product:products(name),
                        customer:partners!sales_customer_id_fkey(id, name)
                    `)
                    .gte('sale_date', '2025-01-01')
                    .order('sale_date', { ascending: false });

                const paymentsQuery = supabase
                    .from('payments')
                    .select(`
                        id, payment_date, amount, bank_reference, notes,
                        customer:partners!payments_customer_id_fkey(id, name)
                    `)
                    .order('payment_date', { ascending: false });

                if (selectedCompanyId) {
                    salesQuery.eq('company_id', selectedCompanyId);
                    paymentsQuery.eq('company_id', selectedCompanyId);
                }

                const [{ data: sd }, { data: pd }] = await Promise.all([salesQuery, paymentsQuery]);

                setSales((sd || []).map((s: any) => ({
                    id: s.id,
                    date: s.sale_date,
                    product: s.product?.name || '—',
                    customer: s.customer?.name || '—',
                    customerId: s.customer?.id || '',
                    bol: s.bol_number || '—',
                    truck: s.truck_number || '—',
                    gallons: Number(s.gallons) || 0,
                    rate: Number(s.rate) || 0,
                    total: Number(s.total_sale) || 0,
                    unitCost: Number(s.unit_cost) || 0,
                    margin: (Number(s.rate) - Number(s.unit_cost)) * Number(s.gallons),
                    status: s.status || '—',
                })));

                setPayments((pd || []).map((p: any) => ({
                    id: p.id,
                    date: p.payment_date,
                    customer: p.customer?.name || '—',
                    customerId: p.customer?.id || '',
                    amount: Number(p.amount) || 0,
                    bankRef: p.bank_reference || undefined,
                    notes: p.notes || undefined,
                })));
            } catch (e) {
                console.error('useCobranza:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedCompanyId]);

    // ── Per-customer summaries ────────────────────────────────────────────────
    const customerSummaries = useMemo((): CustomerSummary[] => {
        const map: Record<string, CustomerSummary> = {};

        sales.forEach(s => {
            if (!map[s.customerId]) {
                map[s.customerId] = {
                    customerId: s.customerId,
                    customer: s.customer,
                    totalSales: 0, totalPaid: 0, balance: 0,
                    lastPaymentDate: '', lastPaymentAmount: 0,
                    salesCount: 0, paymentsCount: 0, products: [],
                };
            }
            map[s.customerId].totalSales += s.total;
            map[s.customerId].salesCount++;
            if (!map[s.customerId].products.includes(s.product))
                map[s.customerId].products.push(s.product);
        });

        payments.forEach(p => {
            if (!map[p.customerId]) {
                map[p.customerId] = {
                    customerId: p.customerId,
                    customer: p.customer,
                    totalSales: 0, totalPaid: 0, balance: 0,
                    lastPaymentDate: '', lastPaymentAmount: 0,
                    salesCount: 0, paymentsCount: 0, products: [],
                };
            }
            map[p.customerId].totalPaid += p.amount;
            map[p.customerId].paymentsCount++;
            if (!map[p.customerId].lastPaymentDate || p.date > map[p.customerId].lastPaymentDate) {
                map[p.customerId].lastPaymentDate = p.date;
                map[p.customerId].lastPaymentAmount = p.amount;
            }
        });

        return Object.values(map).map(c => ({
            ...c,
            balance: c.totalSales - c.totalPaid,
        })).sort((a, b) => b.balance - a.balance);
    }, [sales, payments]);

    // ── Monthly table (2025 onwards, grouped by month) ────────────────────────
    const monthlyRows = useMemo((): MonthlyRow[] => {
        const salesMap: Record<string, number> = {};
        const paymentsMap: Record<string, number> = {};

        sales.forEach(s => {
            const ym = s.date.substring(0, 7);
            salesMap[ym] = (salesMap[ym] || 0) + s.total;
        });

        payments
            .filter(p => p.date >= '2025-01-01')
            .forEach(p => {
                const ym = p.date.substring(0, 7);
                paymentsMap[ym] = (paymentsMap[ym] || 0) + p.amount;
            });

        const months = Array.from(new Set([...Object.keys(salesMap), ...Object.keys(paymentsMap)]))
            .sort();

        let running = 0;
        return months.map(ym => {
            const s = salesMap[ym] || 0;
            const p = paymentsMap[ym] || 0;
            const net = s - p;
            running += net;
            return { month: ym, label: fmtMonth(ym), sales: s, payments: p, net, running };
        });
    }, [sales, payments]);

    // ── Aging buckets (estimated, based on monthly net) ───────────────────────
    const agingBuckets = useMemo((): AgingBucket[] => {
        const today = new Date();
        const buckets = [
            { label: 'Corriente', days: '0–30d', color: '#22c55e', amount: 0 },
            { label: '31–60 días', days: '31–60d', color: '#eab308', amount: 0 },
            { label: '61–90 días', days: '61–90d', color: '#f97316', amount: 0 },
            { label: '+90 días', days: '+90d', color: '#ef4444', amount: 0 },
        ];

        monthlyRows.forEach(row => {
            if (row.net <= 0) return;
            const monthEnd = new Date(`${row.month}-28`);
            const diff = Math.floor((today.getTime() - monthEnd.getTime()) / 86400000);
            if (diff <= 30) buckets[0].amount += row.net;
            else if (diff <= 60) buckets[1].amount += row.net;
            else if (diff <= 90) buckets[2].amount += row.net;
            else buckets[3].amount += row.net;
        });

        return buckets;
    }, [monthlyRows]);

    return {
        sales, payments, customerSummaries, monthlyRows, agingBuckets, loading,
    };
};
