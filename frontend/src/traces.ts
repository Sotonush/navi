import { t } from "./content";
import { postTrace } from "./net";
import { store } from "./state";
import { esc } from "./terminal";
import { timeAgo } from "./time";

const MAX_LENGTH = 140;

export class TracesPanel {
  private readonly list: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly field: HTMLInputElement;
  private readonly counter: HTMLElement;
  private readonly error: HTMLElement;

  constructor(root: HTMLElement) {
    this.list = root.querySelector(".traces-list")!;
    this.form = root.querySelector(".traces-form")!;
    this.field = root.querySelector(".traces-field")!;
    this.counter = root.querySelector(".traces-counter")!;
    this.error = root.querySelector(".traces-error")!;
    this.field.maxLength = MAX_LENGTH;
    this.field.addEventListener("input", () => this.count());
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submit();
    });
    store.on("traces", () => this.render());
    window.setInterval(() => this.render(), 30_000);
    this.count();
  }

  labels(): void {
    this.field.placeholder = t("traceInput");
    this.form.querySelector("button")!.textContent = t("send");
    this.render();
  }

  render(): void {
    if (!store.traces.length) {
      this.list.innerHTML = `<li class="empty">${t("tracesEmpty")}</li>`;
      return;
    }
    this.list.innerHTML = store.traces
      .map((trace) => `<li><div class="meta"><span class="accent">${esc(trace.handle)}</span><span>${timeAgo(trace.createdAt)}</span></div><p>${esc(trace.message)}</p></li>`)
      .join("");
  }

  private count(): void {
    this.counter.textContent = `${this.field.value.length}/${MAX_LENGTH}`;
  }

  private async submit(): Promise<void> {
    const message = this.field.value.trim();
    this.error.textContent = "";
    if (!message) return;
    if (!store.you) {
      this.error.textContent = t("traceNotConnected");
      return;
    }
    try {
      store.addTrace(await postTrace(store.you.handle, message));
      this.field.value = "";
      this.count();
    } catch (error) {
      this.error.textContent = (error as Error).message;
    }
  }
}
