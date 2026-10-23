import { sound } from "./audio";
import { t } from "./content";

const LOG = [
  "Copland OS Enterprise · NAVI",
  "(c) Tachibana General Laboratories",
  "",
  "checking memory ........................ ok",
  "loading protocol 7 ..................... ok",
  "mounting /wired ........................ ok",
  "resolving node: amir suleimanov ........ ok",
  "syncing traces ......................... ok",
  "",
  "present day. present time.",
];

const SKIP_KEY = "navi.booted";

function wasBooted(): boolean {
  try {
    return sessionStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

function markBooted(): void {
  try {
    sessionStorage.setItem(SKIP_KEY, "1");
  } catch {
    return;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function boot(screen: HTMLElement, soundWanted: boolean): Promise<boolean | undefined> {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (wasBooted() || reduced) {
    screen.remove();
    return undefined;
  }
  const silent = screen.querySelector<HTMLButtonElement>(".boot-connect")!;
  const loud = screen.querySelector<HTMLButtonElement>(".boot-sound")!;
  silent.textContent = `[ ${t("connect")} ]`;
  loud.textContent = `[ ${t("connectSound")} ♪ ]`;
  (soundWanted ? loud : silent).focus();
  const withSound = await new Promise<boolean>((resolve) => {
    silent.addEventListener("click", () => resolve(false), { once: true });
    loud.addEventListener("click", () => {
      sound.enable();
      resolve(true);
    }, { once: true });
  });
  screen.classList.add("booting");
  const log = screen.querySelector<HTMLElement>(".boot-log")!;
  for (const line of LOG) {
    const row = document.createElement("div");
    row.textContent = line || " ";
    log.append(row);
    await wait(line.endsWith("ok") ? 130 : 240);
  }
  await wait(400);
  markBooted();
  screen.classList.add("gone");
  await wait(600);
  screen.remove();
  return withSound;
}
