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

export interface PartnerBalance {
    id: string;
    name: string;
    creditLimit: number;
    creditAvailable: number;
    balance: number;        // credit_limit - credit_available (positive = client owes ORKA)
    isDebtor: boolean;      // balance > 0
}

export interface AgingBucket {
    label: string;
    days: string;
    amount: number;
    color: string;
}

// Outstanding DUE invoices from Airtable Balance_de_Creditos
// These clients have $0 in the partners table but have overdue invoices
export const DUE_INVOICE_ALERTS = [
    { name: 'CIAY - RAIL', amount: 388530.80, note: 'Facturas vencidas sin cobrar (railcar)' },
    { name: 'CAZBER',       amount: 161529.44, note: 'Facturas parciales vencidas' },
] as const;

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
    const [partnerBalances, setPartnerBalances] = useState<PartnerBalance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Sales from 2025 onwards (for Operaciones display)
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

                // All payments (no date filter) for accurate Cobros display
                const paymentsQuery = supabase
                    .from('payments')
                    .select(`
                        id, payment_date, amount, bank_reference, notes,
                        customer:partners!payments_customer_id_fkey(id, name)
                    `)
                    .gte('payment_date', '2025-01-01')
                    .order('payment_date', { ascending: false });

                // All partners with non-zero balances — source of truth for AR
                const partnersQuery = supabase
                    .from('partners')
                    .select('id, name, credit_limit, credit_available')
                    .neq('name', 'DUMMY CLIENT')
                    .order('name');

                if (selectedCompanyId) {
                    salesQuery.eq('company_id', selectedCompanyId);
                    paymentsQuery.eq('company_id', selectedCompanyId);
                }

                const [
                    { data: sd },
                    { data: pd },
                    { data: partners },
                ] = await Promise.all([salesQuery, paymentsQuery, partnersQuery]);

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

                // Build partner balances — deduplicate by keeping the record with highest |balance|
                const seen = new Map<string, PartnerBalance>();
                (partners || []).forEach((p: any) => {
                    const cl = Number(p.credit_limit) || 0;
                    const ca = Number(p.credit_available) || 0;
                    const balance = cl - ca;
                    if (Math.abs(balance) < 0.01) return; // skip zero-balance partners
                    const existing = seen.get(p.name);
                    if (!existing || Math.abs(balance) > Math.abs(existing.balance)) {
                        seen.set(p.name, {
                            id: p.id,
                            name: p.name,
                            creditLimit: cl,
                            creditAvailable: ca,
                            balance,
                            isDebtor: balance > 0,
                        });
                    }
                });

                // Sort: debtors first (highest balance), then creditors (most negative last)
                const sorted = Array.from(seen.values()).sort((a, b) => {
                    if (a.isDebtor !== b.isDebtor) return a.isDebtor ? -1 : 1;
                    return a.isDebtor
                        ? b.balance - a.balance
                        : a.balance - b.balance;
                });

                setPartnerBalances(sorted);
            } catch (e) {
                console.error('useCobranza:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedCompanyId]);

    // ── Monthly table (2025 onwards, grouped by month) ────────────────────────
    const monthlyRows = useMemo((): MonthlyRow[] => {
        const salesMap: Record<string, number> = {};
        const paymentsMap: Record<string, number> = {};

        sales.forEach(s => {
            const ym = s.date.substring(0, 7);
            salesMap[ym] = (salesMap[ym] || 0) + s.total;
        });

        payments.forEach(p => {
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

    // ── Aging buckets — based on ALPHA's monthly net (primary debtor) ─────────
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

    const totalDebtors = useMemo(
        () => partnerBalances.filter(p => p.isDebtor).reduce((a, p) => a + p.balance, 0),
        [partnerBalances],
    );
    const totalCreditors = useMemo(
        () => partnerBalances.filter(p => !p.isDebtor).reduce((a, p) => a + p.balance, 0),
        [partnerBalances],
    );

    return {
        sales,
        payments,
        partnerBalances,
        monthlyRows,
        agingBuckets,
        loading,
        totalDebtors,
        totalCreditors,
    };
};
