import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export interface ClientBalance {
    clientId: string;
    client: string;
    creditLimit: number;
    totalBilled: number;
    totalPaid: number;
    balanceDue: number;
    creditAvailable: number;
    lastSaleDate: string | null;
    status: 'Active' | 'Blocked';
}

export const useClientBalances = () => {
    const [balances, setBalances] = useState<ClientBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalances = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: dbError } = await supabase
                .from('v_client_balances')
                .select('*')
                .or('credit_limit.gt.0,balance_due.gt.0')
                .order('balance_due', { ascending: false });

            if (dbError) throw dbError;

            const mapped: ClientBalance[] = (data || []).map((row: any) => ({
                clientId: row.client_id,
                client: row.client_name,
                creditLimit: Number(row.credit_limit) || 0,
                totalBilled: Number(row.total_billed) || 0,
                totalPaid: Number(row.total_paid) || 0,
                balanceDue: Number(row.balance_due) || 0,
                creditAvailable: Number(row.credit_available) || 0,
                lastSaleDate: row.last_sale_date,
                status: Number(row.balance_due) > Number(row.credit_limit) ? 'Blocked' : 'Active',
            }));

            setBalances(mapped);
        } catch (err) {
            console.error('useClientBalances error:', err);
            setError('No se pudo cargar balances');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBalances(); }, [fetchBalances]);

    return { balances, loading, error, refetch: fetchBalances };
};
