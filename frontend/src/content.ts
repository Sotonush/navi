export type Lang = "en" | "ru";

export type NodeStatus = "ONLINE" | "RUNNING" | "ARCHIVED" | "OFFLINE" | "HERE";

export interface ProjectNode {
  id: string;
  status: NodeStatus;
  title: Record<Lang, string>;
  role: Record<Lang, string>;
  period: Record<Lang, string>;
  points: Record<Lang, string[]>;
  stack: string;
}

export const PROFILE = {
  name: "Amir Suleimanov",
  links: {
    linkedin: "https://www.linkedin.com/in/suleimanovamir/",
    github: "https://github.com/Sotonush",
    telegram: "https://t.me/suleimanovdev",
    mail: "mailto:suleimanovamirbk@gmail.com",
  },
  cv: {
    en: "/cv/amir-suleimanov-cv-en.pdf",
    ru: "/cv/amir-suleimanov-cv-ru.pdf",
  },
};

export const NODES: ProjectNode[] = [
  {
    id: "01",
    status: "ONLINE",
    title: { en: "e-commerce ecosystem", ru: "e-commerce экосистема" },
    role: { en: "full-stack tech lead · contract", ru: "full-stack техлид · контракт" },
    period: { en: "2026.06 — now · launching soon", ru: "2026.06 — сейчас · скоро запуск" },
    points: {
      en: [
        "crm + online store built from zero",
        "full order lifecycle: checkout → purchasing → warehouse → delivery → returns",
        "delivery and payment provider integrations, multi-currency",
        "customer account, real-time chat with managers",
        "partner program, finance and analytics",
        "roles & permissions, jwt, audit; leading frontend and the team",
      ],
      ru: [
        "crm + интернет-магазин с нуля",
        "полный цикл заказа: оформление → закупка → склад → доставка → возвраты",
        "интеграции служб доставки и платёжных провайдеров, мультивалютность",
        "кабинет покупателя, чат с менеджером в реальном времени",
        "партнёрская программа, финансы и аналитика",
        "роли и права, jwt, аудит; веду фронтенд и команду",
      ],
    },
    stack: "java 21 · spring boot 4 · postgresql · redis · flyway",
  },
  {
    id: "02",
    status: "ARCHIVED",
    title: { en: "medtech saas", ru: "medtech saas" },
    role: { en: "full stack engineer · unicorn soft", ru: "full stack engineer · unicorn soft" },
    period: { en: "2025.07 — 2026.05", ru: "2025.07 — 2026.05" },
    points: {
      en: [
        "saas for private medical clinics, built from zero in a team",
        "access model: roles, permissions, data access rules",
        "authentication on keycloak: jwt, mfa",
        "inpatient module from scratch, part of the laboratory",
        "cashier module: backend and frontend",
        "integrations with the tax service and 2gis",
      ],
      ru: [
        "saas для частных медицинских клиник, с нуля в команде",
        "модель доступа: роли, права, правила доступа к данным",
        "аутентификация на keycloak: jwt, mfa",
        "модуль стационара с нуля, часть лаборатории",
        "касса: бэкенд и фронтенд",
        "интеграции с налоговой службой и 2гис",
      ],
    },
    stack: "java · spring boot · spring security · keycloak · postgresql · react",
  },
  {
    id: "03",
    status: "OFFLINE",
    title: { en: "clinic messaging", ru: "рассылки для клиник" },
    role: { en: "backend developer · freelance", ru: "backend-разработчик · фриланс" },
    period: { en: "2025", ru: "2025" },
    points: {
      en: [
        "whatsapp mailings for dental clinics without the official business api",
        "ai chat assistant answering patients",
      ],
      ru: [
        "whatsapp-рассылки для стоматологий без официального business api",
        "ии-чат, отвечающий пациентам",
      ],
    },
    stack: "java · spring boot · postgresql · docker",
  },
  {
    id: "04",
    status: "RUNNING",
    title: { en: "own multi-tenant saas", ru: "свой мультиарендный saas" },
    role: { en: "founder & developer", ru: "основатель и разработчик" },
    period: { en: "2026 — now", ru: "2026 — сейчас" },
    points: {
      en: [
        "company data isolation on hibernate @TenantId — no manual filters",
        "220+ tests, integration tests on a real postgres (testcontainers)",
        "ci/cd: github actions → ghcr → vps, caddy with automatic ssl",
        "several react / typescript frontends",
      ],
      ru: [
        "изоляция данных компаний на hibernate @TenantId — без ручных фильтров",
        "220+ тестов, интеграционные на реальном postgres (testcontainers)",
        "ci/cd: github actions → ghcr → vps, caddy с автоматическим ssl",
        "несколько фронтендов на react / typescript",
      ],
    },
    stack: "java 21 · spring boot 4 · hibernate 7 · postgresql · docker",
  },
  {
    id: "05",
    status: "HERE",
    title: { en: "navi", ru: "navi" },
    role: { en: "this machine", ru: "эта машина" },
    period: { en: "open source", ru: "open source" },
    points: {
      en: [
        "you are inside it",
        "every visitor is a live node on the wired map (websocket)",
        "traces are stored in postgres and broadcast in real time",
        "typescript + canvas, no frameworks",
      ],
      ru: [
        "ты внутри неё",
        "каждый посетитель — живой узел на карте wired (websocket)",
        "следы хранятся в postgres и рассылаются в реальном времени",
        "typescript + canvas, без фреймворков",
      ],
    },
    stack: "spring boot 4 · websocket · postgresql · typescript · canvas",
  },
];

export const STACK = [
  ["backend", "java 21 · spring boot · spring security · hibernate · keycloak · jwt"],
  ["data", "postgresql · redis · flyway"],
  ["infra", "docker · github actions · caddy · linux"],
  ["tests", "junit · mockito · testcontainers"],
  ["front", "react · typescript"],
];

type Dict = Record<string, string>;

const EN: Dict = {
  motd: "welcome to NAVI. type <b>help</b> — or <b>lain</b>, if you dare.",
  help: "available commands",
  "help.whoami": "who is behind this machine",
  "help.nodes": "projects as nodes of the wired",
  "help.node": "open a node: node 01",
  "help.stack": "protocol stack",
  "help.contact": "open a connection",
  "help.cv": "download cv: cv en | cv ru",
  "help.who": "who is in the wired right now",
  "help.traces": "latest traces",
  "help.trace": "leave a trace: trace <message>",
  "help.lang": "switch language: lang en | lang ru",
  "help.clear": "clear the screen",
  whoami: "full-stack developer · tech lead\nbishkek, kyrgyzstan · utc+6 · open to remote\n\ni build systems from zero to production: crm, e-commerce, saas.\narchitecture, backend, frontend, deploy — and the team around it.",
  nodesHint: "type <b>node 01</b> … <b>node 05</b>",
  nodeMissing: "no such node. try node 01",
  contact: "open a connection",
  cvOpened: "opening cv",
  who: "in the wired now",
  whoEmpty: "only you. for now.",
  whoOffline: "not connected to the wired",
  you: "you",
  traces: "latest traces",
  tracesEmpty: "no traces yet. be the first: trace <message>",
  traceUsage: "usage: trace <message>",
  traceSent: "trace left in the wired",
  traceNotConnected: "wait for the connection to the wired",
  langSet: "language: english",
  notFound: "command not found",
  tryHelp: "type help",
  exit: "there is no exit. you are already connected.",
  sudo: "only god has root. and god is in the wired.",
  online: "in the wired",
  connecting: "connecting…",
  offline: "offline · retrying",
  joined: "connected",
  left: "disconnected",
  placeholder: "type a command",
  traceInput: "leave a trace…",
  send: "send",
  ago: "ago",
  now: "now",
  pressKey: "press any key to connect",
  mapTitle: "WIRED · node map",
  tracesTitle: "TRACES",
  terminalTitle: "NAVI · terminal",
  onAir: "on air",
  offAir: "off air",
  circuitHint: "hover a component — current shows which nodes it powers",
  "l1.title": "present day",
  "l1.sub": "full-stack developer · tech lead · bishkek",
  "l1.hint": "scroll to walk · touch the wires · don't scare the crows",
  "l2.title": "whoami",
  "l2.tv": "full-stack developer and tech lead.\ni build systems from zero to production —\ncrm, e-commerce, saas.\n\narchitecture, backend, frontend, deploy.\nand the team around it.\n\nbishkek · utc+6 · open to remote.",
  "l3.title": "channels",
  "l3.hint": "turn the knob · arrows · ch± — every channel is a project",
  "l4.title": "protocol",
  "l5.title": "the wired",
  "l5.lead": "no matter where you go, everyone is connected.",
  "l5.text": "these are not decorations. every light is a person reading this page right now. the crosshairs on the page are their cursors. click anywhere — everyone will see the ripple.",
  "l5.count": "nodes online",
  "l6.title": "traces",
  "l6.text": "leave something behind. it will float in the wired for everyone.",
  "l7.title": "navi",
  "l7.text": "for those who prefer a prompt. type help.",
  connect: "connect",
  connectSound: "connect with sound",
  soundOn: "sound on",
  soundOff: "sound off",
  lainMode: "let's all love lain",
  footer: "close the world, open the nExt",
};

const RU: Dict = {
  motd: "добро пожаловать в NAVI. набери <b>help</b> — или <b>lain</b>, если не страшно.",
  help: "доступные команды",
  "help.whoami": "кто стоит за этой машиной",
  "help.nodes": "проекты как узлы wired",
  "help.node": "открыть узел: node 01",
  "help.stack": "стек протоколов",
  "help.contact": "открыть соединение",
  "help.cv": "скачать резюме: cv ru | cv en",
  "help.who": "кто сейчас в wired",
  "help.traces": "последние следы",
  "help.trace": "оставить след: trace <сообщение>",
  "help.lang": "язык: lang ru | lang en",
  "help.clear": "очистить экран",
  whoami: "full-stack разработчик · техлид\nбишкек, кыргызстан · utc+6 · открыт к удалёнке\n\nстрою системы с нуля до продакшена: crm, e-commerce, saas.\nархитектура, бэкенд, фронтенд, деплой — и команда вокруг.",
  nodesHint: "набери <b>node 01</b> … <b>node 05</b>",
  nodeMissing: "такого узла нет. попробуй node 01",
  contact: "открыть соединение",
  cvOpened: "открываю резюме",
  who: "сейчас в wired",
  whoEmpty: "только ты. пока что.",
  whoOffline: "нет соединения с wired",
  you: "ты",
  traces: "последние следы",
  tracesEmpty: "следов пока нет. оставь первый: trace <сообщение>",
  traceUsage: "использование: trace <сообщение>",
  traceSent: "след оставлен в wired",
  traceNotConnected: "дождись соединения с wired",
  langSet: "язык: русский",
  notFound: "команда не найдена",
  tryHelp: "набери help",
  exit: "выхода нет. ты уже подключён.",
  sudo: "root есть только у бога. а бог — в wired.",
  online: "в wired",
  connecting: "соединение…",
  offline: "нет связи · повтор",
  joined: "подключился",
  left: "отключился",
  placeholder: "введи команду",
  traceInput: "оставь след…",
  send: "отправить",
  ago: "назад",
  now: "сейчас",
  pressKey: "нажми любую клавишу, чтобы подключиться",
  mapTitle: "WIRED · карта узлов",
  tracesTitle: "СЛЕДЫ",
  terminalTitle: "NAVI · терминал",
  onAir: "в эфире",
  offAir: "не в эфире",
  circuitHint: "наведи на компонент — ток покажет, какие узлы он питает",
  "l1.title": "present day",
  "l1.sub": "full-stack разработчик · техлид · бишкек",
  "l1.hint": "скролль, чтобы идти · тронь провода · не спугни ворон",
  "l2.title": "whoami",
  "l2.tv": "full-stack разработчик и техлид.\nстрою системы с нуля до продакшена —\ncrm, e-commerce, saas.\n\nархитектура, бэкенд, фронтенд, деплой.\nи команда вокруг.\n\nбишкек · utc+6 · открыт к удалёнке.",
  "l3.title": "channels",
  "l3.hint": "крути ручку · стрелки · ch± — каждый канал это проект",
  "l4.title": "protocol",
  "l5.title": "the wired",
  "l5.lead": "куда бы ты ни пошёл, все связаны.",
  "l5.text": "это не декорации. каждый огонёк — человек, который читает эту страницу прямо сейчас. прицелы на странице — их курсоры. кликни куда угодно — волну увидят все.",
  "l5.count": "узлов в сети",
  "l6.title": "traces",
  "l6.text": "оставь что-нибудь после себя. оно будет плыть в wired у всех.",
  "l7.title": "navi",
  "l7.text": "для тех, кто любит командную строку. набери help.",
  connect: "подключиться",
  connectSound: "подключиться со звуком",
  soundOn: "звук вкл",
  soundOff: "звук выкл",
  lainMode: "let's all love lain",
  footer: "close the world, open the nExt",
};

const DICTS: Record<Lang, Dict> = { en: EN, ru: RU };

let current: Lang = detectLang();
const listeners = new Set<() => void>();

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("navi.lang");
    if (saved === "en" || saved === "ru") return saved;
  } catch {
    return "en";
  }
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function lang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  current = next;
  try {
    localStorage.setItem("navi.lang", next);
  } catch {
    return;
  } finally {
    document.documentElement.lang = next;
    listeners.forEach((listener) => listener());
  }
}

export function onLangChange(listener: () => void): void {
  listeners.add(listener);
}

export function t(key: string): string {
  return DICTS[current][key] ?? EN[key] ?? key;
}
