import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Task = {
  id: string;
  title: string;
  priority: "low" | "med" | "high";
  done: boolean;
  createdAt: number;
};

export type Stage = "applied" | "oa" | "interview" | "offer" | "rejected";

export type Application = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  notes?: string;
  createdAt: number;
};

export type LeetProblem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  solvedAt: number;
};

export type SubjectTopic = { id: string; title: string; done: boolean };
export type Subject = { id: string; name: string; topics: SubjectTopic[] };

export type LcApiStats = {
  solvedProblem: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
} | null;

export type Profile = {
  email: string;
  name: string;
  college?: string;
  targetRole?: string;
  avatarSeed: string;
  lcUsername: string; // stored in profiles.avatar_seed in Supabase
};

export type Store = {
  profile: Profile;
  tasks: Task[];
  applications: Application[];
  leetcode: LeetProblem[];
  subjects: Subject[];
  streak: number;
  lastActive: string;
  lcApiStats: LcApiStats; // fetched live from alfa-leetcode-api, not persisted
};

// ─── Constants ────────────────────────────────────────────────────────────────

const KEY = "placementos::v1";
const LC_API = "https://alfa-leetcode-api.onrender.com";

const defaultSubjects: Subject[] = [
  {
    id: "os",
    name: "Operating Systems",
    topics: [
      { id: "os-1", title: "Processes & Threads", done: false },
      { id: "os-2", title: "CPU Scheduling", done: false },
      { id: "os-3", title: "Deadlocks", done: false },
      { id: "os-4", title: "Memory Management", done: false },
      { id: "os-5", title: "Virtual Memory & Paging", done: false },
      { id: "os-6", title: "File Systems", done: false },
    ],
  },
  {
    id: "dbms",
    name: "DBMS",
    topics: [
      { id: "db-1", title: "ER Model", done: false },
      { id: "db-2", title: "Normalization", done: false },
      { id: "db-3", title: "SQL Queries", done: false },
      { id: "db-4", title: "Transactions & ACID", done: false },
      { id: "db-5", title: "Indexing", done: false },
    ],
  },
  {
    id: "cn",
    name: "Computer Networks",
    topics: [
      { id: "cn-1", title: "OSI & TCP/IP", done: false },
      { id: "cn-2", title: "TCP vs UDP", done: false },
      { id: "cn-3", title: "HTTP/HTTPS", done: false },
      { id: "cn-4", title: "DNS", done: false },
      { id: "cn-5", title: "Routing", done: false },
    ],
  },
  {
    id: "oop",
    name: "OOP",
    topics: [
      { id: "oop-1", title: "Encapsulation", done: false },
      { id: "oop-2", title: "Inheritance", done: false },
      { id: "oop-3", title: "Polymorphism", done: false },
      { id: "oop-4", title: "Abstraction", done: false },
      { id: "oop-5", title: "SOLID Principles", done: false },
    ],
  },
];

const defaultStore: Store = {
  profile: {
    email: "you@placementos.dev",
    name: "Developer",
    college: "",
    targetRole: "Software Engineer",
    avatarSeed: "dev",
    lcUsername: "",
  },
  tasks: [],
  applications: [],
  leetcode: [],
  subjects: defaultSubjects,
  streak: 0,
  lastActive: new Date().toISOString().slice(0, 10),
  lcApiStats: null,
};

// ─── Local Storage ────────────────────────────────────────────────────────────

function readLocal(): Store {
  if (typeof window === "undefined") return defaultStore;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultStore;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      ...defaultStore,
      ...parsed,
      lcApiStats: null, // never persist API stats — always fetch fresh
      subjects: parsed.subjects?.length ? parsed.subjects : defaultSubjects,
    };
  } catch {
    return defaultStore;
  }
}

function writeLocal(s: Store) {
  if (typeof window === "undefined") return;
  // Strip live API stats before persisting
  const { lcApiStats: _, ...toSave } = s;
  window.localStorage.setItem(KEY, JSON.stringify(toSave));
  window.dispatchEvent(new CustomEvent("placementos:change"));
}

// ─── Singleton Store Pattern ──────────────────────────────────────────────────
// All useStore() calls share one instance. Supabase is queried once, not once per component.

type Listener = (s: Store) => void;
let singletonStore: Store = defaultStore;
let singletonHydrated = false;
const listeners = new Set<Listener>();
let cachedUserId: string | null = null;

function emit(next: Store) {
  singletonStore = next;
  listeners.forEach((l) => l(next));
}

async function bootstrapOnce() {
  if (singletonHydrated) return;

  // Optimistic local hydration first — makes UI appear instantly
  const local = readLocal();
  singletonStore = local;
  singletonHydrated = true;
  emit(local);

  // Then sync from Supabase in background
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    cachedUserId = user.id;

    const [tasksRes, appsRes, profileRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("applications").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

    const next = { ...singletonStore };

    if (profileRes.data) {
      next.profile = {
        email: profileRes.data.email ?? "",
        name: profileRes.data.name ?? "",
        college: profileRes.data.college ?? "",
        targetRole: profileRes.data.target_role ?? "Software Engineer",
        avatarSeed: profileRes.data.avatar_seed ?? "dev",
        lcUsername: profileRes.data.avatar_seed ?? "", // avatar_seed column stores LC username
      };
      next.streak = profileRes.data.streak ?? 0;
    }

    if (tasksRes.data) {
      next.tasks = tasksRes.data.map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        done: t.done,
        createdAt: new Date(t.created_at).getTime(),
      }));
    }

    if (appsRes.data) {
      next.applications = appsRes.data.map((a: any) => ({
        id: a.id,
        company: a.company,
        role: a.role,
        stage: a.stage,
        notes: a.notes,
        createdAt: new Date(a.created_at).getTime(),
      }));
    }

    writeLocal(next);
    emit(next);

    // If there's a saved LC username, fetch API stats right away
    if (next.profile.lcUsername) {
      fetchLcStats(next.profile.lcUsername).catch(() => {});
    }
  } catch (err) {
    console.error("Supabase load error", err);
  }
}

// ─── LeetCode API Fetch ───────────────────────────────────────────────────────

export async function fetchLcStats(
  username: string
): Promise<{ ok: true; stats: LcApiStats } | { ok: false; error: string }> {
  if (!username.trim()) return { ok: false, error: "No username provided." };

  try {
    const res = await fetch(`${LC_API}/${encodeURIComponent(username.trim())}/solved`, {
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404 || res.status === 400) {
      return { ok: false, error: "Username does not exist on LeetCode." };
    }

    if (!res.ok) {
      return { ok: false, error: `LeetCode API error (${res.status}). Try again later.` };
    }

    const data = await res.json();

    // alfa-leetcode-api /solved returns: { solvedProblem, easySolved, mediumSolved, hardSolved }
    if (typeof data?.solvedProblem !== "number") {
      return { ok: false, error: "Username does not exist on LeetCode." };
    }

    const stats: LcApiStats = {
      solvedProblem: data.solvedProblem ?? 0,
      easySolved: data.easySolved ?? 0,
      mediumSolved: data.mediumSolved ?? 0,
      hardSolved: data.hardSolved ?? 0,
    };

    // Push stats into the singleton store so LeetCode page updates reactively
    emit({ ...singletonStore, lcApiStats: stats });

    return { ok: true, stats };
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return { ok: false, error: "Request timed out. LeetCode API may be slow — try again." };
    }
    return { ok: false, error: "Failed to reach LeetCode API. Check your connection." };
  }
}

// ─── useStore Hook ────────────────────────────────────────────────────────────

export function useStore() {
  const [store, setStore] = useState<Store>(singletonStore);
  const [hydrated, setHydrated] = useState(singletonHydrated);

  useEffect(() => {
    // Subscribe to singleton updates
    const listener: Listener = (s) => {
      setStore(s);
      setHydrated(true);
    };
    listeners.add(listener);

    // Bootstrap (no-op if already done)
    if (!singletonHydrated) {
      bootstrapOnce();
    } else {
      setStore(singletonStore);
      setHydrated(true);
    }

    // Also sync on storage events from other tabs
    const onStorage = () => {
      const fresh = readLocal();
      emit({ ...fresh, lcApiStats: singletonStore.lcApiStats });
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((fn: (s: Store) => Store) => {
    const prev = singletonStore;
    const next = fn(prev);
    writeLocal(next);
    emit(next);

    // Async sync to Supabase — fire and forget
    const userId = cachedUserId;
    if (!userId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) cachedUserId = user.id;
        syncToSupabase(prev, next, user?.id ?? null);
      });
    } else {
      syncToSupabase(prev, next, userId);
    }
  }, []);

  return { store, update, hydrated };
}

function syncToSupabase(prev: Store, next: Store, userId: string | null) {
  if (!userId) return;

  // Tasks: insert new, upsert on done-state change, handle deletes
  if (next.tasks !== prev.tasks) {
    const addedIds = new Set(next.tasks.map((t) => t.id));
    const removedTasks = prev.tasks.filter((t) => !addedIds.has(t.id));

    if (removedTasks.length > 0) {
      supabase
        .from("tasks")
        .delete()
        .in(
          "id",
          removedTasks.map((t) => t.id)
        )
        .then();
    }

    const newTasks = next.tasks.filter((t) => !prev.tasks.some((p) => p.id === t.id));
    if (newTasks.length > 0) {
      supabase
        .from("tasks")
        .insert(
          newTasks.map((t) => ({
            id: t.id,
            user_id: userId,
            title: t.title,
            priority: t.priority,
            done: t.done,
          }))
        )
        .then();
    }

    const toggled = next.tasks.filter((t) => {
      const p = prev.tasks.find((pt) => pt.id === t.id);
      return p && p.done !== t.done;
    });
    if (toggled.length > 0) {
      supabase
        .from("tasks")
        .upsert(
          toggled.map((t) => ({
            id: t.id,
            user_id: userId,
            title: t.title,
            priority: t.priority,
            done: t.done,
          }))
        )
        .then();
    }
  }

  // Applications: upsert additions, delete removals
  if (next.applications !== prev.applications) {
    const prevIds = new Set(prev.applications.map((a) => a.id));
    const nextIds = new Set(next.applications.map((a) => a.id));

    const removed = prev.applications.filter((a) => !nextIds.has(a.id));
    if (removed.length > 0) {
      supabase
        .from("applications")
        .delete()
        .in(
          "id",
          removed.map((a) => a.id)
        )
        .then();
    }

    const upserted = next.applications.filter(
      (a) =>
        !prevIds.has(a.id) ||
        prev.applications.find((p) => p.id === a.id)?.stage !== a.stage
    );
    if (upserted.length > 0) {
      supabase
        .from("applications")
        .upsert(
          upserted.map((a) => ({
            id: a.id,
            user_id: userId,
            company: a.company,
            role: a.role,
            stage: a.stage,
            notes: a.notes ?? null,
          }))
        )
        .then();
    }
  }

  // Profile / streak
  if (next.profile !== prev.profile || next.streak !== prev.streak) {
    supabase
      .from("profiles")
      .update({
        name: next.profile.name,
        college: next.profile.college ?? null,
        target_role: next.profile.targetRole ?? null,
        avatar_seed: next.profile.lcUsername, // ← correct: lcUsername → avatar_seed
        streak: next.streak,
      })
      .eq("id", userId)
      .then();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function uid() {
  return crypto.randomUUID();
}

export const stageLabels: Record<Stage, string> = {
  applied: "Applied",
  oa: "Online Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const stageOrder: Stage[] = ["applied", "oa", "interview", "offer", "rejected"];
