import { useCallback, useEffect, useState, useSyncExternalStore } from "react";


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

type Listener = () => void;
let singletonStore: Store = defaultStore;
let singletonHydrated = false;
const listeners = new Set<Listener>();
let cachedUserId: string | null = null;

/**
 * Call this on logout to clear the singleton so the next login gets a fresh bootstrap.
 * Without this, singletonHydrated=true persists across sessions in the same tab,
 * and bootstrapOnce() is never re-run, leaving stale data on screen.
 */
export function resetStore() {
  singletonStore = defaultStore;
  singletonHydrated = false;
  cachedUserId = null;
  emit(defaultStore);
}

function emit(next: Store) {
  singletonStore = next;
  listeners.forEach((l) => l());
}

async function bootstrapOnce() {
  if (singletonHydrated) return;
  
  // -- Phase 7: Legacy Migration --
  if (typeof window !== "undefined") {
    try {
      const legacyLc = localStorage.getItem("pos:lc");
      const legacySubj = localStorage.getItem("pos:subjects");
      let migrated = false;
      const currentLocal = readLocal();

      if (legacyLc && (!currentLocal.leetcode || currentLocal.leetcode.length === 0)) {
        const parsedLc = JSON.parse(legacyLc) as any[];
        currentLocal.leetcode = parsedLc.map(e => ({
          id: e.id,
          title: e.title,
          // Map lowercase to Capitalized to match new schema
          difficulty: (e.difficulty.charAt(0).toUpperCase() + e.difficulty.slice(1)) as any,
          solvedAt: new Date(e.date).getTime() || Date.now(),
        }));
        migrated = true;
      }

      if (legacySubj && (!currentLocal.subjects || currentLocal.subjects.length === 0)) {
        const parsedSubj = JSON.parse(legacySubj) as Record<string, boolean>;
        // We have to build subjects array based on true values. 
        // Or we can just store the Record directly if we modify the type.
        // Wait, placement-store defines subjects as: { id, name, topics: {id, title, done}[] }
        // Let's just migrate it into the new format based on defaultSubjects.
        const newSubjects = JSON.parse(JSON.stringify(defaultSubjects));
        for (const subj of newSubjects) {
          for (const topic of subj.topics) {
            if (parsedSubj[`${subj.id}:${topic.title}`]) {
              topic.done = true;
            }
          }
        }
        currentLocal.subjects = newSubjects;
        migrated = true;
      }

      if (migrated) {
        // Persist the migrated data into the new placementos::v1 key
        writeLocal(currentLocal);
        // Only remove legacy keys after successful migration
        localStorage.removeItem("pos:lc");
        localStorage.removeItem("pos:subjects");
      }
    } catch (e) {
      console.error("[Migration] Legacy migration failed:", e);
    }
  }

  // Optimistic local hydration first — makes UI appear instantly
  const local = readLocal();
  singletonStore = local;
  singletonHydrated = true;
  emit(local);

  // Then sync from Supabase in background
  try {
    const { supabase } = await import("./supabase-client");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    cachedUserId = user.id;

    // ── Ensure profile row exists ──────────────────────────────────────────────
    // The `applications` table has: FOREIGN KEY (user_id) REFERENCES profiles(id)
    // If the profiles row is missing, every INSERT into applications fails with a
    // FK violation which PostgREST returns as 409 Conflict.
    // We upsert the profile here so the FK target is always guaranteed to exist.
    const profileUpsertRes = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
        },
        { onConflict: "id" } // no-op if profile already exists
      );
    if (profileUpsertRes.error) {
      // Non-fatal: log the error but continue — the profile might already exist
      // and RLS may simply prevent re-upserting, which is fine.
      console.warn("[Bootstrap] Profile upsert warning:", profileUpsertRes.error.message, profileUpsertRes.error.code);
    }

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

    if (tasksRes.error) {
      console.error("[Bootstrap] Failed to fetch tasks:", tasksRes.error.message, tasksRes.error.code);
    } else if (tasksRes.data && tasksRes.data.length > 0) {
      next.tasks = tasksRes.data.map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        done: t.done,
        createdAt: new Date(t.created_at).getTime(),
      }));
    }
    // If cloud returned 0 tasks but local has tasks, keep local data.
    // This handles the case where sync failed (e.g. 409) and cloud is empty.

    if (appsRes.error) {
      // Supabase returned an error (e.g. RLS rejection due to clock skew, expired token).
      // Do NOT overwrite local data. Do NOT trigger emergency sync.
      // Keep the local state as-is and log the error for debugging.
      console.error("[Bootstrap] Failed to fetch applications:", appsRes.error.message, appsRes.error.code);
    } else if (appsRes.data && appsRes.data.length > 0) {
      // Cloud has canonical data — use it.
      next.applications = appsRes.data.map((a: any) => ({
        id: a.id,
        company: a.company,
        role: a.role,
        stage: a.stage,
        notes: a.notes,
        createdAt: new Date(a.created_at).getTime(),
      }));
    } else if (appsRes.data && appsRes.data.length === 0 && singletonStore.applications.length > 0) {
      // Cloud returned empty (no error) but we have local data.
      // This means local data was never successfully synced to cloud.
      // Preserve local data AND push it to Supabase now.
      console.warn("[Bootstrap] Cloud applications empty but local has data — pushing local to cloud.");
      next.applications = singletonStore.applications; // keep local
      // Fire-and-forget sync: push all local apps to cloud
      syncToSupabase(
        { ...singletonStore, applications: [] }, // prev = empty so all are treated as new
        { ...next },
        user.id
      ).catch((err) => console.error("[Bootstrap] Failed to push local apps to cloud:", err));
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

export function useStore<T = Store>(selector?: (state: Store) => T) {
  const getSnapshot = useCallback(() => {
    return selector ? selector(singletonStore) : (singletonStore as unknown as T);
  }, [selector]);

  const store = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    getSnapshot,
    getSnapshot
  );

  const [hydrated, setHydrated] = useState(singletonHydrated);

  useEffect(() => {
    if (!singletonHydrated) {
      bootstrapOnce().then(() => setHydrated(true));
    } else {
      setHydrated(true);
    }

    const onStorage = () => {
      const fresh = readLocal();
      emit({ ...fresh, lcApiStats: singletonStore.lcApiStats });
    };
    window.addEventListener("storage", onStorage);

    return () => {
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
      import("./supabase-client").then(({ supabase }) => {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) cachedUserId = user.id;
          syncToSupabase(prev, next, user?.id ?? null);
        });
      });
    } else {
      syncToSupabase(prev, next, userId);
    }
  }, []);

  return { store, update, hydrated };
}

async function syncToSupabase(prev: Store, next: Store, userId: string | null) {
  if (!userId) return;

  const { supabase } = await import("./supabase-client");

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
        .catch((err) => console.error("[Sync] Failed to delete tasks:", err));
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
        .catch((err) => console.error("[Sync] Failed to insert tasks:", err));
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
        .catch((err) => console.error("[Sync] Failed to upsert tasks:", err));
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
        .catch((err) => console.error("[Sync] Failed to delete applications:", err));
    }

    const upserted = next.applications.filter(
      (a) =>
        !prevIds.has(a.id) ||
        prev.applications.find((p) => p.id === a.id)?.stage !== a.stage
    );
    if (upserted.length > 0) {
      const { error: upsertErr } = await supabase
        .from("applications")
        .upsert(
          upserted.map((a) => ({
            id: a.id,
            user_id: userId,
            company: a.company,
            role: a.role,
            stage: a.stage,
            notes: a.notes ?? null,
          })),
          { onConflict: "id" } // explicitly target PK to avoid ambiguous 409 conflicts
        );
      if (upsertErr) {
        console.error("[Sync] Failed to upsert applications:", upsertErr.message, upsertErr.details, upsertErr.code);
      }
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
      .catch((err) => console.error("[Sync] Failed to update profile:", err));
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
