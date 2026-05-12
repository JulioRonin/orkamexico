import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Legacy components (still at root, will migrate later)
import SalesForm from './SalesForm';
import SalesScreen from './SalesScreen';
import PartnersScreen from './PartnersScreen';
import LoginScreen, { UserRole } from './LoginScreen';

// Modular screens (extracted from this file)
import DashboardScreen from './src/screens/DashboardScreen';
import MonitorScreen from './src/screens/MonitorScreen';
import ComplianceScreen from './src/screens/ComplianceScreen';
import FinanceScreen from './src/screens/FinanceScreen';

// Shared components
import BottomNav from './src/components/BottomNav';

// Data layer
import { salesData as initialSalesData, Sale } from './data';
import { supabaseService } from './supabaseService';

const App = () => {
    const [currentSales, setCurrentSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    useEffect(() => {
        if (!userRole) return;

        const loadInitialData = async () => {
            try {
                setLoading(true);
                const sales = await supabaseService.getSales();
                setCurrentSales(sales);
            } catch (error) {
                console.error('Error loading sales, falling back to mock data:', error);
                setCurrentSales(initialSalesData);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [userRole]);

    if (!userRole) {
        return <LoginScreen onLogin={setUserRole} />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm font-medium animate-pulse">Iniciando plataforma...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => setUserRole(null);

    const canViewHome = userRole === 'ADMIN' || userRole === 'CREDITO' || userRole === 'VENTAS';
    const canViewMonitor = userRole === 'ADMIN' || userRole === 'OPERACIONES' || userRole === 'VENTAS';
    const canViewFinance = userRole === 'ADMIN' || userRole === 'CREDITO';
    const canViewSalesAndPartners = userRole === 'ADMIN' || userRole === 'CREDITO' || userRole === 'VENTAS';

    return (
        <Router>
            <div className="min-h-screen bg-background-dark">
                <Routes>
                    {canViewHome && <Route path="/" element={<DashboardScreen />} />}
                    {canViewMonitor && <Route path="/monitor" element={<MonitorScreen />} />}
                    <Route path="/compliance" element={<ComplianceScreen />} />
                    {canViewFinance && (
                        <Route
                            path="/finance"
                            element={<FinanceScreen sales={currentSales} onUpdateSales={setCurrentSales} />}
                        />
                    )}
                    {canViewSalesAndPartners && (
                        <>
                            <Route path="/sales" element={<SalesScreen />} />
                            <Route path="/sales/new" element={<SalesForm />} />
                            <Route path="/partners" element={<PartnersScreen />} />
                        </>
                    )}
                    <Route
                        path="*"
                        element={userRole === 'OPERACIONES' ? <MonitorScreen /> : <DashboardScreen />}
                    />
                </Routes>
                <BottomNav role={userRole} onLogout={handleLogout} />
            </div>
        </Router>
    );
};

export default App;
