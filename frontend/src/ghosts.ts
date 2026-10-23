import { sound } from "./audio";
import type { SignalType } from "./net";
import { store } from "./state";
import { esc } from "./terminal";

const IDLE_MS = 6000;
const SEND_EVERY_MS = 60;

export class Ghosts {
  private readonly layer: HTMLElement;
  private readonly nodes = new Map<string, HTMLElement>();
  private lastSent = 0;

  constructor(private readonly send: (type: SignalType, x: number, y: number) => void) {
    this.layer = document.createElement("div");
    this.layer.className = "ghosts";
    document.body.append(this.layer);
    store.on("cursor", () => this.render());
    store.on("ping", () => {
      const ping = store.lastPing;
      if (ping) this.ripple(ping.x, ping.y, store.handleOf(ping.id), false);
    });
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - this.lastSent < SEND_EVERY_MS) return;
      this.lastSent = now;
      const [x, y] = this.normalize(event.pageX, event.pageY);
      this.send("CURSOR", x, y);
    });
    window.addEventListener("pointerdown", (event) => {
      if ((event.target as HTMLElement).closest("a, button, input, textarea, .tv, .circuit, .win, form, #boot")) return;
      const [x, y] = this.normalize(event.pageX, event.pageY);
      this.send("PING", x, y);
      this.ripple(x, y, store.you?.handle ?? "", true);
    });
    window.setInterval(() => this.render(), 1000);
  }

  private normalize(pageX: number, pageY: number): [number, number] {
    const doc = document.documentElement;
    return [pageX / doc.scrollWidth, pageY / doc.scrollHeight];
  }

  private place(element: HTMLElement, x: number, y: number): void {
    const doc = document.documentElement;
    element.style.transform = `translate(${x * doc.scrollWidth}px, ${y * doc.scrollHeight}px)`;
  }

  private render(): void {
    const now = performance.now();
    for (const [id, node] of this.nodes) {
      const ghost = store.ghosts.get(id);
      if (!ghost || now - ghost.at > IDLE_MS) {
        node.classList.add("fade");
        if (!ghost || now - ghost.at > IDLE_MS + 800) {
          node.remove();
          this.nodes.delete(id);
        }
      }
    }
    for (const ghost of store.ghosts.values()) {
      if (now - ghost.at > IDLE_MS) continue;
      let node = this.nodes.get(ghost.id);
      if (!node) {
        node = document.createElement("div");
        node.className = "ghost";
        node.innerHTML = `<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><path d="M11 1v6M11 15v6M1 11h6M15 11h6" stroke="currentColor" stroke-width="1.5"/><circle cx="11" cy="11" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>${esc(store.handleOf(ghost.id))}</span>`;
        this.layer.append(node);
        this.nodes.set(ghost.id, node);
      }
      node.classList.remove("fade");
      this.place(node, ghost.x, ghost.y);
    }
  }

  private ripple(x: number, y: number, handle: string, own: boolean): void {
    const node = document.createElement("div");
    node.className = own ? "ripple own" : "ripple";
    node.innerHTML = `<i></i><i></i><span>${esc(handle)}</span>`;
    this.layer.append(node);
    this.place(node, x, y);
    sound.ping();
    window.setTimeout(() => node.remove(), 1600);
  }
}
