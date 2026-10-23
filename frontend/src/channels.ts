import { sound } from "./audio";
import { NODES, lang, t } from "./content";
import { esc } from "./terminal";

const STATIC_MS = 340;

export class Channels {
  private readonly screen: HTMLElement;
  private readonly noise: HTMLCanvasElement;
  private readonly knob: HTMLElement;
  private readonly label: HTMLElement;
  private index = 0;
  private staticUntil = 0;
  private angle = 0;
  private dragging?: { startAngle: number; startIndex: number };

  constructor(private readonly root: HTMLElement) {
    this.screen = root.querySelector(".tv-content")!;
    this.noise = root.querySelector(".tv-noise")!;
    this.knob = root.querySelector(".knob")!;
    this.label = root.querySelector(".tv-ch")!;
    root.querySelector(".ch-prev")!.addEventListener("click", () => this.tune(this.index - 1));
    root.querySelector(".ch-next")!.addEventListener("click", () => this.tune(this.index + 1));
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") this.tune(this.index + 1);
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") this.tune(this.index - 1);
    });
    this.knob.addEventListener("pointerdown", (event) => {
      this.knob.setPointerCapture(event.pointerId);
      this.dragging = { startAngle: this.pointerAngle(event), startIndex: this.index };
    });
    this.knob.addEventListener("pointermove", (event) => {
      if (!this.dragging) return;
      let delta = this.pointerAngle(event) - this.dragging.startAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const steps = Math.round(delta / 40);
      const target = this.dragging.startIndex + steps;
      if (this.wrap(target) !== this.index) this.tune(target);
    });
    this.knob.addEventListener("pointerup", () => (this.dragging = undefined));
    this.knob.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.tune(this.index + (event.deltaY > 0 ? 1 : -1));
    });
    this.render();
    requestAnimationFrame((time) => this.drawNoise(time));
  }

  refresh(): void {
    this.render();
  }

  tune(target: number): void {
    this.index = this.wrap(target);
    this.angle = this.index * 40;
    this.knob.style.transform = `rotate(${this.angle}deg)`;
    this.staticUntil = performance.now() + STATIC_MS;
    this.root.classList.add("tuning");
    sound.staticBurst();
    sound.blip(220 + this.index * 90, 0.06, 0.05);
    window.setTimeout(() => {
      this.render();
      this.root.classList.remove("tuning");
    }, STATIC_MS * 0.6);
  }

  private wrap(value: number): number {
    return ((value % NODES.length) + NODES.length) % NODES.length;
  }

  private pointerAngle(event: PointerEvent): number {
    const rect = this.knob.getBoundingClientRect();
    return (Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180) / Math.PI;
  }

  private render(): void {
    const node = NODES[this.index];
    const l = lang();
    const live = node.status === "ONLINE" || node.status === "RUNNING" || node.status === "HERE";
    this.label.textContent = `CH ${node.id}`;
    this.screen.innerHTML = `
      <div class="tv-top"><span>CH ${node.id} / 0${NODES.length}</span><span class="${live ? "onair" : "offair"}">● ${live ? t("onAir") : t("offAir")} · ${node.status}</span></div>
      <h3>${esc(node.title[l])}</h3>
      <p class="tv-role">${esc(node.role[l])} · ${esc(node.period[l])}</p>
      <ul>${node.points[l].map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
      <p class="tv-stack">${esc(node.stack)}</p>`;
  }

  private drawNoise(time: number): void {
    const canvas = this.noise;
    const active = time < this.staticUntil;
    const w = 160;
    const h = 120;
    if (canvas.width !== w) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(w, h);
    const level = active ? 255 : 70;
    for (let i = 0; i < image.data.length; i += 4) {
      const v = Math.random() * level;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = active ? 255 : 26;
    }
    ctx.putImageData(image, 0, 0);
    requestAnimationFrame((next) => this.drawNoise(next));
  }
}
