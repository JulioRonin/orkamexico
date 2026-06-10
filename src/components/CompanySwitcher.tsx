import React from 'react';
import { useCompany } from '../context/CompanyContext';

const COMPANIES = [
    { id: 'c44e7cb7-61e0-4f06-972c-c2f7c0d49f30', name: 'ORKA MEXICO', country: 'México' },
    { id: '68d09578-0ca2-4040-a673-f97a30fd3acb', name: 'ORKA OLEO GROUP', country: 'USA' },
];

export const CompanySwitcher = () => {
    const { selectedCompanyId, setSelectedCompany } = useCompany();
    const currentCompany = COMPANIES.find(c => c.id === selectedCompanyId);

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm font-medium text-white">
                <span className="material-symbols-outlined text-base">apartment</span>
                {currentCompany?.name}
                <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>

            {/* Dropdown */}
            <div className="absolute top-full mt-1 left-0 min-w-[220px] bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                {COMPANIES.map(company => (
                    <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company.id, company.name)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/10 transition ${
                            selectedCompanyId === company.id ? 'bg-primary/20 text-primary' : 'text-gray-300'
                        }`}
                    >
                        <div>
                            <div className="font-semibold text-sm">{company.name}</div>
                            <div className="text-xs text-gray-500">{company.country}</div>
                        </div>
                        {selectedCompanyId === company.id && (
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CompanySwitcher;
