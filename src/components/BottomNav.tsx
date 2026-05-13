import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../../LoginScreen';

const BottomNav = ({ role, onLogout }: { role: UserRole, onLogout: () => void }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;
    const getIconClass = (path: string) => isActive(path) ? "text-primary" : "text-gray-400 hover:text-white";

    const navItems = [
        { path: '/', label: 'Home', icon: 'dashboard', roles: ['ADMIN', 'CREDITO', 'VENTAS'] },
        { path: '/monitor', label: 'Monitor', icon: 'radar', roles: ['ADMIN', 'OPERACIONES', 'VENTAS'] },
        { path: '/operations', label: 'Ops', icon: 'workflow', roles: ['ADMIN', 'OPERACIONES', 'VENTAS'] },
        { path: '/compliance', label: 'Docs', icon: 'description', roles: ['ADMIN', 'OPERACIONES', 'CREDITO', 'VENTAS'] },
        { path: '/ocr', label: 'OCR', icon: 'document_scanner', roles: ['ADMIN', 'VENTAS'] },
        { path: '/cobranza', label: 'Cobranza', icon: 'account_balance', roles: ['ADMIN', 'CREDITO'] },
        { path: '/finance', label: 'Finance', icon: 'payments', roles: ['ADMIN', 'CREDITO'] },
        { path: '/pl', label: 'P&L', icon: 'trending_up', roles: ['ADMIN', 'CREDITO'] },
        { path: '/sales', label: 'Sales', icon: 'point_of_sale', roles: ['ADMIN', 'CREDITO', 'VENTAS'] },
        { path: '/partners', label: 'Socios', icon: 'group', roles: ['ADMIN', 'CREDITO', 'VENTAS'] },
    ];

    const allowedItems = navItems.filter(item => item.roles.includes(role));

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-2xl px-6 pointer-events-auto">
                <div className="glass-panel backdrop-blur-md rounded-2xl p-2 flex justify-between items-center shadow-2xl border border-white/5 bg-[#171717]/90 min-h-[70px]">
                    <div className="flex justify-between items-center w-full px-2">
                        {allowedItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 hover:scale-110 ${getIconClass(item.path)} `}
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                            </button>
                        ))}

                        <div className="w-px h-8 bg-white/10 mx-2"></div>

                        <button
                            onClick={onLogout}
                            className="flex flex-col items-center gap-1 px-3 py-1 text-red-400 hover:text-red-300 transition-all hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-[22px]">logout</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav >
    );
};

export default BottomNav;
