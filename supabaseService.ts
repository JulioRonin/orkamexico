import { supabase } from './supabase'

export interface Sale {
    id: string;
    date: string;
    product: string;
    terminal: string;
    carrier: string;
    truck: string;
    trailer: string;
    status: 'DONE' | 'BOL UPDATED' | 'POD PENDING' | 'ON TRACK' | 'LOADING' | 'APPROVED' | 'INTENTION';
    bol: string;
    netBarrels: number;
    gallons: number;
    customer: string;
    rate: number;
    totalSale: number;
    unitCost?: number;
    invoiced?: boolean;
    paidAmount?: number;
    paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
    paymentDate?: string;
}

export const supabaseService = {
    async getSales() {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                customer:partners!sales_customer_id_fkey(name),
                product:products(name),
                carrier:partners!sales_carrier_id_fkey(name)
            `)
            .order('date', { ascending: false });

        if (error) throw error;

        // Map Supabase relational data back to the flat Sale interface
        return data.map((s: any) => ({
            ...s,
            customer: s.customer?.name || 'Unknown',
            product: s.product?.name || 'Unknown',
            carrier: s.carrier?.name || 'Unknown',
        })) as Sale[];
    },

    async getPartners(type?: 'Client' | 'Supplier' | 'Carrier') {
        let query = supabase.from('partners').select('*');
        if (type) query = query.eq('type', type);

        const { data, error } = await query.order('name');
        if (error) throw error;
        return data;
    },

    async getProducts() {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) throw error;
        return data;
    },

    async createSale(sale: any) {
        const { data, error } = await supabase.from('sales').insert([sale]).select();
        if (error) throw error;
        return data[0];
    },

    async updateSale(id: string, updates: any) {
        const { data, error } = await supabase.from('sales').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },

    async registerPayment(paymentData: {
        customerId: string,
        amount: number,
        date: string,
        saleIds: string[]
    }) {
        const { data: payment, error: pError } = await supabase
            .from('payments')
            .insert([{
                customer_id: paymentData.customerId,
                amount: paymentData.amount,
                payment_date: paymentData.date
            }])
            .select()
            .single();

        if (pError) throw pError;

        const applications = paymentData.saleIds.map(saleId => ({
            payment_id: payment.id,
            sale_id: saleId,
            amount_applied: 0
        }));

        const { error: aError } = await supabase.from('payment_applications').insert(applications);
        if (aError) throw aError;

        return payment;
    },

    async getAllPartners() {
        const { data, error } = await supabase.from('partners').select('*').order('name');
        if (error) throw error;
        return data.map((p: any) => ({
            ...p,
            legalName: p.legal_name,
            fiscalAddress: p.fiscal_address,
            zipCode: p.zip_code,
            fiscalRegime: p.fiscal_regime
        }));
    },

    async createPartner(partner: any) {
        const { data, error } = await supabase.from('partners').insert([partner]).select();
        if (error) throw error;
        return data[0];
    },

    async updatePartner(id: string, updates: any) {
        const { data, error } = await supabase.from('partners').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },

    async deletePartner(id: string) {
        const { error } = await supabase.from('partners').delete().eq('id', id);
        if (error) throw error;
    }
}
