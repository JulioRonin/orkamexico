import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Manifesto() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Parallax background
            gsap.to('.manifesto-bg', {
                yPercent: 30,
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });

            // Text reveal
            const lines = gsap.utils.toArray('.manifesto-line');
            lines.forEach((line: any) => {
                gsap.fromTo(line,
                    { y: 80, opacity: 0, rotateX: -20 },
                    {
                        y: 0, opacity: 1, rotateX: 0,
                        duration: 1.2, ease: "power3.out",
                        scrollTrigger: {
                            trigger: line,
                            start: "top 85%",
                        }
                    }
                );
            });

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="manifesto" ref={sectionRef} className="relative py-40 md:py-64 overflow-hidden bg-[#1A1A1A]">
            <div
                className="manifesto-bg absolute inset-0 w-full h-[130%] -top-[15%] opacity-20 object-cover"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2070&auto=format&fit=crop')`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                }}
            />

            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A]/80 to-[#1A1A1A]" />

            <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 text-center perspective-1000">
                <div className="overflow-hidden mb-8 md:mb-12">
                    <h2 className="manifesto-line font-jakarta text-2xl md:text-3xl lg:text-4xl text-[#F2F0E9]/60 font-medium tracking-tight">
                        Lo normal es preguntar: ¿qué va mal?
                    </h2>
                </div>
                <div className="overflow-hidden">
                    <h2 className="manifesto-line font-cormorant italic text-5xl md:text-7xl lg:text-[6rem] text-[#F2F0E9] leading-[1.1]">
                        Nosotros preguntamos:<br />
                        <span className="text-[#CC5833] not-italic font-outfit font-bold tracking-tighter mt-4 inline-block">
                            ¿qué se puede optimizar?
                        </span>
                    </h2>
                </div>
            </div>
        </section>
    );
}
