import "./styles.css";
import { sound } from "./audio";
import { boot } from "./boot";
import { Channels } from "./channels";
import { Circuit } from "./circuit";
import { lang, onLangChange, setLang, t } from "./content";
import { Ghosts } from "./ghosts";
import { Wired, fetchTraces } from "./net";
import { Scene } from "./scene";
import { store } from "./state";
import { Terminal, esc } from "./terminal";
import { bishkekTime } from "./time";
import { TracesPanel } from "./traces";

const scene = new Scene(document.querySelector<HTMLCanvasElement>("#scene")!);
const terminal = new Terminal(document.querySelector<HTMLElement>("#terminal")!);
const traces = new TracesPanel(document.querySelector<HTMLElement>("#traces")!);
const channels = new Channels(document.querySelector<HTMLElement>(".tv-big")!);
const circuit = new Circuit(document.querySelector<HTMLElement>(".circuit")!);

const wired = new Wired({
  state: (state) => store.setConnection(state),
  welcome: (you, visitors) => store.welcome(you, visitors),
  joined: (visitor) => store.join(visitor),
  left: (id) => store.leave(id),
  trace: (trace) => store.addTrace(trace),
  signal: (type, id, x, y) => (type === "CURSOR" ? store.cursor(id, x, y) : store.ping(id, x, y)),
});
new Ghosts((type, x, y) => wired.signal(type, x, y));

const layers = [...document.querySelectorAll<HTMLElement>(".layer")];
const wiredLayer = document.querySelector<HTMLElement>("#l5")!;
const hudLayer = document.querySelector<HTMLElement>(".hud-layer")!;
const rail = document.querySelector<HTMLElement>(".rail")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const clockEl = document.querySelector<HTMLElement>("#clock")!;
const langButton = document.querySelector<HTMLButtonElement>("#lang")!;
const soundButton = document.querySelector<HTMLButtonElement>("#sound")!;
const typed = document.querySelector<HTMLElement>(".typed")!;
let current = layers[0];
let descended = false;
let typing = false;

rail.innerHTML = layers.map((layer) => `<button type="button" data-target="${layer.id}" aria-label="layer ${layer.dataset.layer}"><span>${layer.dataset.layer}</span></button>`).join("");
rail.querySelectorAll<HTMLButtonElement>("button").forEach((button) =>
  button.addEventListener("click", () => document.getElementById(button.dataset.target!)!.scrollIntoView({ behavior: "smooth" })),
);

function onScroll(): void {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  const wiredFrom = max > 0 ? (wiredLayer.offsetTop - window.innerHeight * 0.45) / max : 0.6;
  scene.set(progress, wiredFrom);
  document.body.classList.toggle("in-wired", progress > wiredFrom);
  if (progress > wiredFrom && !descended) {
    descended = true;
    sound.descend();
  }
  if (progress < wiredFrom - 0.05) descended = false;
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

const reveal = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("in")),
  { threshold: 0.15 },
);
document.querySelectorAll("[data-reveal]").forEach((element) => reveal.observe(element));

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      current = entry.target as HTMLElement;
      renderLayer();
      if (current.id === "l2") void typeWhoami();
    });
  },
  { threshold: 0.5 },
);
layers.forEach((layer) => spy.observe(layer));

function renderLayer(): void {
  hudLayer.textContent = `LAYER:${current.dataset.layer} · ${t(current.dataset.name!)}`;
  rail.querySelectorAll<HTMLButtonElement>("button").forEach((button) => button.classList.toggle("active", button.dataset.target === current.id));
}

async function typeWhoami(force = false): Promise<void> {
  if ((typing || typed.dataset.done === lang()) && !force) return;
  typing = true;
  const text = t("l2.tv");
  const target = lang();
  typed.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (lang() !== target) break;
    typed.textContent += text[i];
    if (text[i] !== " " && text[i] !== "\n" && i % 2 === 0) sound.blip(1500 + Math.random() * 400, 0.012, 0.025);
    await new Promise((resolve) => window.setTimeout(resolve, text[i] === "\n" ? 140 : 18));
  }
  typed.dataset.done = target;
  typing = false;
}

function renderStatus(): void {
  const count = store.visitors.size;
  statusEl.dataset.state = store.connection;
  statusEl.textContent =
    store.connection === "online" ? `● ${count} ${t("online")}` : store.connection === "connecting" ? `○ ${t("connecting")}` : `○ ${t("offline")}`;
  document.querySelector(".online-count")!.textContent = String(Math.max(count, store.connection === "online" ? 1 : 0));
  document.querySelector(".visitor-list")!.innerHTML = [...store.visitors.values()]
    .map((visitor) => `<li class="${visitor.id === store.you?.id ? "you" : ""}">● ${esc(visitor.handle)}${visitor.id === store.you?.id ? ` <span>← ${t("you")}</span>` : ""}</li>`)
    .join("");
}

function renderSound(): void {
  soundButton.textContent = sound.enabled ? `♪ ${t("soundOn")}` : `♪ ${t("soundOff")}`;
  soundButton.setAttribute("aria-pressed", String(sound.enabled));
}

function renderLabels(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n!);
  });
  langButton.textContent = lang() === "ru" ? "EN" : "RU";
  terminal.placeholder();
  traces.labels();
  channels.refresh();
  circuit.refresh();
  renderStatus();
  renderSound();
  renderLayer();
  if (typed.dataset.done && typed.dataset.done !== lang()) void typeWhoami(true);
}

langButton.addEventListener("click", () => setLang(lang() === "ru" ? "en" : "ru"));
soundButton.addEventListener("click", () => {
  sound.toggle();
  renderSound();
});
document.querySelectorAll<HTMLButtonElement>("[data-cmd]").forEach((button) =>
  button.addEventListener("click", () => {
    terminal.run(button.dataset.cmd!);
    terminal.focus();
  }),
);

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let keys: string[] = [];
window.addEventListener("keydown", (event) => {
  if ((event.target as HTMLElement).closest("input, textarea")) return;
  keys = [...keys, event.key].slice(-10);
  const word = keys.slice(-4).join("").toLowerCase();
  if (word === "lain" || keys.join(",") === KONAMI.join(",")) {
    keys = [];
    lainMode();
  }
});

export function lainMode(): void {
  document.body.classList.add("lain");
  sound.staticBurst(0.9, 0.4);
  window.setTimeout(() => document.body.classList.remove("lain"), 3200);
}

window.addEventListener("navi:lain", lainMode);

onLangChange(renderLabels);
store.on("connection", renderStatus);
store.on("visitors", renderStatus);
window.setInterval(() => (clockEl.textContent = `${bishkekTime()} BKK`), 1000);
clockEl.textContent = `${bishkekTime()} BKK`;
document.documentElement.lang = lang();
renderLabels();
onScroll();

wired.connect();
fetchTraces()
  .then((list) => store.setTraces(list))
  .catch(() => store.setTraces([]));

void boot(document.querySelector<HTMLElement>("#boot")!, sound.wanted()).then(() => {
  renderSound();
  terminal.motd();
});
