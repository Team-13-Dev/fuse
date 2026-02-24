"use client"
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight, Database, X } from 'lucide-react';
import { ArrowUpRight, Target, Activity, Zap, Check, LogOut } from 'lucide-react'; 
import Image from 'next/image';
import logo from "@/public/logo.png"
import { Menu } from 'lucide-react';
import { authClient, signOut } from "@/lib/auth-client";
import Link from 'next/link';


gsap.registerPlugin(ScrollTrigger);


const NoiseOverlay = () => (
  <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-5 mix-blend-multiply">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, isPending } = authClient.useSession();


   useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={` fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? ' backdrop-blur-xl bg-white  text-black py-1 shadow-md' : 'py-1.5 text-white'}`}>
          <div className="px-6 h-17 flex justify-between items-center">
            <div className='flex items-center gap-7'>
              <Image src={logo} alt='logo' width={40}/>

              <div className="hidden md:flex items-center gap-8 text-sm">
                {['Products', 'Prcing', 'Developers', 'Resources', 'Docs', 'Sales'].map((item) => (
                  <a key={item} href="#" className="hover:text-[#2F46F8] transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            {/* Auth Buttons */}
            {
              !session ?
               <div className="hidden md:flex items-center gap-6 text-sm">
                  <Link href={"/login"}>
                    Sign in
                  </Link>
                  <Link href={"/register"} className='flex items-center gap-1 shadow-sm text-sm px-4 py-1 text-black border-[#E1E1E2] border bg-white rounded-lg'>
                    Sign Up
                    <ChevronRight size={10}/>
                  </Link>
                </div>
              :
              <div className='flex items-center gap-4'>
                <Link href="/dashboard">Go To Dashboard</Link>
                <button onClick={() => signOut()} className='flex items-center gap-1 shadow-sm text-sm px-4 py-1 text-black border-[#E1E1E2] border bg-white rounded-lg hover:opacity-90 duration-300 cursor-pointer'>
                  Sign Out
                  <LogOut />
                </button>
              </div>
            }
           

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-gray-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden absolute w-full bg-white border-b p-6 flex flex-col gap-4">
              {['Product', 'Solutions', 'Docs', 'Pricing'].map((item) => (
                <a key={item} href="#" className="text-lg font-normal  hover:text-[#2F46F8]">
                  {item}
                </a>
              ))}
              <div className="h-px bg-gray-800 my-2"></div>
              <Link href={"/register"} className="w-full bg-[#2F46F8] text-white py-3 rounded-lg font-bold">Sign Up</Link>
            </div>
          )}
    </nav>
  );
};

const Hero = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-elem', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative h-dvh w-full overflow-hidden bg-[#111111] flex items-end pb-24 md:pb-32">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=2000&auto=format&fit=crop" 
          alt="Concrete Architecture" 
          className="object-cover w-full h-full opacity-40 grayscale"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#111111] via-[#111111]/80 to-transparent"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl px-6 mx-auto md:px-12">
        <div className="max-w-4xl text-[#F5F3EE]">
          <p className="mb-6 font-data text-[#2F47F2] hero-elem uppercase tracking-widest text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2F47F2] animate-pulse"></span> System Initialized for Local Brands
          </p>
          <h1 className="flex flex-col mb-8 leading-[0.9]">
            <span className="text-5xl font-bold uppercase md:text-8xl hero-elem">Command the</span>
            <span className="text-7xl md:text-[11rem] font-drama text-[#E8E4DD] hero-elem mt-2 md:-mt-4">Market.</span>
          </h1>
          <div className="flex flex-col items-start gap-6 hero-elem md:flex-row md:items-center">
            <Link href={"/register"} className="magnetic-hover cursor-pointer bg-[#2F47F2] text-white px-8 py-4 rounded-full font-bold text-lg uppercase flex items-center gap-2 group">
              Get Started <ArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            <p className="max-w-sm text-sm opacity-80 font-data">
              AI-driven precision growth engine engineered to scale Egypt's leading local operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const DiagnosticShuffler = () => {
  const [cards] = useState(["Anomaly Detected", "Revenue Leak", "Growth Pattern"]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [cards.length]);

  return (
    // FIX: replaced invalid Tailwind `perspective-[1000px]` class with inline style
    <div className="relative h-48 w-full" style={{ perspective: '1000px' }}>
      {cards.map((card, i) => {
        const offset = (i - activeIndex + cards.length) % cards.length;
        return (
          <div 
            key={i}
            className="absolute top-0 left-0 w-full p-4 border rounded-4xl bg-[#f5f5f5] border-[#111111]/10 flex items-center justify-between transition-all duration-700 shadow-sm"
            style={{
              transform: `translateY(${offset * 16}px) scale(${1 - offset * 0.05})`,
              opacity: 1 - offset * 0.2,
              zIndex: cards.length - offset,
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#111111] text-white"><Target size={16} /></div>
              <span className="font-bold uppercase font-data text-sm">{card}</span>
            </div>
            {i === activeIndex && <span className="text-xs text-[#2F47F2] font-data animate-pulse">Scanning...</span>}
          </div>
        );
      })}
    </div>
  );
};

const TelemetryTypewriter = () => {
  const fullText = "INGESTING LOCAL MARKET DATA...\nANALYZING CUSTOMER ENGAGEMENT...\nOPTIMIZING CONVERSION PIPELINE...\n> ACTIONABLE INSIGHTS READY.";
  const [text, setText] = useState("");
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) i = 0;
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-48 p-6 bg-[#111111] text-[#E8E4DD] rounded-4xl font-data text-xs overflow-hidden relative shadow-inner">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#2F47F2] animate-pulse"></span>
        <span className="opacity-50">Live Feed</span>
      </div>
      <pre className="whitespace-pre-wrap mt-6 leading-loose">{text}<span className="inline-block w-2 h-4 ml-1 align-middle bg-[#2F47F2] animate-pulse"></span></pre>
    </div>
  );
};

const ProtocolScheduler = () => {
  const cursorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      tl.to(cursorRef.current, { x: 80, y: 40, duration: 1, ease: 'power2.inOut' })
        .to(cursorRef.current, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.day-cell-3', { backgroundColor: '#3048F7', color: 'white', duration: 0.2 }, '-=0.1')
        .to(cursorRef.current, { x: 180, y: 120, duration: 1, ease: 'power2.inOut', delay: 0.5 })
        .to(cursorRef.current, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.save-btn', { backgroundColor: '#111111', duration: 0.2 }, '-=0.1')
        .to(cursorRef.current, { opacity: 0, duration: 0.3 })
        .set('.day-cell-3', { backgroundColor: 'transparent', color: '#111111' })
        .set('.save-btn', { backgroundColor: '#E8E4DD' })
        .set(cursorRef.current, { x: 0, y: 0, opacity: 1 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div ref={containerRef} className="relative w-full h-48 p-6 bg-[#E8E4DD] border border-[#111111]/10 rounded-4xl overflow-hidden flex flex-col justify-between">
      <div className="flex justify-between w-full font-data font-bold text-sm">
        {days.map((d, i) => (
          <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full day-cell-${i} transition-colors border border-[#111111]/10`}>{d}</div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <div className="save-btn px-4 py-2 text-xs uppercase font-data font-bold bg-[#E8E4DD] border border-[#111111]/20 rounded-full transition-colors">Save Protocol</div>
      </div>
      <svg ref={cursorRef} className="absolute top-4 left-4 z-10 w-6 h-6 text-[#111111]" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
    </div>
  );
};

const Features = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        scrollTrigger: { trigger: containerRef.current, start: 'top 70%' },
        y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={containerRef} className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="text-4xl md:text-6xl font-bold uppercase leading-none mb-4">Functional<br/><span className="font-drama text-[#2F47F2]">Artifacts.</span></h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="feature-card flex flex-col gap-6 p-8 bg-[#f4f4f4] rounded-[3rem] border border-[#111111]/10 shadow-sm hover:shadow-md transition-shadow">
          <DiagnosticShuffler />
          <div>
            <h3 className="text-2xl font-bold uppercase mb-2">Diagnostic Shuffler</h3>
            <p className="text-sm opacity-80 font-data">Instantly uncovers hidden business problems through AI-driven pattern detection.</p>
          </div>
        </div>

        <div className="feature-card flex flex-col gap-6 p-8 bg-[#f4f4f4] rounded-[3rem] border border-[#111111]/10 shadow-sm hover:shadow-md transition-shadow">
          <TelemetryTypewriter />
          <div>
            <h3 className="text-2xl font-bold uppercase mb-2">Telemetry Typewriter</h3>
            <p className="text-sm opacity-80 font-data">Transforms raw data into clear, actionable performance insights.</p>
          </div>
        </div>

        <div className="feature-card flex flex-col gap-6 p-8 bg-[#f4f4f4] rounded-[3rem] border border-[#111111]/10 shadow-sm hover:shadow-md transition-shadow">
          <ProtocolScheduler />
          <div>
            <h3 className="text-2xl font-bold uppercase mb-2">Protocol Scheduler</h3>
            <p className="text-sm opacity-80 font-data">Automatically plans optimized strategies that improve growth and efficiency.</p>
          </div>
        </div>

      </div>
    </section>
  );
};

const Philosophy = () => {
  const ref = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.phil-line', {
        scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        y: 40, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out'
      });
      gsap.to('.parallax-bg', {
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
        y: 100, ease: 'none'
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="philosophy" ref={ref} className="relative py-48 px-6 md:px-12 bg-[#111111] text-[#F5F3EE] overflow-hidden rounded-[3rem] mx-4 md:mx-12 my-12">
      <div className="absolute inset-0 z-0 opacity-20 parallax-bg">
        <img src="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2000&auto=format&fit=crop" className="object-cover w-full h-[120%]" alt="Raw texture" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-12">
        <p className="text-xl md:text-3xl font-data uppercase opacity-60 phil-line">Most CRMs focus on: generic tools and bloated interfaces.</p>
        <p className="text-4xl md:text-7xl font-bold uppercase leading-[1.1] phil-line">
          We focus on: <br/><span className="font-drama text-[#3048F7]">Precision growth</span> for Egypt's local leaders.
        </p>
      </div>
    </section>
  );
};


const ProtocolSteps = () => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.protocol-card');

      cards.forEach((card, i) => {
        if (i !== cards.length - 1) {
          // 1. PINNING LOGIC
          ScrollTrigger.create({
            trigger: card,
            // 'top 10%' centers an 80vh card nicely. 
            // If using h-screen, use 'top top' or 'center center'
            start: 'top 10%', 
            endTrigger: cards[i + 1],
            end: 'top 10%',
            pin: true,
            pinSpacing: false, // CRITICAL: Allows the next card to overlap!
          });

          // 2. ANIMATION LOGIC (Shrink & Blur)
          gsap.to(card, {
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top 70%', // Start shrinking when the next card is 70% from the top
              end: 'top 10%',   // Finish shrinking right as it locks in
              scrub: true,
            },
            scale: 0.9,
            opacity: 0,
            filter: 'blur(10px)',
          });
        }
      });
    }, mainRef);

    return () => ctx.revert(); // Excellent cleanup practice!
  }, []);

  const steps = [
    { num: '01', title: 'Data Ingestion', desc: 'Securely pulling fragmented retail data...', Icon: Database },
    { num: '02', title: 'Pattern Recognition', desc: 'Isolating critical anomalies...', Icon: Activity },
    { num: '03', title: 'Strategic Execution', desc: 'Deploying targeted campaigns...', Icon: Zap },
  ];

  return (
    <section id="protocol" className="py-32 bg-[#111111] text-white">
      <div className="px-6 mx-auto mb-16 max-w-7xl md:px-12 text-center">
        <h2 className="text-4xl md:text-6xl font-bold uppercase leading-none mb-4">
          System
          <br />
          <span className="font-drama text-[#3048F7]">Protocol.</span>
        </h2>
      </div>

      <div ref={mainRef} className="relative max-w-5xl mx-auto px-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="protocol-card w-full min-h-[50vh] mx-auto rounded-[3rem] bg-white text-[#1d1d1d] border border-[#111111]/10 flex flex-col md:flex-row items-center justify-center p-8 md:p-16 mb-16 relative shadow-lg will-change-transform"
            // CRITICAL: Next card needs a higher z-index to overlay the previous one.
            // Using `zIndex: i` or letting natural DOM flow handle it works perfectly.
            style={{ zIndex: i }} 
          >
            <div className="flex flex-col items-center justify-center w-full h-full mb-8 md:w-1/2 md:mb-0">
              <step.Icon size={120} strokeWidth={1.5} className="text-[#3048F7] animate-pulse" />
            </div>
            <div className="flex flex-col justify-center w-full h-full md:w-1/2 text-center md:text-left">
              <span className="mb-4 text-2xl font-bold font-data text-[#3048F7]">{step.num}</span>
              <h3 className="mb-4 text-4xl font-bold uppercase md:text-6xl">{step.title}</h3>
              <p className="max-w-md mx-auto text-lg opacity-80 font-data md:mx-0">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};


const Pricing = () => {
  return (
    <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto z-10000">
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-6xl font-bold uppercase leading-none mb-4">Deployment<br/><span className="font-drama text-[#3048F7]">Tiers.</span></h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Tier 1 */}
        <div className="p-8 rounded-[3rem] border border-[#111111]/10 bg-[#f4f4f4] flex flex-col h-full">
          <h3 className="mb-2 text-2xl font-bold uppercase">Essential</h3>
          <p className="mb-8 text-sm opacity-80 font-data">For emerging local brands.</p>
          <div className="mb-8 font-data"><span className="text-4xl font-bold">EGP 1,200</span> /mo</div>
          <ul className="flex-1 mb-8 space-y-4 font-data text-sm">
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Basic CRM Features</li>
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Standard Reports</li>
          </ul>
          <button className="w-full py-4 rounded-full border border-[#111111] font-bold uppercase hover:bg-[#111111] hover:text-white transition-colors">Select Tier</button>
        </div>
        {/* Tier 2 (Pops) */}
        <div className="p-10 rounded-[3rem] bg-[#111111] text-[#F5F3EE] flex flex-col h-full transform scale-105 shadow-2xl relative border-t-4 border-[#3048F7]">
          <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#3048F7] text-white px-4 py-1 rounded-full text-xs font-data font-bold uppercase">Recommended</div>
          <h3 className="mb-2 text-2xl font-bold uppercase">Performance</h3>
          <p className="mb-8 text-sm opacity-80 font-data">AI-driven engine activated.</p>
          <div className="mb-8 font-data"><span className="text-4xl font-bold text-[#3048F7]">EGP 3,500</span> /mo</div>
          <ul className="flex-1 mb-8 space-y-4 font-data text-sm">
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Diagnostic Shuffler</li>
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Telemetry Feed</li>
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Automated Workflows</li>
          </ul>
          <button className="w-full py-4 rounded-full bg-[#3048F7] text-white font-bold uppercase magnetic-hover cursor-pointer">Get Started</button>
        </div>
        {/* Tier 3 */}
        <div className="p-8 rounded-[3rem] border border-[#111111]/10 bg-[#f4f4f4] flex flex-col h-full">
          <h3 className="mb-2 text-2xl font-bold uppercase">Enterprise</h3>
          <p className="mb-8 text-sm opacity-80 font-data">Scale at high velocity.</p>
          <div className="mb-8 font-data"><span className="text-4xl font-bold">Custom</span></div>
          <ul className="flex-1 mb-8 space-y-4 font-data text-sm">
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Dedicated Server Node</li>
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> Custom AI Models</li>
            <li className="flex gap-3"><Check size={18} className="text-[#3048F7]" /> 24/7 Priority Support</li>
          </ul>
          <button className="w-full py-4 rounded-full border border-[#111111] font-bold uppercase hover:bg-[#111111] hover:text-white transition-colors">Contact Sales</button>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#111111] z-10 text-[#F5F3EE] pt-24 pb-8 px-6 md:px-12 rounded-t-[4rem] mt-24">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto mb-24">
      <div className="col-span-1 md:col-span-2">
        <h2 className="text-4xl font-bold uppercase font-data mb-4">FUSE</h2>
        <p className="font-data text-sm opacity-60 max-w-sm mb-8">AI-driven pattern detection and performance optimization for Egypt's leading local operations.</p>
        <div className="inline-flex items-center gap-3 px-4 py-2 border border-white/20 rounded-full font-data text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          System Operational
        </div>
      </div>
      <div className="flex flex-col gap-4 font-data text-sm opacity-80">
        <strong className="uppercase opacity-100 mb-2">Navigation</strong>
        <a href="#features" className="hover:text-[#E63B2E] transition-colors">Capabilities</a>
        <a href="#philosophy" className="hover:text-[#E63B2E] transition-colors">Philosophy</a>
        <a href="#protocol" className="hover:text-[#E63B2E] transition-colors">Protocol</a>
      </div>
      <div className="flex flex-col gap-4 font-data text-sm opacity-80">
        <strong className="uppercase opacity-100 mb-2">Legal</strong>
        <a href="#" className="hover:text-[#E63B2E] transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-[#E63B2E] transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-[#E63B2E] transition-colors">Security</a>
      </div>
    </div>
    <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-data opacity-50">
      <p>© 2026 Fuse Command System. All rights reserved.</p>
      <p>ENGINEERED IN EGYPT</p>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="relative min-h-screen bg-[#FFF] selection:bg-[#E63B2E] selection:text-white">
      <NoiseOverlay />
      <Navbar />
      <Hero />
      <Features />
      <Philosophy />
      <ProtocolSteps />
      <Pricing />
      <Footer />
    </div>
  );
}