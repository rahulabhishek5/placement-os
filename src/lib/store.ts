// Simple local-storage backed store with subscriptions (no backend).
import { useSyncExternalStore } from "react";

type Listener = () => void;

function createStore<T>(key: string, initial: T) {
  const listeners = new Set<Listener>();
  let value: T = initial;
  let loaded = false;

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {}
    loaded = true;
  };

  const persist = () => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  return {
    get(): T { load(); return value; },
    set(next: T | ((prev: T) => T)) {
      load();
      value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      persist();
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l); },
  };
}

// ==== AUTH ====
export type User = { email: string; name: string; avatar?: string } | null;
const authStore = createStore<User>("pos:user", null);
export const auth = {
  useUser(): User {
    return useSyncExternalStore(authStore.subscribe, authStore.get, () => null);
  },
  signIn(email: string) {
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dev";
    authStore.set({ email, name });
  },
  signOut() { authStore.set(null); },
  get(): User { return authStore.get(); },
};

// ==== TASKS ====
export type Task = { id: string; title: string; done: boolean; priority: "low" | "med" | "high"; createdAt: number };
const tasksStore = createStore<Task[]>("pos:tasks", []);
export const tasks = {
  useAll() { return useSyncExternalStore(tasksStore.subscribe, tasksStore.get, () => [] as Task[]); },
  add(title: string, priority: Task["priority"] = "med") {
    tasksStore.set((p) => [{ id: crypto.randomUUID(), title, priority, done: false, createdAt: Date.now() }, ...p]);
  },
  toggle(id: string) { tasksStore.set((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); },
  remove(id: string) { tasksStore.set((p) => p.filter((t) => t.id !== id)); },
};

// ==== COMPANIES (Kanban) ====
export const PIPELINE_STAGES = ["applied", "oa", "interview", "offer", "rejected"] as const;
export type Stage = (typeof PIPELINE_STAGES)[number];
export type Company = { id: string; name: string; role: string; stage: Stage; notes?: string; createdAt: number };
const companiesStore = createStore<Company[]>("pos:companies", []);
export const companies = {
  useAll() { return useSyncExternalStore(companiesStore.subscribe, companiesStore.get, () => [] as Company[]); },
  add(c: Omit<Company, "id" | "createdAt">) {
    companiesStore.set((p) => [{ ...c, id: crypto.randomUUID(), createdAt: Date.now() }, ...p]);
  },
  move(id: string, stage: Stage) {
    companiesStore.set((p) => p.map((c) => (c.id === id ? { ...c, stage } : c)));
  },
  remove(id: string) { companiesStore.set((p) => p.filter((c) => c.id !== id)); },
};

// ==== LEETCODE ====
export type LcEntry = { id: string; title: string; difficulty: "easy" | "medium" | "hard"; date: string };
const lcStore = createStore<LcEntry[]>("pos:lc", []);
export const lc = {
  useAll() { return useSyncExternalStore(lcStore.subscribe, lcStore.get, () => [] as LcEntry[]); },
  add(title: string, difficulty: LcEntry["difficulty"]) {
    lcStore.set((p) => [{ id: crypto.randomUUID(), title, difficulty, date: new Date().toISOString().slice(0, 10) }, ...p]);
  },
  remove(id: string) { lcStore.set((p) => p.filter((e) => e.id !== id)); },
};

// ==== SUBJECTS ====
export type SubjectKey = "os" | "dbms" | "cn" | "oop";
export const SUBJECT_TREE: Record<SubjectKey, { name: string; topics: string[] }> = {
  os: { name: "Operating Systems", topics: ["Processes & Threads", "Scheduling", "Synchronization", "Deadlocks", "Memory Management", "Virtual Memory", "File Systems", "I/O Systems"] },
  dbms: { name: "Database Management", topics: ["ER Model", "Relational Model", "Normalization", "SQL Queries", "Indexing", "Transactions", "Concurrency Control", "NoSQL Basics"] },
  cn: { name: "Computer Networks", topics: ["OSI & TCP/IP", "Physical & Data Link", "IP & Routing", "TCP/UDP", "DNS & HTTP", "TLS & Security", "Sockets", "Wireless"] },
  oop: { name: "Object-Oriented Programming", topics: ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation", "Abstraction", "SOLID Principles", "Design Patterns", "UML Basics"] },
};
const subjStore = createStore<Record<string, boolean>>("pos:subjects", {});
export const subjects = {
  useAll() { return useSyncExternalStore(subjStore.subscribe, subjStore.get, () => ({}) as Record<string, boolean>); },
  toggle(id: string) { subjStore.set((p) => ({ ...p, [id]: !p[id] })); },
  progress(key: SubjectKey, state: Record<string, boolean>) {
    const topics = SUBJECT_TREE[key].topics;
    const done = topics.filter((t) => state[`${key}:${t}`]).length;
    return { done, total: topics.length, pct: Math.round((done / topics.length) * 100) };
  },
};

// ==== STREAK ====
const streakStore = createStore<{ last: string; count: number }>("pos:streak", { last: "", count: 0 });
export const streak = {
  useVal() { return useSyncExternalStore(streakStore.subscribe, streakStore.get, () => ({ last: "", count: 0 })); },
  ping() {
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streakStore.set((p) => {
      if (p.last === today) return p;
      if (p.last === yest) return { last: today, count: p.count + 1 };
      return { last: today, count: 1 };
    });
  },
};
