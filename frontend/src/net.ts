export interface Visitor {
  id: string;
  handle: string;
  connectedAt: string;
}

export interface Trace {
  id: string;
  handle: string;
  message: string;
  createdAt: string;
}

export type ConnectionState = "connecting" | "online" | "offline";

export type SignalType = "CURSOR" | "PING";

type WiredEvent =
  | { type: "WELCOME"; you: Visitor; visitors: Visitor[] }
  | { type: "JOINED"; visitor: Visitor }
  | { type: "LEFT"; id: string }
  | { type: "TRACE"; trace: Trace }
  | { type: SignalType; id: string; x: number; y: number };

export interface WiredListener {
  state(state: ConnectionState): void;
  welcome(you: Visitor, visitors: Visitor[]): void;
  joined(visitor: Visitor): void;
  left(id: string): void;
  trace(trace: Trace): void;
  signal(type: SignalType, id: string, x: number, y: number): void;
}

const MAX_BACKOFF_MS = 15_000;

export class Wired {
  private attempt = 0;
  private socket?: WebSocket;

  constructor(private readonly listener: WiredListener) {}

  connect(): void {
    this.listener.state("connecting");
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}/wired`);
    this.socket = socket;
    socket.onopen = () => {
      this.attempt = 0;
      this.listener.state("online");
    };
    socket.onmessage = (message) => this.dispatch(JSON.parse(message.data) as WiredEvent);
    socket.onclose = () => {
      this.listener.state("offline");
      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.attempt++);
      window.setTimeout(() => this.connect(), delay);
    };
  }

  signal(type: SignalType, x: number, y: number): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type, x: clamp(x), y: clamp(y) }));
  }

  private dispatch(event: WiredEvent): void {
    switch (event.type) {
      case "WELCOME":
        this.listener.welcome(event.you, event.visitors);
        break;
      case "JOINED":
        this.listener.joined(event.visitor);
        break;
      case "LEFT":
        this.listener.left(event.id);
        break;
      case "TRACE":
        this.listener.trace(event.trace);
        break;
      case "CURSOR":
      case "PING":
        this.listener.signal(event.type, event.id, event.x, event.y);
        break;
    }
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export async function fetchTraces(): Promise<Trace[]> {
  const response = await fetch("/api/traces");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function postTrace(handle: string, message: string): Promise<Trace> {
  const response = await fetch("/api/traces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle, message }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? `HTTP ${response.status}`);
  return body as Trace;
}
