import { lang, t } from "./content";

const UNITS: [number, Record<"en" | "ru", string>][] = [
  [86_400, { en: "d", ru: "д" }],
  [3_600, { en: "h", ru: "ч" }],
  [60, { en: "m", ru: "мин" }],
  [1, { en: "s", ru: "с" }],
];

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return t("now");
  const [size, label] = UNITS.find(([unit]) => seconds >= unit)!;
  return `${Math.floor(seconds / size)}${label[lang()]} ${t("ago")}`;
}

export function bishkekTime(): string {
  return new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Bishkek", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
