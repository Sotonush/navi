import { NODES, PROFILE, STACK, lang, setLang, t } from "./content";
import { postTrace } from "./net";
import { store } from "./state";
import { timeAgo } from "./time";

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

const COMMANDS = ["help", "whoami", "nodes", "node", "stack", "contact", "cv", "who", "traces", "trace", "lang", "clear", "date", "lain", "history", "echo", "sudo", "exit"];
const HELP_ORDER = ["whoami", "nodes", "node", "stack", "contact", "cv", "who", "traces", "trace", "lang", "clear"];

const LAIN = String.raw`
   _      _    ___ _  _
  | |    /_\  |_ _| \| |
  | |__ / _ \  | || .  |
  |____/_/ \_\|___|_|\_|
`;

export class Terminal {
  private readonly output: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly prompt: HTMLElement;
  private readonly history: string[] = [];
  private cursor = 0;

  constructor(root: HTMLElement) {
    this.output = root.querySelector(".term-output")!;
    this.input = root.querySelector(".term-input")!;
    this.prompt = root.querySelector(".term-prompt")!;
    root.addEventListener("click", (event) => {
      if (!(event.target as HTMLElement).closest("a, button") && !window.getSelection()?.toString()) this.input.focus();
    });
    this.input.addEventListener("keydown", (event) => this.key(event));
    store.on("visitors", () => this.renderPrompt());
    this.renderPrompt();
  }

  focus(): void {
    this.input.focus({ preventScroll: true });
  }

  placeholder(): void {
    this.input.placeholder = t("placeholder");
  }

  motd(): void {
    this.print(`<span class="dim">Copland OS Enterprise · NAVI ${lang() === "ru" ? "готова" : "ready"}</span>`);
    this.print(t("motd"));
    this.print("");
  }

  run(raw: string, echo = true): void {
    const line = raw.trim();
    if (echo) this.print(`<span class="prompt-echo">${esc(this.promptText())}</span> ${esc(line)}`);
    if (!line) return;
    this.history.push(line);
    this.cursor = this.history.length;
    const [name, ...args] = line.split(/\s+/);
    const command = name.toLowerCase();
    const rest = line.slice(name.length).trim();
    switch (command) {
      case "help":
        this.print(`<span class="dim">${t("help")}</span>`);
        HELP_ORDER.forEach((key) => this.print(`  <b>${key.padEnd(8)}</b> <span class="dim">${t(`help.${key}`)}</span>`));
        break;
      case "whoami":
        this.print(`<b class="big">${PROFILE.name.toLowerCase()}</b>`);
        this.print(esc(t("whoami")));
        break;
      case "nodes":
        NODES.forEach((node) => this.print(`  <span class="dim">node:${node.id}</span> ${this.status(node.status)} <b>${node.title[lang()]}</b> <span class="dim">— ${node.role[lang()]}</span>`));
        this.print(`<span class="dim">${t("nodesHint")}</span>`);
        break;
      case "node":
        this.node(args[0] ?? "");
        break;
      case "stack":
        STACK.forEach(([layer, items]) => this.print(`  <span class="accent">${layer.padEnd(8)}</span> ${items}`));
        break;
      case "contact":
        this.print(`<span class="dim">${t("contact")}</span>`);
        Object.entries(PROFILE.links).forEach(([name, href]) => this.print(`  <span class="dim">${name.padEnd(9)}</span> <a href="${href}" target="_blank" rel="noopener">${href.replace(/^mailto:|^https:\/\//, "")}</a>`));
        break;
      case "cv": {
        const which = args[0] === "ru" || args[0] === "en" ? args[0] : lang();
        this.print(`<span class="dim">${t("cvOpened")}:</span> <a href="${PROFILE.cv[which]}" target="_blank" rel="noopener">${PROFILE.cv[which]}</a>`);
        window.open(PROFILE.cv[which], "_blank", "noopener");
        break;
      }
      case "who":
        this.who();
        break;
      case "traces":
        this.traces();
        break;
      case "trace":
        void this.trace(rest);
        break;
      case "lang":
        if (args[0] === "ru" || args[0] === "en") {
          setLang(args[0]);
          this.print(t("langSet"));
        } else {
          this.print(`<span class="dim">lang en | lang ru</span>`);
        }
        break;
      case "clear":
        this.output.innerHTML = "";
        break;
      case "date":
        this.print(`present day. present time. <span class="dim">${new Date().toLocaleString(lang() === "ru" ? "ru-RU" : "en-GB", { timeZone: "Asia/Bishkek" })} · bishkek</span>`);
        break;
      case "lain":
        this.print(`<pre class="ascii">${LAIN}</pre>`);
        this.print(`<span class="accent">let's all love lain.</span>`);
        window.dispatchEvent(new Event("navi:lain"));
        break;
      case "history":
        this.history.forEach((entry, index) => this.print(`  <span class="dim">${String(index + 1).padStart(3)}</span> ${esc(entry)}`));
        break;
      case "echo":
        this.print(esc(rest));
        break;
      case "sudo":
        this.print(`<span class="accent">${t("sudo")}</span>`);
        break;
      case "exit":
      case "logout":
        this.print(t("exit"));
        break;
      default:
        this.print(`${t("notFound")}: <span class="accent">${esc(command)}</span>. ${t("tryHelp")}`);
    }
  }

  print(html: string): void {
    const line = document.createElement("div");
    line.className = "line";
    line.innerHTML = html || "&nbsp;";
    this.output.append(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  private node(id: string): void {
    const node = NODES.find((candidate) => candidate.id === id.padStart(2, "0"));
    if (!node) {
      this.print(t("nodeMissing"));
      return;
    }
    this.print(`<span class="dim">node:${node.id}</span> ${this.status(node.status)}`);
    this.print(`<b class="big">${node.title[lang()]}</b>`);
    this.print(`<span class="dim">${node.role[lang()]} · ${node.period[lang()]}</span>`);
    node.points[lang()].forEach((point) => this.print(`  <span class="accent">▸</span> ${esc(point)}`));
    this.print(`  <span class="dim">${node.stack}</span>`);
  }

  private who(): void {
    if (store.connection !== "online") {
      this.print(t("whoOffline"));
      return;
    }
    const visitors = [...store.visitors.values()];
    this.print(`<span class="dim">${t("who")}: ${visitors.length}</span>`);
    visitors.forEach((visitor) => {
      const you = visitor.id === store.you?.id ? ` <span class="cyan">← ${t("you")}</span>` : "";
      this.print(`  ● ${esc(visitor.handle)} <span class="dim">${timeAgo(visitor.connectedAt)}</span>${you}`);
    });
    if (visitors.length <= 1) this.print(`<span class="dim">${t("whoEmpty")}</span>`);
  }

  private traces(): void {
    if (!store.traces.length) {
      this.print(t("tracesEmpty"));
      return;
    }
    this.print(`<span class="dim">${t("traces")}</span>`);
    store.traces.slice(0, 10).forEach((trace) => this.print(`  <span class="accent">${esc(trace.handle)}</span> <span class="dim">${timeAgo(trace.createdAt)}</span> ${esc(trace.message)}`));
  }

  private async trace(message: string): Promise<void> {
    if (!message) {
      this.print(t("traceUsage"));
      return;
    }
    if (!store.you) {
      this.print(t("traceNotConnected"));
      return;
    }
    try {
      const trace = await postTrace(store.you.handle, message);
      store.addTrace(trace);
      this.print(`<span class="accent">✓</span> ${t("traceSent")}`);
    } catch (error) {
      this.print(`<span class="accent">✗</span> ${esc((error as Error).message)}`);
    }
  }

  private status(status: string): string {
    const live = status === "ONLINE" || status === "RUNNING" || status === "HERE";
    return `<span class="${live ? "accent" : "dim"}">[${status}]</span>`;
  }

  private promptText(): string {
    return `${store.you?.handle ?? "guest"}@wired:~$`;
  }

  private renderPrompt(): void {
    this.prompt.textContent = this.promptText();
  }

  private key(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      const value = this.input.value;
      this.input.value = "";
      this.run(value);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (this.cursor > 0) this.input.value = this.history[--this.cursor];
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      this.cursor = Math.min(this.history.length, this.cursor + 1);
      this.input.value = this.history[this.cursor] ?? "";
    } else if (event.key === "Tab") {
      event.preventDefault();
      const value = this.input.value.trim().toLowerCase();
      const matches = COMMANDS.filter((command) => command.startsWith(value));
      if (matches.length === 1) this.input.value = `${matches[0]} `;
      else if (matches.length > 1) this.print(`<span class="dim">${matches.join("  ")}</span>`);
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      this.output.innerHTML = "";
    }
  }
}
