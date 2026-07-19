import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

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
};

const KEY = "placementos::v1";

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
};

function readLocal(): Store {
  if (typeof window === "undefined") return defaultStore;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultStore;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return { ...defaultStore, ...parsed, subjects: parsed.subjects?.length ? parsed.subjects : defaultSubjects };
  } catch {
    return defaultStore;
  }
}

function writeLocal(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("placementos:change"));
}

export function useStore() {
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<Store>(defaultStore);

  useEffect(() => {
    let mounted = true;
    
    // Optimistic initial load from local storage
    const local = readLocal();
    setStore(local);
    setHydrated(true);

    async function loadSupabase() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // if not logged in, keep local state

        const [tasksRes, appsRes, profileRes] = await Promise.all([
          supabase.from("tasks").select("*"),
          supabase.from("applications").select("*"),
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        ]);

        if (mounted) {
          setStore((prev) => {
            const next = { ...prev };
            if (profileRes.data) {
              next.profile = {
                email: profileRes.data.email,
                name: profileRes.data.name || "",
                college: profileRes.data.college || "",
                targetRole: profileRes.data.target_role || "Software Engineer",
                avatarSeed: profileRes.data.avatar_seed || "dev",
                lcUsername: profileRes.data.avatar_seed || "", // avatar_seed stores the LC username
              };
              next.streak = profileRes.data.streak || 0;
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
            return next;
          });
        }
      } catch (err) {
        console.error("Supabase load error", err);
      }
    }
    loadSupabase();

    const on = () => setStore(readLocal());
    window.addEventListener("placementos:change", on);
    window.addEventListener("storage", on);
    return () => {
      mounted = false;
      window.removeEventListener("placementos:change", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const update = useCallback((fn: (s: Store) => Store) => {
    setStore((prev) => {
      const next = fn(prev);
      writeLocal(next);

      // Async Sync to Supabase
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        
        // Find modified tasks (naive simple sync logic for POC)
        // Usually, a real app sends precise mutations. Here we upsert everything or handle specific changes in specialized functions.
        // For tasks:
        if (next.tasks.length !== prev.tasks.length || next.tasks.some((t, i) => t.done !== prev.tasks[i]?.done)) {
           // Insert new tasks or update done state
           const latestTask = next.tasks[0];
           if (next.tasks.length > prev.tasks.length && latestTask) {
             supabase.from("tasks").insert({
               id: latestTask.id, user_id: user.id, title: latestTask.title, priority: latestTask.priority, done: latestTask.done
             }).then();
           } else {
             // For toggle, we can just upsert all for safety in this simple wrapper
             supabase.from("tasks").upsert(next.tasks.map(t => ({
               id: t.id, user_id: user.id, title: t.title, priority: t.priority, done: t.done
             }))).then();
           }
        }

        // Applications sync
        if (next.applications !== prev.applications) {
           supabase.from("applications").upsert(next.applications.map(a => ({
               id: a.id, user_id: user.id, company: a.company, role: a.role, stage: a.stage, notes: a.notes
           }))).then();
        }

        // Profile / Streak sync
        if (next.profile !== prev.profile || next.streak !== prev.streak) {
           supabase.from("profiles").update({
              name: next.profile.name,
              college: next.profile.college,
              target_role: next.profile.targetRole,
              avatar_seed: next.profile.avatarSeed,
              streak: next.streak
           }).eq("id", user.id).then();
        }
      });

      return next;
    });
  }, []);

  return { store, update, hydrated };
}

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
