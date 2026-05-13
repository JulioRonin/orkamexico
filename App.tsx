import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Legacy components
import SalesForm from './SalesForm';
import SalesScreen from './SalesScreen';
import PartnersScreen from './PartnersScreen';
import LoginScreen, { UserRole } from './LoginScreen';

// Modular screens
import DashboardScreen from './src/screens/DashboardScreen';
import MonitorScreen from './src/screens/MonitorScreen';
import ComplianceScreen from './src/screens/ComplianceScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import PLScreen from './src/screens/PLScreen';
import OperationsScreen from './src/screens/OperationsScreen';

// Shared components & context
import BottomNav from './src/components/BottomNav';
import { CompanyProvider } from './src/context/CompanyContext';

const App = () => {
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    if (!userRole) {
        return <LoginScreen onLogin={setUserRole} />;
    }

    const handleLogout = () => setUserRole(null);

    const canViewHome = userRole === 'ADMIN' || userRole === 'CREDITO' || userRole === 'VENTAS';
    const canViewMonitor = userRole === 'ADMIN' || userRole === 'OPERACIONES' || userRole === 'VENTAS';
    const canViewFinance = userRole === 'ADMIN' || userRole === 'CREDITO';
    const canViewSalesAndPartners = userRole === 'ADMIN' || userRole === 'CREDITO' || userRole === 'VENTAS';

    return (
        <CompanyProvider>
            <Router>
                <div className="min-h-screen bg-background-dark">
                    <Routes>
                        {canViewHome && <Route path="/" element={<DashboardScreen />} />}
                        {canViewMonitor && <Route path="/monitor" element={<MonitorScreen />} />}
                        {canViewMonitor && <Route path="/operations" element={<OperationsScreen />} />}
                        <Route path="/compliance" element={<ComplianceScreen />} />
                        {canViewFinance && <Route path="/finance" element={<FinanceScreen />} />}
                        {canViewFinance && <Route path="/pl" element={<PLScreen />} />}
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
        </CompanyProvider>
    );
};

export default App;
