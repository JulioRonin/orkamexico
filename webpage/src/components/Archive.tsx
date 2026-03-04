import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Archive() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.archive-card');

            cards.forEach((card: any, i) => {
                if (i === cards.length - 1) return; // Last card doesn't scale down

                gsap.to(card, {
                    scale: 0.9,
                    filter: "blur(20px)",
                    opacity: 0.5,
                    ease: "none",
                    scrollTrigger: {
                        trigger: cards[i + 1] as HTMLElement,
                        start: "top bottom",
                        end: "top top",
                        scrub: true,
                    }
                });
            });

            // Internal animations
            // 1. Helix / Gear
            gsap.to('.svg-gear', {
                rotation: 360,
                repeat: -1,
                duration: 15,
                ease: "linear",
            });

            // 2. Laser scan
            gsap.to('.svg-laser', {
                y: 200,
                repeat: -1,
                yoyo: true,
                duration: 2,
                ease: "power1.inOut"
            });

            // 3. EKG pulse
            gsap.to('.svg-ekg', {
                strokeDashoffset: -1000,
                repeat: -1,
                duration: 3,
                ease: "linear"
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative bg-[#1A1A1A]">
            {/* Card 1 */}
            <div className="archive-card sticky top-0 h-dvh w-full bg-[#E5E3DC] flex items-center justify-center overflow-hidden border-b border-[#1A1A1A]/10">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:20px_20px]" />

                <div className="max-w-5xl w-full px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
                    <div>
                        <div className="text-xs font-mono text-[#076633] uppercase tracking-widest mb-4">Módulo I</div>
                        <h3 className="font-outfit text-5xl md:text-7xl font-bold text-[#1A1A1A] mb-6 tracking-tight">Motor Analítico</h3>
                        <p className="font-jakarta text-lg text-[#1A1A1A]/70 text-balance">
                            Procesamiento continuo de variables de mercado. Cada decisión está respaldada por una arquitectura de datos que no descansa, girando como un reloj perfecto.
                        </p>
                    </div>
                    <div className="h-64 md:h-96 relative flex items-center justify-center">
                        {/* Gear SVG */}
                        <svg className="svg-gear w-64 h-64 text-[#076633]/20" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M96 42.5h-8.8a36.9 36.9 0 00-3.3-8.1l6.2-6.2a3.8 3.8 0 000-5.3L80.9 13.8a3.8 3.8 0 00-5.3 0l-6.2 6.2a36.9 36.9 0 00-8.1-3.3V7.9A3.8 3.8 0 0057.5 4h-15a3.8 3.8 0 00-3.8 3.9v8.8a36.9 36.9 0 00-8.1 3.3l-6.2-6.2a3.8 3.8 0 00-5.3 0L10 22.9a3.8 3.8 0 000 5.3l6.2 6.2a36.9 36.9 0 00-3.3 8.1H4.1A3.8 3.8 0 00.2 46.4v15a3.8 3.8 0 003.9 3.8h8.8a36.9 36.9 0 003.3 8.1l-6.2 6.2a3.8 3.8 0 000 5.3l9.2 9.1a3.8 3.8 0 005.3 0l6.2-6.2a36.9 36.9 0 008.1 3.3v8.8a3.8 3.8 0 003.8 3.9h15a3.8 3.8 0 003.8-3.9v-8.8a36.9 36.9 0 008.1-3.3l6.2 6.2a3.8 3.8 0 005.3 0l9.2-9.1a3.8 3.8 0 000-5.3l-6.2-6.2a36.9 36.9 0 003.3-8.1h8.8a3.8 3.8 0 003.9-3.8v-15a3.8 3.8 0 00-4-3.8zM50 71.3A21.3 21.3 0 1171.3 50 21.3 21.3 0 0150 71.3z" />
                        </svg>
                        <svg className="svg-gear absolute w-32 h-32 text-[#CC5833]/60" style={{ animationDirection: 'reverse', animationDuration: '10s' }} viewBox="0 0 100 100" fill="currentColor">
                            <path d="M50 21.3A28.7 28.7 0 1078.7 50 28.7 28.7 0 0050 21.3zm0 46A17.3 17.3 0 1167.3 50 17.3 17.3 0 0150 67.3z" />
                            <circle cx="50" cy="10" r="4" /><circle cx="50" cy="90" r="4" /><circle cx="90" cy="50" r="4" /><circle cx="10" cy="50" r="4" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Card 2 */}
            <div className="archive-card sticky top-0 h-dvh w-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden border-b border-[#F2F0E9]/5">
                <div className="max-w-5xl w-full px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
                    <div className="order-2 md:order-1 h-64 md:h-96 relative flex justify-center border border-[#F2F0E9]/10 rounded-[2rem] bg-black/50 overflow-hidden">
                        <div className="absolute inset-0 p-8 grid grid-cols-4 grid-rows-4 gap-4 opacity-20">
                            {Array.from({ length: 16 }).map((_, i) => <div key={i} className="border border-[#076633]" />)}
                        </div>
                        <div className="svg-laser absolute top-8 left-0 w-full h-1 bg-[#CC5833] shadow-[0_0_15px_#CC5833] z-20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#CC5833]/5 to-transparent svg-laser" style={{ height: '40px', marginTop: '-20px' }} />
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="text-xs font-mono text-[#CC5833] uppercase tracking-widest mb-4">Módulo II</div>
                        <h3 className="font-outfit text-5xl md:text-7xl font-bold text-[#F2F0E9] mb-6 tracking-tight">Escaneo Profundo</h3>
                        <p className="font-jakarta text-lg text-[#F2F0E9]/60 text-balance">
                            Inspección milimétrica de calidad y procedencia. Nada se escapa al rigor de nuestros protocolos de control de hidrocarburos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 3 */}
            <div className="archive-card sticky top-0 h-dvh w-full bg-[#076633] flex items-center justify-center overflow-hidden">
                <div className="max-w-5xl w-full px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
                    <div>
                        <div className="text-xs font-mono text-[#F2F0E9]/60 uppercase tracking-widest mb-4">Módulo III</div>
                        <h3 className="font-outfit text-5xl md:text-7xl font-bold text-[#F2F0E9] mb-6 tracking-tight">Flujo Vital</h3>
                        <p className="font-jakarta text-lg text-[#F2F0E9]/80 text-balance">
                            Mantenemos el pulso de la industria. Distribución en tiempo real con latencia cero entre refinería y estación final.
                        </p>
                    </div>
                    <div className="h-64 md:h-96 relative flex items-center justify-center">
                        <svg viewBox="0 0 500 200" className="w-full text-[#CC5833] drop-shadow-[0_0_8px_#CC5833]">
                            <path
                                className="svg-ekg"
                                d="M 0 100 L 150 100 L 170 80 L 190 150 L 220 30 L 240 120 L 260 100 L 500 100"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="1000"
                                strokeDashoffset="0"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}
