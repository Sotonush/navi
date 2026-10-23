import type { ConnectionState, Trace, Visitor } from "./net";

type Topic = "visitors" | "traces" | "connection" | "flash" | "cursor" | "ping";

export interface Ghost {
  id: string;
  x: number;
  y: number;
  at: number;
}

export interface Ping {
  id: string;
  x: number;
  y: number;
}

class Store {
  you?: Visitor;
  visitors = new Map<string, Visitor>();
  traces: Trace[] = [];
  connection: ConnectionState = "connecting";
  ghosts = new Map<string, Ghost>();
  lastFlash?: { handle: string; at: number };
  lastPing?: Ping;
  lastGhost?: Ghost;

  private readonly listeners = new Map<Topic, Set<() => void>>();

  on(topic: Topic, listener: () => void): void {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    this.listeners.get(topic)!.add(listener);
  }

  emit(topic: Topic): void {
    this.listeners.get(topic)?.forEach((listener) => listener());
  }

  handleOf(id: string): string {
    return this.visitors.get(id)?.handle ?? "unknown";
  }

  welcome(you: Visitor, visitors: Visitor[]): void {
    this.you = you;
    this.visitors = new Map(visitors.map((visitor) => [visitor.id, visitor]));
    this.visitors.set(you.id, you);
    this.emit("visitors");
  }

  join(visitor: Visitor): void {
    this.visitors.set(visitor.id, visitor);
    this.emit("visitors");
  }

  leave(id: string): void {
    this.visitors.delete(id);
    this.ghosts.delete(id);
    this.emit("visitors");
    this.emit("cursor");
  }

  cursor(id: string, x: number, y: number): void {
    const ghost = { id, x, y, at: performance.now() };
    this.ghosts.set(id, ghost);
    this.lastGhost = ghost;
    this.emit("cursor");
  }

  ping(id: string, x: number, y: number): void {
    this.lastPing = { id, x, y };
    this.emit("ping");
  }

  setTraces(traces: Trace[]): void {
    this.traces = traces;
    this.emit("traces");
  }

  addTrace(trace: Trace): void {
    if (this.traces.some((existing) => existing.id === trace.id)) return;
    this.traces = [trace, ...this.traces].slice(0, 50);
    this.lastFlash = { handle: trace.handle, at: performance.now() };
    this.emit("traces");
    this.emit("flash");
  }

  setConnection(state: ConnectionState): void {
    this.connection = state;
    if (state !== "online") {
      this.visitors.clear();
      this.ghosts.clear();
    }
    this.emit("connection");
    this.emit("visitors");
  }
}

export const store = new Store();
