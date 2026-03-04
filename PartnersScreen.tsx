import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from './supabaseService';

interface Partner {
    id: string;
    name: string;
    type: 'Client' | 'Supplier' | 'Carrier';
    status: 'Active' | 'Inactive';
    contact: string;
    email: string;
    rfc?: string;
    legalName?: string;
    fiscalAddress?: string;
    zipCode?: string;
    fiscalRegime?: string;
}

const PartnersScreen = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'clients' | 'carriers' | 'suppliers'>('clients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [partners, setPartners] = useState<Partner[]>([]);

    const loadPartners = async () => {
        try {
            setLoading(true);
            const data = await supabaseService.getAllPartners();
            setPartners(data as Partner[]);
        } catch (error) {
            console.error('Error loading partners:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPartners();
    }, []);

    const displayedPartners = useMemo(() => {
        const typeMap = {
            'clients': 'Client',
            'carriers': 'Carrier',
            'suppliers': 'Supplier'
        };
        const currentType = typeMap[activeTab];

        return partners.filter(p => p.type === currentType).filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.rfc && p.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [activeTab, partners, searchTerm]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const typeMap = {
            'clients': 'Client',
            'carriers': 'Carrier',
            'suppliers': 'Supplier'
        };
        const type = typeMap[activeTab] as 'Client' | 'Supplier' | 'Carrier';

        const partnerData = {
            name: formData.get('name') as string,
            type: type,
            status: formData.get('status') as 'Active' | 'Inactive',
            contact: formData.get('contact') as string,
            email: formData.get('email') as string,
            rfc: formData.get('rfc') as string,
            legal_name: formData.get('legalName') as string,
            fiscal_address: formData.get('fiscalAddress') as string,
            zip_code: formData.get('zipCode') as string,
            fiscal_regime: formData.get('fiscalRegime') as string,
        };

        try {
            if (currentPartner) {
                await supabaseService.updatePartner(currentPartner.id, partnerData);
            } else {
                await supabaseService.createPartner(partnerData);
            }
            await loadPartners();
            setIsModalOpen(false);
            setCurrentPartner(null);
        } catch (error) {
            console.error('Error saving partner:', error);
            alert('Error al guardar socio');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este socio?')) return;
        try {
            await supabaseService.deletePartner(id);
            await loadPartners();
        } catch (error) {
            console.error('Error deleting partner:', error);
            alert('Error al eliminar socio');
        }
    };

    const getTabLabel = () => {
        if (activeTab === 'clients') return 'Cliente';
        if (activeTab === 'carriers') return 'Transportista';
        return 'Proveedor';
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark pb-32 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-center">
                <div className="w-full max-w-5xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-all active:scale-95 group">
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Socios Comerciales</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Gestión de Clientes, Transportistas y Proveedores</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setCurrentPartner(null); setIsModalOpen(true); }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span className="hidden sm:inline">Nuevo {getTabLabel()}</span>
                    </button>
                </div>
            </header>

            <main className="px-6 pt-8 w-full max-w-5xl mx-auto">
                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex flex-wrap bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'clients' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Clientes
                        </button>
                        <button
                            onClick={() => setActiveTab('carriers')}
                            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'carriers' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Transportistas
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'suppliers' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Proveedores
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64 group">
                        <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-500 group-focus-within:text-white transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:bg-black/40 focus:border-white/20 transition-all"
                        />
                    </div>
                </div>

                {/* List View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedPartners.map(partner => (
                        <div key={partner.id} className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#1a1a1a]/60 hover:bg-[#1a1a1a]/80 transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${partner.status === 'Active' ? 'bg-green-500' : 'bg-gray-600'}`}></div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold 
                                        ${partner.type === 'Client' ? 'bg-blue-500/10 text-blue-400' :
                                            partner.type === 'Carrier' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        {partner.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white leading-tight">{partner.name}</h3>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500">{partner.type}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setCurrentPartner(partner); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(partner.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    {partner.contact}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                    {partner.email}
                                </div>
                                {partner.rfc && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span className="material-symbols-outlined text-sm">badge</span>
                                        {partner.rfc}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${partner.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                    {partner.status === 'Active' ? 'Activo' : 'Inactivo'}
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono">ID: {partner.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white">
                                {currentPartner ? 'Editar' : 'Nuevo'} {getTabLabel()}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Nombre Comercial</label>
                                    <input name="name" defaultValue={currentPartner?.name} required className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                                        Razón Social <span className="text-[10px] text-gray-500 font-normal normal-case">(Información Fiscal)</span>
                                    </label>
                                    <input name="legalName" defaultValue={currentPartner?.legalName} placeholder="Ej. Empresa S.A. de C.V." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">RFC</label>
                                    <input name="rfc" defaultValue={currentPartner?.rfc} placeholder="XAXX010101000" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none font-mono uppercase" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Régimen Fiscal</label>
                                    <input name="fiscalRegime" defaultValue={currentPartner?.fiscalRegime} placeholder="601" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Dirección Fiscal</label>
                                    <input name="fiscalAddress" defaultValue={currentPartner?.fiscalAddress} placeholder="Calle, Número, Colonia..." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Código Postal</label>
                                    <input name="zipCode" defaultValue={currentPartner?.zipCode} placeholder="00000" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Estatus</label>
                                    <select name="status" defaultValue={currentPartner?.status || 'Active'} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                                        <option value="Active">Activo</option>
                                        <option value="Inactive">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-white/5 my-2" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Contacto</label>
                                    <input name="contact" defaultValue={currentPartner?.contact} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Email</label>
                                    <input name="email" defaultValue={currentPartner?.email} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg transition-colors">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnersScreen;
