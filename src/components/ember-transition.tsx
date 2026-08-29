import { useEffect, useRef } from "react";

type Origin = { x: number; y: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "ember" | "smoke" | "ash";
};

const DURATION = 1400;

/**
 * Burning-paper disintegration overlay: ignites at the tap point, then eats the
 * page outward with flame tongues, a charred edge, ash flakes and smoke —
 * clearing to transparency so the destination page is revealed underneath.
 */
export function EmberTransition({
  origin,
  onDone,
}: {
  origin: Origin;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const sheetColor =
      !bodyBg || bodyBg === "rgba(0, 0, 0, 0)" || bodyBg === "transparent"
        ? "#ffffff"
        : bodyBg;

    const maxR =
      Math.hypot(
        Math.max(origin.x, w - origin.x),
        Math.max(origin.y, h - origin.y),
      ) * 1.08;

    const N = 200;
    // Irregular, torn burn edge so it reads as paper rather than a circle.
    const wobble = Array.from(
      { length: N },
      (_, i) =>
        0.9 +
        0.06 * Math.sin(i * 0.55) +
        0.05 * Math.sin(i * 1.9 + 1.3) +
        Math.random() * 0.03,
    );
    const flick = Array.from({ length: N }, () => Math.random() * 6.28);
    const particles: Particle[] = [];

    const spawn = (radius: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const roll = Math.random();
        const kind: Particle["kind"] =
          roll < 0.3 ? "smoke" : roll < 0.52 ? "ash" : "ember";
        const speed =
          kind === "ash" ? 40 + Math.random() * 140 : 70 + Math.random() * 340;
        particles.push({
          x: origin.x + Math.cos(a) * radius,
          y: origin.y + Math.sin(a) * radius,
          vx: Math.cos(a) * speed * (kind === "smoke" ? 0.4 : 1),
          vy:
            Math.sin(a) * speed * (kind === "smoke" ? 0.4 : 1) -
            (kind === "smoke" ? 100 : 60),
          rot: Math.random() * 6.28,
          vrot: (Math.random() - 0.5) * 8,
          life: 0,
          maxLife:
            kind === "smoke"
              ? 0.7 + Math.random() * 0.5
              : kind === "ash"
                ? 0.8 + Math.random() * 0.7
                : 0.25 + Math.random() * 0.4,
          size:
            kind === "smoke"
              ? 16 + Math.random() * 28
              : kind === "ash"
                ? 2 + Math.random() * 5
                : 1 + Math.random() * 3,
          kind,
        });
      }
    };

    const edgeRadius = (t: number) => maxR * Math.pow(t, 0.6);

    let raf = 0;
    let start = 0;
    let last = 0;
    let finished = false;
    let fadeTimer = 0;

    const tracePath = (r: number) => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const rr = r * wobble[i % N];
        const px = origin.x + Math.cos(a) * rr;
        const py = origin.y + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const frame = (now: number) => {
      if (!start) {
        start = now;
        last = now;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = Math.min((now - start) / DURATION, 1);
      const r = edgeRadius(t);

      ctx.clearRect(0, 0, w, h);

      // The still-unburned page: an opaque sheet matching the page background.
      // The burning hole is punched out of it, so the destination page (already
      // mounted underneath) is revealed smoothly as the edge spreads outward.
      ctx.save();
      ctx.fillStyle = sheetColor;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
      tracePath(r);
      ctx.fill();
      ctx.restore();

      if (t < 1) {
        // Charred brown/black scorch band hugging the burn edge.
        ctx.save();
        tracePath(r);
        ctx.lineWidth = 16;
        ctx.strokeStyle = "rgba(24,14,9,0.85)";
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(58,28,12,0.9)";
        ctx.stroke();
        ctx.restore();

        // Flame tongues licking along the edge.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < N; i += 2) {
          const a = (i / N) * Math.PI * 2;
          const rr = r * wobble[i];
          const px = origin.x + Math.cos(a) * rr;
          const py = origin.y + Math.sin(a) * rr;
          const flame =
            20 + 16 * Math.abs(Math.sin(now / 90 + flick[i])) + Math.random() * 8;
          const g = ctx.createRadialGradient(px, py, 0, px, py, flame);
          g.addColorStop(0, "rgba(255,246,206,0.95)");
          g.addColorStop(0.28, "rgba(255,158,40,0.75)");
          g.addColorStop(0.6, "rgba(255,86,10,0.35)");
          g.addColorStop(1, "rgba(255,50,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py - flame * 0.25, flame, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        spawn(r, r < 40 ? 100 : 30);
      }

      // Embers, ash flakes and smoke.
      ctx.save();
      for (const p of particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        p.vy += (p.kind === "smoke" ? -70 : p.kind === "ash" ? 90 : 150) * dt;
        p.vx *= 0.97;
        const k = 1 - p.life / p.maxLife;
        if (k <= 0) continue;
        if (p.kind === "smoke") {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = k * 0.26;
          ctx.fillStyle = "#17110f";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.7 - k), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "ash") {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = Math.min(1, k * 1.4) * 0.9;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = "#241c18";
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
          ctx.restore();
        } else {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = k;
          ctx.fillStyle = k > 0.6 ? "#fff3c4" : k > 0.3 ? "#ff9a2e" : "#ff4d00";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life >= particles[i].maxLife) particles.splice(i, 1);
      }

      if (t >= 1 && !finished) {
        finished = true;
        canvas.style.transition = "opacity 380ms ease-out";
        canvas.style.opacity = "0";
        fadeTimer = window.setTimeout(() => doneRef.current(), 400);
      }
      if (t < 1 || particles.length > 0) {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [origin.x, origin.y]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[200] h-screen w-screen"
    />
  );
}
