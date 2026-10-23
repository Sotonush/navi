import { sound } from "./audio";
import { NODES, lang, t } from "./content";

interface Tech {
  name: string;
  nodes: string[];
}

interface Category {
  id: string;
  x: number;
  y: number;
  side: "left" | "right" | "bottom";
  techs: Tech[];
}

const ALL = ["01", "02", "03", "04", "05"];

const CATEGORIES: Category[] = [
  {
    id: "backend", x: 330, y: 150, side: "left",
    techs: [
      { name: "java 21", nodes: ALL },
      { name: "spring boot", nodes: ALL },
      { name: "spring security", nodes: ["01", "02", "04"] },
      { name: "hibernate", nodes: ["01", "02", "04"] },
      { name: "keycloak", nodes: ["02"] },
      { name: "websocket", nodes: ["01", "05"] },
    ],
  },
  {
    id: "tests", x: 330, y: 410, side: "left",
    techs: [
      { name: "junit 5", nodes: ["04", "05"] },
      { name: "mockito", nodes: ["04", "05"] },
      { name: "testcontainers", nodes: ["04", "05"] },
    ],
  },
  {
    id: "data", x: 670, y: 140, side: "right",
    techs: [
      { name: "postgresql", nodes: ALL },
      { name: "redis", nodes: ["01"] },
      { name: "flyway", nodes: ["01", "04", "05"] },
    ],
  },
  {
    id: "infra", x: 670, y: 380, side: "right",
    techs: [
      { name: "docker", nodes: ALL },
      { name: "github actions", nodes: ["04", "05"] },
      { name: "caddy", nodes: ["04"] },
      { name: "linux", nodes: ALL },
    ],
  },
  {
    id: "front", x: 500, y: 430, side: "bottom",
    techs: [
      { name: "react", nodes: ["02", "04"] },
      { name: "typescript", nodes: ["04", "05"] },
      { name: "canvas", nodes: ["05"] },
    ],
  },
];

const CENTER = { x: 500, y: 265 };

function techPosition(category: Category, index: number): { x: number; y: number } {
  const count = category.techs.length;
  if (category.side === "bottom") return { x: 500 + (index - (count - 1) / 2) * 150, y: 525 };
  const x = category.side === "left" ? 92 : 908;
  const y = category.y + (index - (count - 1) / 2) * 44;
  return { x, y };
}

function link(from: { x: number; y: number }, to: { x: number; y: number }, vertical = false): string {
  if (vertical) {
    const midY = (from.y + to.y) / 2;
    return `M${from.x} ${from.y} V${midY} H${to.x} V${to.y}`;
  }
  const midX = (from.x + to.x) / 2;
  return `M${from.x} ${from.y} H${midX} V${to.y} H${to.x}`;
}

export class Circuit {
  private readonly svg: SVGSVGElement;
  private readonly readout: HTMLElement;

  constructor(root: HTMLElement) {
    this.svg = root.querySelector("svg")!;
    this.readout = root.querySelector(".circuit-readout")!;
    this.render();
    this.svg.addEventListener("pointerover", (event) => {
      const target = (event.target as Element).closest<SVGGElement>("[data-tech], [data-cat]");
      if (target) this.light(target.dataset.cat, target.dataset.tech);
    });
    this.svg.addEventListener("pointerleave", () => this.light());
  }

  refresh(): void {
    this.light();
  }

  private render(): void {
    const traces: string[] = [];
    const chips: string[] = [];
    CATEGORIES.forEach((category) => {
      const centerEdge = category.side === "bottom"
        ? { x: CENTER.x, y: CENTER.y + 30 }
        : { x: CENTER.x + (category.x < CENTER.x ? -70 : 70), y: CENTER.y + (category.y < CENTER.y ? -14 : 14) };
      traces.push(`<path class="trace" data-cat="${category.id}" d="${link(centerEdge, category, category.side === "bottom")}"/>`);
      category.techs.forEach((tech, index) => {
        const p = techPosition(category, index);
        const from = category.side === "bottom" ? { x: category.x, y: category.y + 16 } : { x: category.x + (category.side === "left" ? -60 : 60), y: category.y };
        const to = category.side === "bottom" ? { x: p.x, y: p.y - 16 } : { x: p.x + (category.side === "left" ? 70 : -70), y: p.y };
        traces.push(`<path class="trace" data-cat="${category.id}" data-tech="${tech.name}" d="${link(from, to, category.side === "bottom")}"/>`);
        chips.push(`<g class="chip tech" data-cat="${category.id}" data-tech="${tech.name}" transform="translate(${p.x} ${p.y})"><rect x="-70" y="-15" width="140" height="30"/><text>${tech.name}</text></g>`);
      });
      chips.push(`<g class="chip cat" data-cat="${category.id}" transform="translate(${category.x} ${category.y})"><rect x="-60" y="-16" width="120" height="32"/><text>${category.id}</text><circle cx="-60" cy="0" r="3"/><circle cx="60" cy="0" r="3"/></g>`);
    });
    this.svg.innerHTML = `
      <defs><pattern id="pcb" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#2a2422"/></pattern></defs>
      <rect width="1000" height="560" fill="url(#pcb)"/>
      ${traces.join("")}
      ${chips.join("")}
      <g class="chip core" transform="translate(${CENTER.x} ${CENTER.y})"><rect x="-70" y="-30" width="140" height="60"/><text y="-4">AMIR</text><text class="sub" y="14">core · 2024 → now</text></g>`;
  }

  private light(category?: string, tech?: string): void {
    this.svg.querySelectorAll<SVGElement>(".trace, .chip").forEach((element) => {
      const matchCat = !!category && element.dataset.cat === category;
      const matchTech = !tech || !element.dataset.tech || element.dataset.tech === tech;
      element.classList.toggle("live", matchCat && matchTech);
    });
    this.svg.querySelector(".core")!.classList.toggle("live", !!category);
    if (!category) {
      this.readout.innerHTML = t("circuitHint");
      return;
    }
    sound.blip(tech ? 1200 : 700, 0.03, 0.04);
    const cat = CATEGORIES.find((candidate) => candidate.id === category)!;
    const nodes = tech ? cat.techs.find((candidate) => candidate.name === tech)!.nodes : [...new Set(cat.techs.flatMap((candidate) => candidate.nodes))];
    const titles = nodes.map((id) => `<span class="accent">${id}</span> ${NODES.find((node) => node.id === id)!.title[lang()]}`);
    this.readout.innerHTML = `<b>${tech ?? category}</b> → ${titles.join(" · ")}`;
  }
}
