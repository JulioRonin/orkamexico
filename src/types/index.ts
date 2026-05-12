// Shared types for the ORKA application

export type { Sale } from '../../data';
export type { UserRole } from '../../LoginScreen';

export interface Partner {
    id: string;
    name: string;
    type: 'Client' | 'Supplier' | 'Carrier';
    rfc: string;
    legalName?: string;
    fiscalAddress?: string;
    zipCode?: string;
    fiscalRegime?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    creditLimit?: number;
    creditAvailable?: number;
    isActive?: boolean;
}

export interface CFDIData {
    serie?: string;
    folio?: string;
    issuerRFC: string;
    issuerName: string;
    receiverRFC: string;
    receiverName: string;
    receiverZipCode?: string;
    receiverFiscalRegime?: string;
    cfdiUse: string;
    paymentMethod: string;
    paymentForm: string;
    items: CFDIItem[];
    subtotal: number;
    iva: number;
    total: number;
    issueDate: string;
}

export interface CFDIItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    productCode?: string;
    unitCode?: string;
}
