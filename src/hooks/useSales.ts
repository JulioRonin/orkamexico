import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../../supabaseService';
import { useCompany } from '../context/CompanyContext';
import type { Sale } from '../../supabaseService';
import { salesData as fallbackData } from '../../data';

export const useSales = () => {
    const { selectedCompanyId } = useCompany();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSales = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await supabaseService.getSales(selectedCompanyId);
            setSales(data);
        } catch (err) {
            console.error('useSales error:', err);
            setError('No se pudo cargar ventas');
            setSales(fallbackData);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    return { sales, setSales, loading, error, refetch: fetchSales };
};
