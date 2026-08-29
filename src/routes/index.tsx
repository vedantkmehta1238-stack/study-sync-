import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  Users,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  ChevronDown,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import VariableProximity from "@/components/VariableProximity";
import SlicedWaves from "@/components/SlicedWaves";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudySync — All your academic work, one focused workspace" },
      {
        name: "description",
        content:
          "Track subject-wise attendance, never miss an assignment, and organise faculty self-learning in one clean workspace.",
      },
      { property: "og:title", content: "StudySync — Your academic workspace" },
      {
        property: "og:description",
        content:
          "Subject-wise attendance with a 75% guardrail, assignments, and faculty self-learning — designed for students.",
      },
    ],
  }),
  component: Landing,
});

/* ─── Data ─── */
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  { icon: CalendarCheck, title: "Attendance", desc: "Track and maintain subject-wise attendance", color: "bg-blue-50 text-blue-600" },
  { icon: ClipboardList, title: "Assignments", desc: "Manage assignments and never miss a deadline", color: "bg-purple-50 text-purple-600" },
  { icon: FileText, title: "Notes", desc: "Create, organize and access your notes anytime", color: "bg-green-50 text-green-600" },
  { icon: FolderOpen, title: "Study Material", desc: "Store and access important study materials", color: "bg-amber-50 text-amber-600" },
  { icon: Users, title: "Friends", desc: "Connect with friends and share academic updates", color: "bg-rose-50 text-rose-600" },
];

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];



/* ═══════════════════════════════════════════
   PHONE MOCKUP — realistic iPhone style
   ═══════════════════════════════════════════ */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px] perspective-[1200px]">
      {/* Glow behind phone */}
      <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl" />
      {/* Phone body — dark titanium frame */}
      <div className="relative rounded-[3rem] bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 p-[3px] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
        {/* Inner bezel */}
        <div className="rounded-[2.85rem] bg-black p-[2px]">
          {/* Screen */}
          <div className="overflow-hidden rounded-[2.7rem] bg-white">
            {/* Dynamic Island */}
            <div className="relative bg-white pt-3 pb-1">
              <div className="mx-auto h-[28px] w-[90px] rounded-full bg-black" />
            </div>
            {/* Status bar */}
            <div className="flex items-center justify-between bg-white px-6 pb-2 pt-0">
              <span className="text-[11px] font-semibold text-black">9:41</span>
              <div className="flex items-center gap-1">
                {/* Signal bars */}
                <svg className="h-3 w-3" viewBox="0 0 16 12"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="black"/><rect x="4" y="5" width="3" height="7" rx="0.5" fill="black"/><rect x="8" y="2" width="3" height="10" rx="0.5" fill="black"/><rect x="12" y="0" width="3" height="12" rx="0.5" fill="black"/></svg>
                {/* WiFi */}
                <svg className="h-3 w-3" viewBox="0 0 16 12"><path d="M8 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="black"/><path d="M4.5 8.5C5.5 7.2 6.7 6.5 8 6.5s2.5.7 3.5 2" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M2 6c1.8-2 3.8-3 6-3s4.2 1 6 3" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                {/* Battery */}
                <svg className="h-4 w-4" viewBox="0 0 28 14"><rect x="0.5" y="0.5" width="23" height="13" rx="3" stroke="black" strokeWidth="1"/><rect x="2" y="2" width="18" height="10" rx="1.5" fill="black"/><path d="M25 4.5v5c1.2-.5 1.2-4.5 0-5z" fill="black"/></svg>
              </div>
            </div>
            {/* App screen content */}
            <div className="bg-gray-50 px-5 pb-3">
              {/* Greeting */}
              <div className="mb-3 pt-1">
                <p className="text-[11px] text-gray-400">Good morning,</p>
                <p className="text-[17px] font-bold text-gray-900">Vedant 👋</p>
              </div>
              {/* Today's Overview card */}
              <div className="mb-2 rounded-2xl bg-white p-3 shadow-sm">
                <p className="mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Overview</p>
                <div className="space-y-2">
                  {[
                    { icon: CalendarCheck, label: "Attendance", sub: "91 Total", value: "92%", color: "text-emerald-500", bg: "bg-emerald-50" },
                    { icon: ClipboardList, label: "Assignments", sub: "3 Pending", value: "3", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: CheckCircle2, label: "Tasks", sub: "5 Pending", value: "5", color: "text-purple-500", bg: "bg-purple-50" },
                    { icon: FolderOpen, label: "Study Material", sub: "12 Files", value: "12", color: "text-amber-500", bg: "bg-amber-50" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`grid h-8 w-8 place-items-center rounded-lg ${item.bg}`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-800">{item.label}</p>
                          <p className="text-[9px] text-gray-400">{item.sub}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold ${item.color}`}>{item.value} <span className="text-gray-300">→</span></span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-xl bg-blue-500 p-2.5 text-white">
                  <p className="text-[10px] font-semibold opacity-90">Mark Attendance</p>
                  <p className="mt-0.5 text-[8px] opacity-70">Tap to mark today</p>
                </div>
                <div className="rounded-xl bg-purple-500 p-2.5 text-white">
                  <p className="text-[10px] font-semibold opacity-90">Add Assignment</p>
                  <p className="mt-0.5 text-[8px] opacity-70">Create new task</p>
                </div>
              </div>
              {/* Upcoming */}
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="mb-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Upcoming</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-red-50 grid place-items-center shrink-0">
                      <span className="text-[9px] font-bold text-red-500">10</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-800 truncate">Maths Assignment</p>
                      <p className="text-[8px] text-gray-400">Due tomorrow</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 grid place-items-center shrink-0">
                      <span className="text-[9px] font-bold text-blue-500">12</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-800 truncate">Physics Lab</p>
                      <p className="text-[8px] text-gray-400">In 2 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom nav bar */}
            <div className="flex items-center justify-around border-t border-gray-100 bg-white px-3 py-2.5 pb-5">
              {[
                { label: "Home", active: true },
                { label: "Tasks", active: false },
                { label: "＋", active: false, isCenter: true },
                { label: "Notes", active: false },
                { label: "Profile", active: false },
              ].map((n) => (
                <div key={n.label} className="flex flex-col items-center">
                  {n.isCenter ? (
                    <div className="flex h-10 w-10 -mt-5 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-500/40">
                      +
                    </div>
                  ) : (
                    <>
                      <div className={`h-0.5 w-4 rounded-full ${n.active ? "bg-blue-600" : "bg-transparent"}`} />
                      <span className={`mt-0.5 text-[8px] ${n.active ? "font-semibold text-blue-600" : "text-gray-400"}`}>{n.label}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ABOUT ILLUSTRATION (CSS art — man with laptop)
   ═══════════════════════════════════════════ */
function AboutIllustration() {
  return (
    <div className="relative flex h-[280px] w-full items-center justify-center">
      {/* Background blob */}
      <div className="absolute h-48 w-48 rounded-full bg-blue-100/60 blur-2xl" />
      {/* Desk */}
      <div className="absolute bottom-12 h-2 w-48 rounded-full bg-gray-200" />
      {/* Laptop */}
      <div className="relative bottom-0">
        <div className="h-24 w-32 rounded-t-lg border-2 border-gray-300 bg-white shadow-md">
          <div className="mx-auto mt-2 h-16 w-28 rounded bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="mx-auto mt-3 h-2 w-16 rounded-full bg-gray-200" />
            <div className="mx-auto mt-2 h-2 w-12 rounded-full bg-gray-100" />
            <div className="mx-auto mt-2 h-2 w-20 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="mx-auto h-2 w-36 rounded-b-lg bg-gray-300" />
      </div>
      {/* Floating icons around */}
      <div className="absolute top-4 left-8 rounded-lg bg-white p-2 shadow-sm">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      </div>
      <div className="absolute top-8 right-8 rounded-lg bg-white p-2 shadow-sm">
        <CalendarCheck className="h-5 w-5 text-blue-500" />
      </div>
      <div className="absolute bottom-20 left-4 rounded-lg bg-white p-2 shadow-sm">
        <Star className="h-5 w-5 text-amber-500" />
      </div>
      <div className="absolute bottom-24 right-4 rounded-lg bg-white p-2 shadow-sm">
        <BookOpen className="h-5 w-5 text-purple-500" />
      </div>
      {/* Person silhouette (simplified) */}
      <div className="absolute bottom-14">
        <div className="h-10 w-10 rounded-full bg-gradient-to-b from-amber-200 to-amber-300" />
        <div className="mx-auto -mt-1 h-16 w-20 rounded-t-3xl bg-gradient-to-b from-blue-500 to-blue-600" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION DIVIDER (subtle chevron)
   ═══════════════════════════════════════════ */
function SectionChevron() {
  return (
    <div className="flex justify-center py-2 animate-bounce" style={{ animationDuration: "2s" }}>
      <ChevronDown className="h-6 w-6 text-primary/30" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════ */
function Landing() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const goToSignup = useCallback(() => {
    navigate({ to: "/auth", search: { mode: "signup" } });
  }, [navigate]);

  const goToLogin = useCallback(() => {
    navigate({ to: "/auth" });
  }, [navigate]);

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  /* Scroll progress */
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll reveal refs — Freebuff style with more variety */
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPhoneRef = useRef<HTMLDivElement>(null);
  const featuresTitleRef = useScrollReveal({ type: "fade-up-scale" });
  const featureCardRefs = [
    useScrollReveal({ type: "flip-left", delay: 0 }),
    useScrollReveal({ type: "fade-up", delay: 0.08 }),
    useScrollReveal({ type: "fade-up-scale", delay: 0.16 }),
    useScrollReveal({ type: "fade-up", delay: 0.24 }),
    useScrollReveal({ type: "flip-right", delay: 0.32 }),
  ];
  const aboutIllRef = useScrollReveal({ type: "zoom-in" });
  const aboutTextRef = useScrollReveal({ type: "flip-left" });
  const ctaRef = useScrollReveal({ type: "slide-up" });
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const aboutContainerRef = useRef<HTMLDivElement>(null);
  const footerRef = useScrollReveal({ type: "fade-up" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── SLICED WAVES BACKGROUND ─── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <SlicedWaves
          color1="#93c5fd"
          color2="#a5b4fc"
          color3="#c4b5fd"
          columns={16}
          rows={10}
          barThickness={0.12}
          speed={0.3}
          travel={0.6}
          waveSpread={0.85}
          rowOffset={1.2}
          softness={0.12}
          glow={0.05}
          brightness={0.9}
          contrast={0.9}
          opacity={0.18}
          orientation="horizontal"
          alternate={true}
          mouseInteraction={true}
          mouseStrength={1.2}
          mouseRadius={0.25}
          grain={true}
          grainIntensity={0.03}
        />
      </div>

      {/* ─── SCROLL PROGRESS BAR ─── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-purple-600 transition-[width] duration-100 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/studysync-logo.png" alt="StudySync" className="h-8 w-8" />
            <span className="text-lg font-bold text-foreground">StudySync</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={cycleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button
              onClick={goToSignup}
              className="btn-macos rounded-full px-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ═══════ HERO ═══════ */}
        <section className="mx-auto max-w-6xl px-6 py-8 md:py-14">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div ref={heroTextRef}>
              <div ref={heroContainerRef} style={{ position: 'relative' }}>
                <VariableProximity
                  label="All Your College Life, Organized & Simplified."
                  className="text-foreground text-[clamp(1.8rem,5vw,3.2rem)] font-bold mx-0 text-left leading-tight"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 800, 'opsz' 40"
                  containerRef={heroContainerRef}
                  radius={120}
                  falloff="linear"
                />
              </div>
              <p className="mt-4 max-w-md text-base text-foreground/70">
                StudySync is your all-in-one academic companion to manage tasks,
                notes, attendance and more.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={goToSignup}
                  className="btn-macos rounded-full px-6"
                >
                  Get Started
                </Button>
                <Button asChild variant="outline" className="btn-macos rounded-full px-6">
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
            </div>
            <div ref={heroPhoneRef} className="relative flex justify-center">
              {/* Floating decorative dots */}
              <div className="absolute -top-4 -left-4 h-3 w-3 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute top-12 -right-6 h-2 w-2 rounded-full bg-purple-400/50 animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute bottom-8 -left-8 h-2.5 w-2.5 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: "1.5s" }} />
              <PhoneMockup />
            </div>
          </div>
        </section>

        <SectionChevron />

        {/* ═══════ FEATURES ═══════ */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-6 md:py-10">
          <div ref={featuresTitleRef} data-reveal="fade-up" className="mb-8 text-center">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-primary">
              Features
            </span>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Everything you need, in one place.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                ref={featureCardRefs[i]}
                data-reveal={i === 0 ? "fade-left" : i === 4 ? "fade-right" : "fade-up"}
                className="card-macos group rounded-2xl border bg-card p-4 text-center shadow-sm"
              >
                <div className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <SectionChevron />

        {/* ═══════ ABOUT ═══════ */}
        <section id="about" className="mx-auto max-w-6xl px-6 py-6 md:py-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div ref={aboutIllRef} data-reveal="zoom-in">
              <AboutIllustration />
            </div>
            <div ref={aboutTextRef} data-reveal="fade-right">
              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-primary">
                About Me
              </span>
              <div ref={aboutContainerRef} style={{ position: 'relative' }}>
                <VariableProximity
                  label="Hi, I'm Vedant Mehta."
                  className="text-foreground text-[clamp(1.5rem,3.5vw,2.2rem)] font-bold mx-0 text-left leading-tight"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 800, 'opsz' 40"
                  containerRef={aboutContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/65">
                I'm a passionate developer and engineering student who built StudySync
                to solve a real problem — managing college life without losing track of
                attendance, assignments, and deadlines.
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/65">
                I believe every student deserves a clean, focused workspace that just works.
                No clutter, no distractions — just the tools you need to stay on top of
                your academics. StudySync is my way of giving back to the student community.
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/65">
                When I'm not coding, you'll find me exploring new technologies, contributing
                to open source, and helping fellow students stay organized.
              </p>
            </div>
          </div>
        </section>

        <SectionChevron />

        {/* ═══════ CTA ═══════ */}
        <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
          <div ref={ctaRef} data-reveal="fade-up">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-500 to-purple-600 p-8 md:p-12">
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <img src="/studysync-logo.png" alt="StudySync" className="h-12 w-12 shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                      Ready to make your college life easier?
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-white/80">
                      Join StudySync today and take the first step towards better productivity.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={goToSignup}
                  className="btn-macos shrink-0 rounded-full bg-white px-6 text-purple-600 shadow-lg hover:bg-white/90"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer id="contact" ref={footerRef} data-reveal="fade-up" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2">
                <img src="/studysync-logo.png" alt="StudySync" className="h-7 w-7" />
                <span className="text-base font-bold">StudySync</span>
              </Link>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                All-in-one digital academic companion for college students.
              </p>
            </div>
            {/* Quick Links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
              <ul className="space-y-2">
                {FOOTER_LINKS.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Contact</h4>
              <a
                href="mailto:mehtavedant1238@gmail.com"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                mehtavedant1238@gmail.com
              </a>
            </div>
          </div>
          <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} StudySync. All rights reserved.</p>
            <p className="mt-1">Made by <span className="font-semibold text-foreground">Vedant Mehta</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
