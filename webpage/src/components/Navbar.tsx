import { useState, useEffect } from 'react';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-6 py-3 flex items-center justify-between w-[95%] max-w-6xl ${scrolled
                ? 'bg-[#F2F0E9]/90 backdrop-blur-md text-[#076633] border border-[#1A1A1A]/10 shadow-lg'
                : 'bg-transparent text-[#F2F0E9]'
                }`}
        >
            <div className="flex items-center gap-6">
                <img
                    src="/logo-blanco.png"
                    alt="ORKA MEXICO"
                    className={`h-8 object-contain transition-all duration-500 ${scrolled ? 'invert brightness-0 sepia hue-rotate-180 saturate-[2]' : ''}`}
                // We apply a filter hack to turn the white logo somewhat dark when scrolled, 
                // but if we need exact #076633 we might need an SVG. For now we use the white logo.
                />
                <span className="font-outfit font-bold text-xl tracking-tight hidden sm:block">ORKA MEXICO</span>
            </div>

            <div className="hidden md:flex items-center gap-8 font-jakarta text-sm font-semibold">
                <a href="#diagnostics" className="hover:text-[#CC5833] transition-colors duration-300">Servicios</a>
                <a href="#telemetry" className="hover:text-[#CC5833] transition-colors duration-300">Productos</a>
                <a href="#manifesto" className="hover:text-[#CC5833] transition-colors duration-300">Manifiesto</a>
            </div>

            <button
                className={`px-6 py-2.5 rounded-full font-jakarta text-sm font-bold transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97] ${scrolled
                    ? 'bg-[#CC5833] text-[#F2F0E9] shadow-md'
                    : 'bg-[#F2F0E9] text-[#1A1A1A]'
                    }`}
            >
                Reserva una llamada
            </button>
        </nav>
    );
}
