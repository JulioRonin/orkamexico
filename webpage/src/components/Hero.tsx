import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Fade in the background slightly and parallax
            gsap.fromTo('.hero-bg',
                { scale: 1.1, opacity: 0 },
                { scale: 1, opacity: 1, duration: 2, ease: 'power2.out' }
            );

            // Staggered text entry
            gsap.fromTo('.hero-text-line',
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out', delay: 0.5 }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative w-full h-dvh flex items-end pb-24 md:pb-32 overflow-hidden bg-[#1A1A1A]">
            <div
                className="hero-bg absolute inset-0 w-full h-full object-cover"
                style={{
                    backgroundImage: `url('/hero-banner.png')`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                }}
            />

            {/* Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#076633]/40 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/40 to-transparent" />

            <div className="relative z-10 w-full px-8 md:px-16 max-w-7xl mx-auto flex flex-col justify-end h-full">
                <div className="hero-text-line overflow-hidden">
                    <h2 className="text-[#F2F0E9] font-jakarta font-bold text-2xl md:text-3xl uppercase tracking-widest pl-2 mb-2">
                        Energía en constante
                    </h2>
                </div>
                <div className="hero-text-line overflow-hidden mt-[-0.5rem] md:mt-[-2rem]">
                    <h1 className="text-[#F2F0E9] font-cormorant italic font-medium text-7xl md:text-[11.5rem] leading-none tracking-tight">
                        Evolución
                    </h1>
                </div>

                <div className="hero-text-line mt-12">
                    <button className="relative group overflow-hidden px-8 py-4 rounded-full border border-[#F2F0E9]/30 bg-[#F2F0E9]/10 backdrop-blur-sm text-[#F2F0E9] font-jakarta font-semibold tracking-wide hover:border-transparent transition-colors duration-500">
                        <span className="relative z-10 text-sm">Descubre cómo</span>
                        <div className="absolute inset-0 h-full w-full scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 bg-[#076633] z-0" />
                    </button>
                </div>
            </div>
        </section>
    );
}
