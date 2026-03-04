export function Footer() {
    return (
        <footer className="bg-[#1A1A1A] text-[#F2F0E9] pt-20 pb-10 px-8 rounded-t-[3rem] md:rounded-t-[5rem] -mt-10 relative z-10 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="font-outfit text-4xl font-bold mb-6 tracking-tight">ORKA MEXICO</h2>
                        <p className="font-jakarta text-[#F2F0E9]/60 max-w-sm mb-8 leading-relaxed">
                            Algoritmos naturales aplicados a la comercialización premium de hidrocarburos. Elevando el estándar de la industria mediante precisión sistemática.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full border border-[#F2F0E9]/20 flex items-center justify-center hover:bg-[#F2F0E9]/10 transition-colors">
                                <span className="font-mono text-xs">IN</span>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full border border-[#F2F0E9]/20 flex items-center justify-center hover:bg-[#F2F0E9]/10 transition-colors">
                                <span className="font-mono text-xs">X</span>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-mono text-xs text-[#CC5833] uppercase tracking-widest mb-6 border-b border-[#F2F0E9]/10 pb-2">Plataforma</h4>
                        <ul className="space-y-4 font-jakarta text-sm">
                            <li><a href="#diagnostics" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Servicios</a></li>
                            <li><a href="#telemetry" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Productos</a></li>
                            <li><a href="#" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Suministro</a></li>
                            <li><a href="#" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Manifiesto</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-mono text-xs text-[#CC5833] uppercase tracking-widest mb-6 border-b border-[#F2F0E9]/10 pb-2">Operaciones</h4>
                        <ul className="space-y-4 font-jakarta text-sm">
                            <li><a href="#" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Login Interno</a></li>
                            <li><a href="#" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Portal Socios</a></li>
                            <li><a href="#" className="text-[#F2F0E9]/70 hover:text-white transition-colors">Reporte de Fallos</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#F2F0E9]/10">
                    <div className="font-mono text-[#F2F0E9]/40 text-xs tracking-wider mb-4 md:mb-0">
                        © 2026 ORKA MEXICO • INNOVACIÓN
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-[#F2F0E9]/5">
                        <div className="w-2 h-2 rounded-full bg-[#076633] shadow-[0_0_8px_#076633] animate-pulse" />
                        <span className="font-mono text-xs text-[#F2F0E9]/80 uppercase tracking-widest">Sistema operativo | Activo</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
