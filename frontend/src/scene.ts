import { sound } from "./audio";
import { lang } from "./content";
import { store } from "./state";

type RGB = [number, number, number];

interface Building {
  x: number;
  w: number;
  h: number;
  seed: number;
}

interface Layer {
  factor: number;
  color: string;
  window: string;
  buildings: Building[];
}

interface Bird {
  span: number;
  wire: number;
  t: number;
  flying: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wing: number;
  restAt: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Ring {
  z: number;
  seed: number;
}

const STREET_LENGTH = 3400;
const POLE_SPACING = 460;
const SPANS = Math.ceil(STREET_LENGTH / POLE_SPACING) + 8;
const WIRE_OFFSETS: [number, number][] = [
  [-44, 14],
  [44, 14],
  [-30, 40],
  [30, 40],
];
const GLYPHS = "01ｱｲｳｴｵｶｷｸｹｺﾜｲﾔｰﾄﾞ7ΛΔ∴⊕#@%&*+=<>/\\|".split("");
const WORDS = ["protocol 7", "layer", "present day", "present time", "copland", "knights", "wired", "navi", "no matter where you go", "everyone is connected", "java 21", "spring boot", "postgresql", "websocket"];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth(edge0: number, edge1: number, value: number): number {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function mix(a: RGB, b: RGB, k: number): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}

export class Scene {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private progress = 0;
  private wiredFrom = 0.6;
  private readonly mouse = { x: -999, y: -999, px: 0.5, py: 0.5, active: false };
  private readonly layers: Layer[];
  private readonly birds: Bird[] = [];
  private sparks: Spark[] = [];
  private readonly rings: Ring[] = [];
  private readonly disturb = new Map<string, number>();
  private sun?: HTMLCanvasElement;
  private last = performance.now();
  private readonly reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    const random = mulberry32(7);
    this.layers = [
      { factor: 0.16, color: "#1d0b17", window: "rgba(255, 196, 140, 0.20)", buildings: [] },
      { factor: 0.36, color: "#12070f", window: "rgba(255, 186, 120, 0.42)", buildings: [] },
      { factor: 0.62, color: "#090407", window: "rgba(255, 214, 150, 0.62)", buildings: [] },
    ];
    this.layers.forEach((layer, index) => {
      let x = -400;
      while (x < STREET_LENGTH * layer.factor + 3000) {
        const w = 50 + random() * (index === 0 ? 90 : 130);
        const h = (index === 0 ? 0.2 : index === 1 ? 0.14 : 0.08) + random() * (index === 0 ? 0.22 : 0.2);
        layer.buildings.push({ x, w, h, seed: random() });
        x += w + random() * (index === 2 ? 60 : 14);
      }
    });
    for (let span = 0; span < SPANS; span++) {
      if (random() < 0.55) {
        this.birds.push({ span, wire: Math.floor(random() * 4), t: 0.2 + random() * 0.6, flying: false, x: 0, y: 0, vx: 0, vy: 0, wing: random() * 6, restAt: 0 });
      }
    }
    for (let i = 0; i < 26; i++) this.rings.push({ z: (i + 1) / 26, seed: random() });
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      this.mouse.px = event.clientX / window.innerWidth;
      this.mouse.py = event.clientY / window.innerHeight;
      this.mouse.active = true;
    });
    document.addEventListener("pointerleave", () => (this.mouse.active = false));
    this.resize();
    requestAnimationFrame((time) => this.frame(time));
  }

  set(progress: number, wiredFrom: number): void {
    this.progress = progress;
    this.wiredFrom = wiredFrom;
  }

  private resize(): void {
    this.ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.ratio);
    this.canvas.height = Math.round(this.height * this.ratio);
    this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.buildSun();
  }

  private buildSun(): void {
    const radius = Math.min(this.width, this.height) * 0.14;
    const size = Math.ceil(radius * 2 + 4);
    const sun = document.createElement("canvas");
    sun.width = size;
    sun.height = size;
    const ctx = sun.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, "#ffe0b0");
    gradient.addColorStop(0.6, "#ff7a48");
    gradient.addColorStop(1, "#ff3347");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 7; i++) {
      const y = size * 0.52 + i * i * size * 0.012 + i * size * 0.035;
      ctx.fillRect(0, y, size, 2 + i * 1.3);
    }
    this.sun = sun;
  }

  private frame(time: number): void {
    const dt = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    const t = this.reduced ? 0 : time / 1000;
    const wired = smooth(this.wiredFrom - 0.05, this.wiredFrom + 0.04, this.progress);
    const { ctx } = this;
    ctx.globalAlpha = 1;
    if (wired < 1) this.street(t, dt);
    if (wired > 0) {
      ctx.globalAlpha = wired;
      this.wired(t, dt);
      ctx.globalAlpha = 1;
    }
    const edge = Math.abs(this.progress - this.wiredFrom);
    if (!this.reduced && edge < 0.05) this.tear(1 - edge / 0.05);
    requestAnimationFrame((next) => this.frame(next));
  }

  private street(t: number, dt: number): void {
    const { ctx, width: W, height: H } = this;
    const sp = clamp01(this.progress / Math.max(0.01, this.wiredFrom));
    const cam = sp * STREET_LENGTH;
    const ground = H * 0.8;
    const tiltX = (this.mouse.px - 0.5) * 30;
    const tiltY = (this.mouse.py - 0.5) * 12;

    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, mix([92, 10, 14], [22, 6, 34], sp));
    sky.addColorStop(0.62, mix([190, 54, 38], [84, 20, 70], sp));
    sky.addColorStop(1, mix([255, 120, 70], [150, 40, 90], sp));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, ground + 2);

    if (this.sun) {
      const size = this.sun.width;
      const x = W * 0.7 - size / 2 - tiltX * 0.1;
      const y = H * 0.36 - size / 2 + sp * H * 0.34;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, ground);
      ctx.clip();
      ctx.globalAlpha *= 0.95 - sp * 0.4;
      ctx.drawImage(this.sun, x, y);
      ctx.restore();
    }

    this.layers.forEach((layer, index) => {
      const offset = cam * layer.factor + tiltX * (index + 1) * 0.25;
      ctx.fillStyle = layer.color;
      for (const building of layer.buildings) {
        const x = building.x - offset;
        if (x > W || x + building.w < 0) continue;
        const h = building.h * H;
        const top = ground - h + tiltY * (index + 1) * 0.2;
        ctx.fillStyle = layer.color;
        ctx.fillRect(x, top, building.w, ground - top + 2);
        if (building.seed > 0.7) ctx.fillRect(x + building.w * 0.4, top - 18, 2, 18);
        const cols = Math.max(1, Math.floor(building.w / 14));
        const rows = Math.max(1, Math.floor(h / 18));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const key = building.seed * 997 + r * 31 + c * 7;
            const lit = (Math.sin(key) + 1) / 2;
            const flick = (Math.sin(key * 3.1 + Math.floor(t / 4 + building.seed * 9)) + 1) / 2;
            if (lit > 0.74 && flick > 0.2) {
              ctx.fillStyle = layer.window;
              ctx.fillRect(x + 4 + c * 14, top + 8 + r * 18, 5 + index, 6 + index);
            }
          }
        }
      }
    });

    ctx.fillStyle = "#050304";
    ctx.fillRect(0, ground, W, H - ground);
    const road = ctx.createLinearGradient(0, ground, 0, H);
    road.addColorStop(0, "rgba(255, 90, 60, 0.10)");
    road.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = road;
    ctx.fillRect(0, ground, W, H - ground);

    const poleH = H * 0.56;
    const top = ground - poleH;
    const first = Math.floor((cam - 200) / POLE_SPACING);
    const poleX = (i: number) => i * POLE_SPACING - cam + W * 0.25 - tiltX;

    for (let i = first; i < first + Math.ceil(W / POLE_SPACING) + 3; i++) {
      const x = poleX(i);
      this.shadow(x, ground + 22 + (H - ground) * 0.2, i, t);
    }

    for (let i = first - 1; i < first + Math.ceil(W / POLE_SPACING) + 3; i++) {
      const a = poleX(i);
      const b = poleX(i + 1);
      WIRE_OFFSETS.forEach(([dx, dy], w) => {
        const key = `${i}:${w}`;
        const push = this.disturb.get(key) ?? 0;
        const sway = Math.sin(t * 1.3 + i * 0.7 + w) * 2.5;
        const y0 = top + dy;
        const sag = 34 + w * 4 + sway + push * Math.sin(t * 18) * 0.4 + push;
        const cx = (a + b) / 2 + dx;
        const cy = y0 + sag * 2;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(a + dx, y0);
        ctx.quadraticCurveTo(cx, cy, b + dx, y0);
        ctx.stroke();
        this.touchWire(key, a + dx, y0, cx, cy, b + dx, push, dt);
        this.birds
          .filter((bird) => bird.span === ((i % SPANS) + SPANS) % SPANS && bird.wire === w)
          .forEach((bird) => this.bird(bird, a + dx, y0, cx, cy, b + dx, t, dt));
      });
    }

    for (let i = first; i < first + Math.ceil(W / POLE_SPACING) + 3; i++) {
      const x = poleX(i);
      ctx.fillStyle = "#000";
      ctx.fillRect(x - 4, top, 8, poleH + 4);
      ctx.fillRect(x - 58, top + 10, 116, 5);
      ctx.fillRect(x - 42, top + 36, 84, 5);
      for (const [dx, dy] of WIRE_OFFSETS) ctx.fillRect(x + dx - 2, top + dy - 8, 4, 8);
      ctx.fillRect(x + 10, top + 64, 22, 30);
      ctx.fillRect(x + 4, top + 74, 8, 3);
    }

    this.drawSparks(dt);
    this.disturb.forEach((value, key) => {
      const next = value * Math.pow(0.04, dt);
      if (next < 0.2) this.disturb.delete(key);
      else this.disturb.set(key, next);
    });
  }

  private shadow(x: number, y: number, seed: number, t: number): void {
    const { ctx } = this;
    const random = mulberry32(seed * 131 + 17);
    ctx.save();
    ctx.translate(x - 30, y);
    ctx.scale(1, 0.22);
    ctx.fillStyle = "rgba(60, 0, 8, 0.85)";
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();
    for (let k = 0; k < 22; k++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * 62;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + k);
      ctx.fillStyle = `rgba(255, 32, 48, ${0.35 + pulse * 0.55})`;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 3 + random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private touchWire(key: string, x0: number, y0: number, cx: number, cy: number, x1: number, push: number, dt: number): void {
    if (!this.mouse.active) return;
    for (let s = 0; s <= 16; s++) {
      const k = s / 16;
      const inv = 1 - k;
      const x = inv * inv * x0 + 2 * inv * k * cx + k * k * x1;
      const y = inv * inv * y0 + 2 * inv * k * cy + k * k * y0;
      if (Math.hypot(this.mouse.x - x, this.mouse.y - y) < 16) {
        this.disturb.set(key, Math.min(26, push + 60 * dt + 6));
        for (let n = 0; n < 3; n++) {
          this.sparks.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 180, life: 0.4 + Math.random() * 0.4 });
        }
        sound.crackle();
        return;
      }
    }
  }

  private drawSparks(dt: number): void {
    const { ctx } = this;
    this.sparks = this.sparks.filter((spark) => (spark.life -= dt) > 0);
    for (const spark of this.sparks) {
      spark.vy += 520 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      ctx.fillStyle = spark.life > 0.3 ? "#fff6d0" : "#ffb347";
      ctx.fillRect(spark.x, spark.y, 2, 2);
    }
    if (this.sparks.length > 400) this.sparks.splice(0, this.sparks.length - 400);
  }

  private bird(bird: Bird, x0: number, y0: number, cx: number, cy: number, x1: number, t: number, dt: number): void {
    const { ctx } = this;
    const k = bird.t;
    const inv = 1 - k;
    const sx = inv * inv * x0 + 2 * inv * k * cx + k * k * x1;
    const sy = inv * inv * y0 + 2 * inv * k * cy + k * k * y0;
    if (!bird.flying) {
      bird.x = sx;
      bird.y = sy;
      if (this.mouse.active && Math.hypot(this.mouse.x - sx, this.mouse.y - sy) < 80) {
        bird.flying = true;
        bird.vx = (this.mouse.x < sx ? 1 : -1) * (120 + Math.random() * 120);
        bird.vy = -160 - Math.random() * 80;
        bird.restAt = t + 7 + Math.random() * 5;
      }
    } else {
      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      bird.vy += 30 * dt;
      bird.wing += dt * 22;
      if (t > bird.restAt && (bird.y < -40 || bird.x < -60 || bird.x > this.width + 60)) bird.flying = false;
    }
    const flap = bird.flying ? Math.sin(bird.wing) * 7 : 1.5 + Math.sin(t * 2 + bird.t * 9) * 0.5;
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(bird.x, bird.y - 5, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.x + 4, bird.y - 8, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bird.x - 6, bird.y - 5);
    ctx.lineTo(bird.x - 1, bird.y - 5 - flap);
    ctx.lineTo(bird.x + 3, bird.y - 5);
    ctx.stroke();
  }

  private wired(t: number, dt: number): void {
    const { ctx, width: W, height: H } = this;
    const vx = W / 2 + (this.mouse.px - 0.5) * W * 0.25;
    const vy = H / 2 + (this.mouse.py - 0.5) * H * 0.2;
    const local = clamp01((this.progress - this.wiredFrom) / Math.max(0.01, 1 - this.wiredFrom));
    const bg = ctx.createRadialGradient(vx, vy, 0, vx, vy, Math.max(W, H) * 0.8);
    bg.addColorStop(0, mix([40, 10, 70], [70, 8, 30], local));
    bg.addColorStop(0.5, "#0b0418");
    bg.addColorStop(1, "#030106");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const base = Math.min(W, H) * 0.06;
    const speed = 0.08 + local * 0.06;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const ring of this.rings) {
      ring.z -= dt * speed;
      if (ring.z < 0.04) {
        ring.z = 1;
        ring.seed = Math.random();
      }
      const r = base / ring.z;
      const alpha = smooth(1, 0.55, ring.z) * smooth(0.04, 0.16, ring.z) * 0.55;
      const count = 16;
      const size = Math.max(8, Math.min(46, 9 / ring.z));
      ctx.font = `${size}px 'IBM Plex Mono', monospace`;
      ctx.strokeStyle = `rgba(160, 107, 255, ${alpha * 0.25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(vx, vy, r, 0, Math.PI * 2);
      ctx.stroke();
      const random = mulberry32(Math.floor(ring.seed * 1e6));
      for (let g = 0; g < count; g++) {
        const angle = (g / count) * Math.PI * 2 + t * 0.08 * (ring.seed > 0.5 ? 1 : -1) + ring.seed * 6;
        const pick = random();
        const text = pick > 0.975 ? WORDS[Math.floor(random() * WORDS.length)] : GLYPHS[Math.floor(random() * GLYPHS.length)];
        const tone = random();
        ctx.fillStyle = tone > 0.9 ? `rgba(255, 51, 71, ${alpha})` : tone > 0.55 ? `rgba(46, 230, 255, ${alpha * 0.8})` : `rgba(190, 160, 255, ${alpha * 0.7})`;
        ctx.fillText(text, vx + Math.cos(angle) * r, vy + Math.sin(angle) * r);
      }
    }

    const traces = store.traces.slice(0, 10);
    ctx.font = "14px 'IBM Plex Mono', monospace";
    traces.forEach((trace, index) => {
      const seed = hash(trace.id);
      const z = 1 - ((seed + t * 0.025 + index * 0.1) % 1);
      if (z < 0.12) return;
      const angle = seed * Math.PI * 2;
      const r = (base * 2.4) / z;
      const x = vx + Math.cos(angle) * r;
      const y = vy + Math.sin(angle) * r * 0.7;
      const alpha = smooth(1, 0.7, z) * smooth(0.12, 0.3, z);
      const size = Math.max(11, Math.min(30, 12 / z));
      ctx.font = `${size}px 'IBM Plex Mono', monospace`;
      ctx.fillStyle = `rgba(242, 239, 233, ${alpha})`;
      ctx.fillText(`“${trace.message.length > 48 ? trace.message.slice(0, 47) + "…" : trace.message}”`, x, y);
      ctx.font = `${Math.max(9, size * 0.6)}px 'IBM Plex Mono', monospace`;
      ctx.fillStyle = `rgba(255, 51, 71, ${alpha})`;
      ctx.fillText(trace.handle, x, y + size * 0.9);
    });

    const flash = store.lastFlash && performance.now() - store.lastFlash.at < 2400 ? store.lastFlash : undefined;
    const visitors = [...store.visitors.values()];
    visitors.forEach((visitor) => {
      const seed = hash(visitor.id);
      const angle = seed * Math.PI * 2 + t * 0.05;
      const depth = 0.45 + hash(visitor.id + "z") * 0.4 + Math.sin(t * 0.6 + seed * 9) * 0.04;
      const r = (base * 3.2) / depth;
      const x = vx + Math.cos(angle) * r;
      const y = vy + Math.sin(angle) * r * 0.62;
      const isYou = visitor.id === store.you?.id;
      const color = isYou ? "46, 230, 255" : "242, 239, 233";
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
      glow.addColorStop(0, `rgba(${color}, 0.55)`);
      glow.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - 22, y - 22, 44, 44);
      ctx.fillStyle = `rgb(${color})`;
      ctx.beginPath();
      ctx.arc(x, y, isYou ? 4.5 : 3.2, 0, Math.PI * 2);
      ctx.fill();
      if (flash?.handle === visitor.handle) {
        const k = (performance.now() - flash.at) / 2400;
        ctx.strokeStyle = `rgba(255, 51, 71, ${1 - k})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8 + k * 60, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = `rgba(${color}, 0.85)`;
      ctx.fillText(isYou ? `${visitor.handle} · ${lang() === "ru" ? "ты" : "you"}` : visitor.handle, x, y - 14);
    });
  }

  private tear(strength: number): void {
    const { ctx, canvas, width: W, height: H, ratio } = this;
    const slices = Math.floor(3 + strength * 9);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < slices; i++) {
      const y = Math.random() * H;
      const h = 4 + Math.random() * 40 * strength;
      const dx = (Math.random() - 0.5) * 80 * strength;
      ctx.drawImage(canvas, 0, y * ratio, W * ratio, h * ratio, dx * ratio, y * ratio, W * ratio, h * ratio);
    }
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 51, 71, ${0.08 * strength})`;
    ctx.fillRect(0, 0, W * ratio, H * ratio);
    ctx.restore();
  }
}
