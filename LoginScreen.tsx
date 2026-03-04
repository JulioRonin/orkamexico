import React, { useState } from 'react';
import logoBlanco from './logo/ORKA MEXICO/ORKA-MEXICO-BLANCO.png';

export type UserRole = 'ADMIN' | 'VENTAS' | 'CREDITO' | 'OPERACIONES';

interface LoginScreenProps {
    onLogin: (role: UserRole) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const roles = [
        { id: 'ADMIN' as UserRole, label: 'Admin', icon: 'grid_view', color: 'from-slate-700 to-slate-900', description: 'Acceso Total al Sistema' },
        { id: 'OPERACIONES' as UserRole, label: 'Operaciones', icon: 'hub', color: 'from-zinc-700 to-zinc-900', description: 'Flota & Logística' },
        { id: 'CREDITO' as UserRole, label: 'Crédito', icon: 'account_balance', color: 'from-stone-700 to-stone-900', description: 'Finanzas & Cartera' },
        { id: 'VENTAS' as UserRole, label: 'Ventas', icon: 'trending_up', color: 'from-neutral-700 to-neutral-900', description: 'Comercial & CRM' },
    ];

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock authentication - any password works for demo
        if (selectedRole && password) {
            onLogin(selectedRole);
        } else {
            setError(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-4xl px-6 relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center mb-12">
                    <img src={logoBlanco} alt="ORKA MEXICO" className="h-16 mb-4 drop-shadow-2xl" />
                </div>

                {!selectedRole ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-8 duration-500">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className="group relative glass-panel bg-white/[0.03] border border-white/5 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} border border-white/10 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'wght' 300" }}>{role.icon}</span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">{role.label}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed">{role.description}</p>
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white/40 text-sm">arrow_forward</span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto animate-in slide-in-from-right-8 duration-500">
                        <div className="glass-panel bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
                            <button
                                onClick={() => setSelectedRole(null)}
                                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs mb-6 group"
                            >
                                <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
                                Volver a Roles
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roles.find(r => r.id === selectedRole)?.color} border border-white/10 flex items-center justify-center shadow-lg`}>
                                    <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'wght' 300" }}>{roles.find(r => r.id === selectedRole)?.icon}</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white leading-none">{roles.find(r => r.id === selectedRole)?.label}</h2>
                                    <p className="text-gray-400 text-xs mt-1">Ingresa tus credenciales</p>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 ml-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-700"
                                        placeholder="••••••••"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">Por favor ingresa una contraseña</p>
                                )}

                                <button
                                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors shadow-lg active:scale-95 transform"
                                >
                                    Iniciar Sesión
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">
                        © 2026 ORKA MEXICO • INTERNAL PORTAL
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
