import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 1. Diagnostic Deck
function DiagnosticDeck() {
    const [active, setActive] = useState(0);
    const cards = ["Gasolina", "Diesel", "Etanol"];

    useEffect(() => {
        const interval = setInterval(() => {
            setActive(prev => (prev + 1) % cards.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-[22rem] sm:h-80 w-full bg-[#E5E3DC] rounded-[2rem] p-6 flex flex-col justify-end items-center overflow-hidden border border-[#1A1A1A]/5 shadow-sm">
            <div className="absolute top-6 left-6 text-xs font-mono text-[#1A1A1A]/40 uppercase tracking-widest z-10">Servicios Disponibles</div>
            <div className="relative w-48 sm:w-56 h-32 sm:h-40 perspective-1000 mb-6">
                {cards.map((card, i) => {
                    const isActive = i === active;
                    const isPrev = i === (active - 1 + cards.length) % cards.length;
                    const isNext = i === (active + 1) % cards.length;

                    let y = 0;
                    let scale = 1;
                    let zIndex = 0;
                    let opacity = 1;

                    if (isActive) { y = 0; scale = 1; zIndex = 30; }
                    else if (isPrev) { y = -30; scale = 0.9; zIndex = 20; opacity = 0.6; }
                    else if (isNext) { y = -60; scale = 0.8; zIndex = 10; opacity = 0.3; }
                    else { opacity = 0; }

                    return (
                        <div
                            key={card}
                            className="absolute inset-x-0 bottom-0 top-0 bg-[#F2F0E9] rounded-2xl shadow-xl border border-[#1A1A1A]/5 flex items-center justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            style={{
                                transform: `translateY(${y}px) scale(${scale})`,
                                zIndex,
                                opacity
                            }}
                        >
                            <span className="font-outfit font-semibold text-lg sm:text-xl tracking-tight text-[#076633]">{card}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 2. Telemetry Terminal
function TelemetryTerminal() {
    const messages = [
        "Optimizando cadena de suministro...",
        "Analizando rutas de transporte...",
        "Soporte técnico en línea...",
        "Calibrando pureza de producto..."
    ];
    const [text, setText] = useState('');
    const [msgIndex, setMsgIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const typeSpeed = isDeleting ? 30 : 80;
        const currentMsg = messages[msgIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting && text === currentMsg) {
                setTimeout(() => setIsDeleting(true), 1500);
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setMsgIndex((prev) => (prev + 1) % messages.length);
            } else {
                setText(prev => isDeleting ? prev.slice(0, -1) : currentMsg.slice(0, prev.length + 1));
            }
        }, typeSpeed);

        return () => clearTimeout(timeout);
    }, [text, isDeleting, msgIndex]);

    return (
        <div className="relative h-[22rem] sm:h-80 w-full bg-[#1A1A1A] rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border border-[#1A1A1A]/5 shadow-xl">
            <div className="flex justify-between items-center bg-transparent relative z-10">
                <div className="text-xs font-mono text-[#F2F0E9]/30 uppercase tracking-widest">Productos en vivo</div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#CC5833] animate-pulse" />
                    <span className="text-[10px] font-mono text-[#CC5833] uppercase hidden sm:inline">Status Ok</span>
                </div>
            </div>
            <div className="relative z-10 mt-auto">
                <p className="font-mono text-[#F2F0E9]/90 text-sm sm:text-base leading-relaxed h-12">
                    <span className="text-[#076633] mr-2 font-bold">{">"}</span>
                    {text}
                    <span className="inline-block w-2.5 h-4 bg-[#CC5833] ml-[2px] animate-pulse align-middle" />
                </p>
            </div>

            {/* Background purely aesthetic pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #F2F0E9 1px, transparent 0)', backgroundSize: '16px 16px' }} />
        </div>
    );
}

// 3. Protocol Agenda
function ProtocolAgenda() {
    const cursorRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            tl.set(cursorRef.current, { x: 30, y: 180, opacity: 0, scale: 1 });
            tl.to(cursorRef.current, { opacity: 1, duration: 0.3 });

            // Move to X (Wednesday)
            tl.to(cursorRef.current, { x: 175, y: 92, duration: 1.2, ease: "power2.inOut" });

            // Click effect
            tl.to(cursorRef.current, { scale: 0.85, duration: 0.1 });
            tl.to('.day-target', { backgroundColor: '#076633', color: '#F2F0E9', borderColor: '#076633', duration: 0.2 }, "-=0.05");
            tl.to(cursorRef.current, { scale: 1, duration: 0.1 });

            // Move to save
            tl.to(cursorRef.current, { x: 335, y: 165, duration: 0.9, ease: "power2.inOut", delay: 0.3 });

            // Click Save
            tl.to(cursorRef.current, { scale: 0.85, duration: 0.1 });
            tl.to('.save-btn', { scale: 0.95, duration: 0.1 }, "-=0.05");
            tl.to(cursorRef.current, { scale: 1, duration: 0.1 });
            tl.to('.save-btn', { scale: 1, duration: 0.1 }, "-=0.05");

            tl.to(cursorRef.current, { opacity: 0, duration: 0.3, delay: 0.2 });

            // Reset
            tl.to('.day-target', { backgroundColor: 'transparent', color: '#1A1A1A', borderColor: 'rgba(26,26,26,0.1)', duration: 0.3 }, "+=0.5");

        }, containerRef);
        return () => ctx.revert();
    }, []);

    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return (
        <div ref={containerRef} className="relative h-[22rem] sm:h-80 w-full bg-[#E5E3DC] rounded-[2rem] p-6 overflow-hidden border border-[#1A1A1A]/5 shadow-sm flex items-center justify-center">
            <div className="absolute top-6 left-6 text-xs font-mono text-[#1A1A1A]/40 uppercase tracking-widest z-10">Agenda / Protocolo</div>

            <div className="relative w-full max-w-[360px] mx-auto mt-4 z-0">
                <div className="grid grid-cols-7 gap-2 mb-10">
                    {days.map((d, i) => (
                        <div
                            key={i}
                            className={`h-10 sm:h-12 rounded-lg border border-[#1A1A1A]/10 flex items-center justify-center font-jakarta text-sm font-semibold transition-colors
                ${i === 2 ? 'day-target' : 'bg-transparent text-[#1A1A1A]'}
              `}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pr-2">
                    <div className="save-btn px-6 py-2.5 rounded-full border border-[#1A1A1A]/20 bg-transparent text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
                        Guardar
                    </div>
                </div>
            </div>

            <svg ref={cursorRef} className="absolute w-8 h-8 pointer-events-none drop-shadow-md z-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4L11.5 21.5L14 14L21.5 11.5L4.5 4Z" fill="#1A1A1A" stroke="#F2F0E9" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

export function Features() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.feature-intro',
                { y: 50, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1, ease: "power2.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 75%",
                    }
                }
            );

            gsap.fromTo('.feature-card',
                { y: 60, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.9, stagger: 0.15, ease: "power3.out",
                    scrollTrigger: {
                        trigger: '.features-grid',
                        start: "top 80%",
                    }
                }
            );
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="telemetry" ref={sectionRef} className="py-24 md:py-32 px-6 md:px-16 w-full max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24 feature-intro max-w-2xl">
                <h3 className="font-outfit text-3xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] mb-6 leading-tight">
                    Precisión sistemática
                </h3>
                <p className="font-jakarta text-base md:text-lg text-[#1A1A1A]/70 text-balance leading-relaxed">
                    Nuestras herramientas no son interfaces; son artefactos funcionales diseñados para controlar variables complejas y optimizar rendimientos a escala.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 features-grid">
                <div className="feature-card lg:col-span-1">
                    <DiagnosticDeck />
                </div>
                <div className="feature-card lg:col-span-2">
                    <TelemetryTerminal />
                </div>
                <div className="feature-card lg:col-span-3">
                    <ProtocolAgenda />
                </div>
            </div>
        </section>
    );
}
