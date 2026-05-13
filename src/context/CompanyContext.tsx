import React, { createContext, useContext, useState } from 'react';

interface CompanyContextType {
    selectedCompanyId: string;
    selectedCompanyName: string;
    setSelectedCompany: (id: string, name: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedCompanyId, setSelectedCompanyId] = useState('c44e7cb7-61e0-4f06-972c-c2f7c0d49f30');
    const [selectedCompanyName, setSelectedCompanyName] = useState('ORKA MEXICO');

    const setSelectedCompany = (id: string, name: string) => {
        setSelectedCompanyId(id);
        setSelectedCompanyName(name);
    };

    return (
        <CompanyContext.Provider value={{ selectedCompanyId, selectedCompanyName, setSelectedCompany }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within CompanyProvider');
    }
    return context;
};
