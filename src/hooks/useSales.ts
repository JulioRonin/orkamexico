import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../../supabaseService';
import type { Sale } from '../../supabaseService';
import { salesData as fallbackData } from '../../data';

export const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSales = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await supabaseService.getSales();
            setSales(data);
        } catch (err) {
            console.error('useSales error:', err);
            setError('No se pudo cargar ventas');
            setSales(fallbackData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    return { sales, setSales, loading, error, refetch: fetchSales };
};
