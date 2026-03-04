export function Pricing() {
    return (
        <section id="pricing" className="py-24 md:py-40 bg-[#E5E3DC]">
            <div className="max-w-6xl mx-auto px-8 md:px-16 text-center mb-16 md:mb-24">
                <h3 className="font-outfit text-4xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] mb-4">
                    Infraestructura a medida
                </h3>
                <p className="font-jakarta text-[#1A1A1A]/60 max-w-xl mx-auto">
                    Alineación exacta de nuestros módulos con las necesidades de tu estación. Escalabilidad desde el primer barril.
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Tier 1 */}
                <div className="bg-[#F2F0E9] rounded-3xl p-8 border border-[#1A1A1A]/10 shadow-sm relative group">
                    <div className="mb-6">
                        <h4 className="font-outfit text-xl font-bold text-[#1A1A1A]">Estándar</h4>
                        <p className="font-mono text-xs text-[#1A1A1A]/50 uppercase tracking-widest mt-1">Calibración base</p>
                    </div>
                    <p className="font-jakarta text-[#1A1A1A]/70 text-sm mb-8 leading-relaxed">
                        Diagnóstico trimestral y acceso básico al protocolo de suministro. Ideal para estaciones de etapa temprana.
                    </p>
                    <ul className="mb-8 space-y-3 font-jakarta text-sm font-medium text-[#1A1A1A]">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" /> Soporte asíncrono</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" /> Diagnóstico manual</li>
                        <li className="flex items-center gap-2 opacity-40"><div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" /> Telemetría premium</li>
                    </ul>
                    <button className="w-full py-3 rounded-xl border border-[#1A1A1A]/20 text-[#1A1A1A] font-bold text-sm tracking-wide hover:bg-[#1A1A1A]/5 transition-colors">
                        Configurar
                    </button>
                </div>

                {/* Tier 2 */}
                <div className="bg-[#076633] rounded-3xl p-10 shadow-2xl relative md:-translate-y-4">
                    <div className="absolute top-0 right-8 transform -translate-y-1/2">
                        <span className="bg-[#CC5833] text-[#F2F0E9] text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-widest">
                            Recomendado
                        </span>
                    </div>
                    <div className="mb-6">
                        <h4 className="font-outfit text-2xl font-bold text-[#F2F0E9]">Optimizado</h4>
                        <p className="font-mono text-xs text-[#F2F0E9]/60 uppercase tracking-widest mt-1">Motor Analítico Activado</p>
                    </div>
                    <p className="font-jakarta text-[#F2F0E9]/80 text-sm mb-8 leading-relaxed">
                        Control de flujo en tiempo real y asistencia inteligente en telemetría de hidrocarburos.
                    </p>
                    <ul className="mb-10 space-y-4 font-jakarta text-sm font-medium text-[#F2F0E9]">
                        <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#CC5833]" /> Soporte en vivo 24/7</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#CC5833]" /> Telemetría reactiva</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#CC5833]" /> Predicción de demanda</li>
                        <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#CC5833]" /> Gestión de flotilla</li>
                    </ul>
                    <button className="relative overflow-hidden w-full py-4 rounded-xl font-bold text-sm tracking-wide text-[#F2F0E9] group bg-[#CC5833]">
                        <span className="relative z-10 transition-transform group-hover:-translate-y-8 block">Iniciar despliegue</span>
                        <span className="absolute inset-0 z-10 flex items-center justify-center translate-y-8 group-hover:translate-y-0 transition-transform bg-[#B44B2A]">
                            Inicia ahora
                        </span>
                    </button>
                </div>

                {/* Tier 3 */}
                <div className="bg-[#F2F0E9] rounded-3xl p-8 border border-[#1A1A1A]/10 shadow-sm relative group">
                    <div className="mb-6">
                        <h4 className="font-outfit text-xl font-bold text-[#1A1A1A]">Red Masiva</h4>
                        <p className="font-mono text-xs text-[#1A1A1A]/50 uppercase tracking-widest mt-1">Ecosistema Completo</p>
                    </div>
                    <p className="font-jakarta text-[#1A1A1A]/70 text-sm mb-8 leading-relaxed">
                        Arquitectura paralela para multi-concesionarios. Integración directa con APIS de suministro.
                    </p>
                    <ul className="mb-8 space-y-3 font-jakarta text-sm font-medium text-[#1A1A1A]">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" /> Módulos blancos (White-label)</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" /> Base de datos dedicada</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" /> Equipo de ingeniería local</li>
                    </ul>
                    <button className="w-full py-3 rounded-xl border border-[#1A1A1A]/20 text-[#1A1A1A] font-bold text-sm tracking-wide hover:bg-[#1A1A1A] hover:text-[#F2F0E9] transition-colors">
                        Contactar ventas
                    </button>
                </div>
            </div>
        </section>
    );
}
