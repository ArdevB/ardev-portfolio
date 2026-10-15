"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  Reorder,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type Variants,
} from "motion/react";
import {
  createManualProject,
  deleteProject,
  saveProjects,
  signOutAction,
  syncFromGitHub,
  uploadCover,
  type ActionResult,
} from "@/app/admin/actions";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { fromManual, fromRepo, type SerializedRow } from "@/lib/projects/merge";
import type { GhRepo } from "@/lib/github/types";
import type { PublicProject } from "@/lib/projects/types";
import { prettifyRepoName, slugify } from "@/lib/utils";

type Props = {
  initialRows: SerializedRow[];
  repos: GhRepo[];
  repoError: string | null;
  user: { name: string; image: string | null };
  blobEnabled: boolean;
  now: number;
};

type Status = { kind: "ok" | "error"; text: string } | null;

const EXPO = [0.16, 1, 0.3, 1] as const;
const CINE = [0.76, 0, 0.24, 1] as const;
const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

const emptyManual = (): SerializedRow => ({
  id: 0,
  source: "manual",
  repoName: null,
  slug: "",
  isPrivate: false,
  visible: true,
  featured: false,
  sortOrder: 0,
  title: "",
  description: null,
  coverImage: null,
  liveUrl: null,
  tags: [],
  repoUrl: null,
  language: null,
  role: null,
  year: null,
  summary: null,
  body: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function Dashboard({ initialRows, repos, repoError, user, blobEnabled, now }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<SerializedRow>(emptyManual);
  const [status, setStatus] = useState<Status>(null);
  const [saving, startSave] = useTransition();
  const [syncing, startSync] = useTransition();
  const [pending, startTransition] = useTransition();
  const busy = saving || syncing || pending;
  const repoMap = useMemo(() => new Map(repos.map((r) => [r.name, r])), [repos]);
  // Rows present on first paint stagger in; rows added later (sync/create) animate on their own.
  const introIds = useRef(new Set(initialRows.map((r) => r.id)));

  useEffect(() => {
    if (!dirty) setRows(initialRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRows]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!status) return;
    const id = window.setTimeout(() => setStatus(null), status.kind === "ok" ? 3500 : 8000);
    return () => window.clearTimeout(id);
  }, [status]);

  const report = <T,>(res: ActionResult<T>, onOk?: (data: T) => void) => {
    if (res.ok) {
      setStatus({ kind: "ok", text: res.message ?? "Done." });
      onOk?.(res.data);
    } else setStatus({ kind: "error", text: res.error });
  };

  const update = (id: number, patch: Partial<SerializedRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const move = (index: number, delta: number) => {
    setRows((rs) => {
      const next = [...rs];
      const target = index + delta;
      if (target < 0 || target >= next.length) return rs;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
    setDirty(true);
  };

  const discard = () => {
    setRows(initialRows);
    setDirty(false);
    setEditing(null);
  };

  const save = () =>
    startSave(async () => {
      const res = await saveProjects(
        rows.map((r) => ({
          id: r.id,
          visible: r.visible,
          featured: r.featured,
          title: r.title,
          description: r.description,
          coverImage: r.coverImage,
          liveUrl: r.liveUrl,
          tags: r.tags,
          role: r.role,
          year: r.year,
          summary: r.summary,
          body: r.body,
          slug: r.slug,
          repoUrl: r.repoUrl,
          language: r.language,
        })),
      );
      report(res, () => {
        setDirty(false);
        router.refresh();
      });
    });

  const sync = () =>
    startSync(async () => {
      report(await syncFromGitHub(), () => router.refresh());
    });

  const preview = (row: SerializedRow, order = 0): PublicProject | null => {
    if (row.source === "manual") return fromManual({ ...row, title: row.title || "Untitled project", slug: row.slug || "untitled" }, order);
    const repo = row.repoName ? repoMap.get(row.repoName) : undefined;
    return repo ? fromRepo(repo, order, row) : null;
  };

  const editingRow = editing === "new" ? draft : (rows.find((r) => r.id === editing) ?? null);
  const counts = {
    total: rows.length,
    visible: rows.filter((r) => r.visible).length,
    featured: rows.filter((r) => r.featured).length,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh overflow-x-clip pb-32">
        <div className="admin-orb admin-orb-a" aria-hidden="true" />
        <div className="admin-orb admin-orb-b" aria-hidden="true" />

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: EXPO }}
          className="sticky top-0 z-30 border-b border-border/70 bg-bg/70 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold tracking-tight">ARDEV©</span>
              <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-muted">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70 motion-reduce:hidden" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                </span>
                Admin
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer" className="group hidden items-center gap-1 rounded-full px-3 py-2 text-sm hover:bg-surface sm:flex">
                View site
                <span className="inline-block transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
              </a>
              <ThemeToggle />
              <form action={signOutAction}>
                <button type="submit" className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm transition-colors hover:border-fg">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="size-7 rounded-full" />
                  ) : (
                    <span className="size-7 rounded-full bg-surface" />
                  )}
                  Sign out
                </button>
              </form>
            </div>
          </div>
          {/* indeterminate progress line while syncing / saving */}
          <AnimatePresence>
            {(syncing || saving) && (
              <motion.div
                className="absolute inset-x-0 bottom-0 h-0.5 overflow-clip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-full w-1/3 bg-accent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "300%" }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: CINE }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        <main className="relative z-10 mx-auto max-w-6xl px-5 pt-12">
          {/* ── Title + stats + toolbar ───────────────────────── */}
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <motion.p
                className="eyebrow mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EXPO, delay: 0.15 }}
              >
                Welcome back, {user.name.split(" ")[0]}
              </motion.p>
              <h1 className="-mb-[0.12em] flex overflow-clip pb-[0.14em] font-display text-[clamp(3rem,7vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.05em]" aria-label="Projects">
                {"Projects".split("").map((c, i) => (
                  <motion.span
                    key={i}
                    aria-hidden="true"
                    className="inline-block"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1, ease: EXPO, delay: 0.2 + i * 0.045 }}
                  >
                    {c}
                  </motion.span>
                ))}
              </h1>
              <motion.dl
                className="mt-5 flex flex-wrap gap-2"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.55 } } }}
              >
                <Stat label="total" value={counts.total} />
                <Stat label="visible" value={counts.visible} />
                <Stat label="featured" value={counts.featured} accent />
              </motion.dl>
            </div>

            <motion.div
              className="flex flex-wrap items-center gap-2"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } } }}
            >
              <motion.button variants={pop} type="button" onClick={sync} disabled={busy || dirty} title={dirty ? "Save your changes first" : undefined} className="btn-secondary">
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  aria-hidden="true"
                  animate={syncing ? { rotate: 360 } : { rotate: 0 }}
                  transition={syncing ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                >
                  <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </motion.svg>
                {syncing ? "Syncing…" : "Sync from GitHub"}
              </motion.button>
              <motion.button
                variants={pop}
                type="button"
                onClick={() => {
                  setDraft(emptyManual());
                  setEditing("new");
                }}
                disabled={busy || dirty}
                title={dirty ? "Save your changes first" : undefined}
                className="btn-secondary"
              >
                <span className="text-base leading-none">+</span> Add project
              </motion.button>
              <motion.button variants={pop} type="button" onClick={save} disabled={!dirty || busy} className="btn-primary min-w-32">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={saving ? "saving" : dirty ? "save" : "saved"}
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EXPO }}
                    className="flex items-center gap-1.5"
                  >
                    {saving ? "Saving…" : dirty ? "Save changes" : <><Check /> Saved</>}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </div>

          <AnimatePresence>
            {repoError && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-clip rounded-xl border border-border bg-surface/80 p-4 text-sm backdrop-blur"
              >
                Couldn&apos;t reach GitHub with your token ({repoError}). Showing cached public data — private repos and syncing are
                unavailable until GITHUB_TOKEN works.
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── List ──────────────────────────────────────────── */}
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <motion.div
                className="mt-12 hidden grid-cols-[1fr_auto] px-4 pb-3 text-[11px] uppercase tracking-[0.16em] text-muted md:grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <span>Project</span>
                <span className="pr-[8.5rem]">Visible · Featured</span>
              </motion.div>
              <Reorder.Group
                axis="y"
                values={rows}
                onReorder={(v) => {
                  setRows(v);
                  setDirty(true);
                }}
                className="flex flex-col gap-2.5 max-md:mt-10"
              >
                {rows.map((row, i) => (
                  <Row
                    key={row.id}
                    row={row}
                    index={i}
                    total={rows.length}
                    intro={introIds.current.has(row.id)}
                    repo={row.repoName ? repoMap.get(row.repoName) : undefined}
                    onToggle={(patch) => update(row.id, patch)}
                    onEdit={() => setEditing(row.id)}
                    onMove={(d) => move(i, d)}
                  />
                ))}
              </Reorder.Group>
            </>
          )}
          <motion.p
            className="mt-8 text-xs text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Drag rows by the handle (or use the arrows) to set the order on the site. Private repositories are listed for reference but
            can never be published.
          </motion.p>
        </main>

        {/* ── Unsaved-changes dock ─────────────────────────────── */}
        <AnimatePresence>
          {dirty && !editingRow && (
            <motion.div
              className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={SPRING}
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-bg/85 py-2 pl-5 pr-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <span className="relative mr-1 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                <span className="mr-2 text-sm">Unsaved changes</span>
                <button type="button" onClick={discard} disabled={saving} className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg">
                  Discard
                </button>
                <button type="button" onClick={save} disabled={saving} className="btn-primary">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Editor drawer ───────────────────────────────────── */}
        <AnimatePresence>
          {editingRow && (
            <Editor
              key={editing === "new" ? "new" : editingRow.id}
              row={editingRow}
              isNew={editing === "new"}
              repo={editingRow.repoName ? repoMap.get(editingRow.repoName) : undefined}
              preview={preview(editingRow)}
              blobEnabled={blobEnabled}
              pending={busy}
              now={now}
              onChange={(patch) => (editing === "new" ? setDraft((d) => ({ ...d, ...patch })) : update(editingRow.id, patch))}
              onClose={() => setEditing(null)}
              onCreate={() =>
                startTransition(async () => {
                  const res = await createManualProject({
                    title: draft.title ?? "",
                    description: draft.description,
                    coverImage: draft.coverImage,
                    liveUrl: draft.liveUrl,
                    tags: draft.tags,
                    role: draft.role,
                    year: draft.year,
                    summary: draft.summary,
                    body: draft.body,
                    slug: draft.slug || slugify(draft.title ?? "") || "project",
                    repoUrl: draft.repoUrl,
                    language: draft.language,
                    visible: draft.visible,
                    featured: draft.featured,
                  });
                  report(res, () => {
                    setEditing(null);
                    router.refresh();
                  });
                })
              }
              onDelete={() =>
                startTransition(async () => {
                  if (editing === "new" || editing === null) return;
                  const res = await deleteProject(editing);
                  report(res, () => {
                    setRows((rs) => rs.filter((r) => r.id !== editing));
                    setEditing(null);
                    router.refresh();
                  });
                })
              }
              onUpload={(file) =>
                new Promise<void>((resolve) => {
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await uploadCover(fd);
                    report(res, (d) =>
                      editing === "new" ? setDraft((x) => ({ ...x, coverImage: d.url })) : update(editingRow.id, { coverImage: d.url }),
                    );
                    resolve();
                  });
                })
              }
            />
          )}
        </AnimatePresence>

        {/* ── Toast ───────────────────────────────────────────── */}
        <div aria-live="polite" className="pointer-events-none fixed left-1/2 top-24 z-[60] -translate-x-1/2">
          <AnimatePresence>
            {status && (
              <motion.div
                key={status.text}
                initial={{ opacity: 0, y: -24, scale: 0.9, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={SPRING}
                role={status.kind === "error" ? "alert" : "status"}
                className={`flex max-w-[90vw] items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-5 text-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] ${
                  status.kind === "ok" ? "bg-fg text-bg" : "bg-accent text-on-accent"
                }`}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-full ${status.kind === "ok" ? "bg-accent text-on-accent" : "bg-on-accent text-accent"}`}>
                  {status.kind === "ok" ? <Check /> : "!"}
                </span>
                {status.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

/* ─────────────────────────────────────────────────────────────── */

const pop: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EXPO } },
};

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Number that counts to its new value whenever it changes. */
function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: EXPO });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className="tabular-nums">{rounded}</motion.span>;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <motion.div
      variants={pop}
      className={`flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-sm backdrop-blur ${
        accent ? "border-accent/40 bg-accent/10" : "border-border bg-bg/60"
      }`}
    >
      <dd className="font-display text-base font-semibold">
        <AnimatedNumber value={value} />
      </dd>
      <dt className="text-muted">{label}</dt>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EXPO, delay: 0.5 }}
      className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-border bg-bg/50 px-6 py-20 text-center backdrop-blur"
    >
      <div className="relative mb-8 grid size-24 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-accent/25"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="relative size-14 rounded-full bg-accent"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="font-display text-2xl font-semibold tracking-tight">No projects yet</p>
      <p className="mt-2 max-w-sm text-muted">Run “Sync from GitHub” to import your repos, or add one manually.</p>
    </motion.div>
  );
}

function Switch({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-35 ${
        checked ? "justify-end bg-fg" : "justify-start bg-border"
      }`}
    >
      <motion.span layout transition={SPRING} className="grid size-5 place-items-center rounded-full bg-bg shadow-sm">
        <AnimatePresence initial={false}>
          {checked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={SPRING}
              className="size-1.5 rounded-full bg-accent"
            />
          )}
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}

/** Mini generative thumbnail (or the cover image when one is set). */
function Thumb({ row, repo }: { row: SerializedRow; repo?: GhRepo }) {
  const lang = repo?.language ?? row.language;
  const color = repo?.languageColor ?? null;
  const title = row.title || (row.repoName ? prettifyRepoName(row.repoName) : row.slug);
  if (row.coverImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={row.coverImage} alt="" className="size-full object-cover transition-transform duration-700 ease-expo group-hover:scale-110" />;
  }
  return (
    <div className="relative size-full overflow-clip bg-surface">
      <span
        className="absolute -right-3 -top-3 size-12 rounded-full opacity-70 blur-[6px] transition-transform duration-700 ease-expo group-hover:scale-150"
        style={{ background: color ?? "var(--accent)" }}
      />
      <span className="absolute bottom-1.5 left-2 font-display text-lg font-bold leading-none tracking-tight">
        {title.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "··"}
      </span>
      {lang && <span className="absolute right-1.5 top-1.5 text-[8px] uppercase tracking-widest text-muted">{lang.slice(0, 4)}</span>}
    </div>
  );
}

function Row({
  row,
  index,
  total,
  intro,
  repo,
  onToggle,
  onEdit,
  onMove,
}: {
  row: SerializedRow;
  index: number;
  total: number;
  intro: boolean;
  repo?: GhRepo;
  onToggle: (patch: Partial<SerializedRow>) => void;
  onEdit: () => void;
  onMove: (delta: number) => void;
}) {
  const controls = useDragControls();
  const title = row.title || (row.repoName ? prettifyRepoName(row.repoName) : row.slug);
  const missing = row.source === "github" && !repo;
  const locked = row.isPrivate;

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
      transition={{ duration: 0.75, ease: EXPO, delay: intro ? 0.6 + Math.min(index, 12) * 0.05 : 0 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.35)", zIndex: 20 }}
      className="group relative flex items-center gap-3 overflow-clip rounded-2xl border border-border bg-bg/75 p-3 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-500 ease-expo hover:-translate-y-0.5 hover:border-fg/20 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] sm:gap-4"
    >
      {/* featured accent bar */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-1 origin-center rounded-r-full bg-accent"
        initial={false}
        animate={{ scaleY: row.featured ? 1 : 0, opacity: row.featured ? 1 : 0 }}
        transition={SPRING}
      />

      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="hidden cursor-grab touch-none rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-fg active:cursor-grabbing sm:block"
        aria-label={`Drag to reorder ${title}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
        </svg>
      </button>

      <div className="relative hidden aspect-[16/10] w-20 shrink-0 overflow-clip rounded-lg sm:block">
        <Thumb row={row} repo={repo} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{title}</span>
          <AnimatePresence initial={false}>
            {row.featured && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={SPRING}
                className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-on-accent"
              >
                ★ Featured
              </motion.span>
            )}
          </AnimatePresence>
          {row.source === "manual" && <Badge>Manual</Badge>}
          {row.isPrivate && <Badge tone="warn">Private</Badge>}
          {missing && <Badge tone="warn">Not on GitHub</Badge>}
          {repo?.isFork && <Badge>Fork</Badge>}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
          {repo?.languageColor && <span className="size-2 shrink-0 rounded-full" style={{ background: repo.languageColor }} />}
          <span className="truncate">
            {row.repoName ?? "manual"} · /work/{row.slug}
            {repo && ` · ★ ${repo.stars}`}
          </span>
        </p>
      </div>

      <Switch label={`Show ${title} in the projects grid`} checked={row.visible} disabled={locked} onChange={(v) => onToggle({ visible: v })} />
      <Switch label={`Feature ${title}`} checked={row.featured} disabled={locked} onChange={(v) => onToggle({ featured: v })} />

      <div className="flex flex-col">
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded px-1 text-[10px] text-muted transition-colors hover:text-fg disabled:opacity-25" aria-label={`Move ${title} up`}>
          ▲
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="rounded px-1 text-[10px] text-muted transition-colors hover:text-fg disabled:opacity-25" aria-label={`Move ${title} down`}>
          ▼
        </button>
      </div>
      <motion.button
        type="button"
        onClick={onEdit}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-fg hover:bg-fg hover:text-bg"
      >
        Edit
      </motion.button>
    </Reorder.Item>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${tone === "warn" ? "bg-accent/15 text-accent-ink" : "bg-surface text-muted"}`}>{children}</span>
  );
}

const section: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EXPO } },
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Editor({
  row,
  isNew,
  repo,
  preview,
  blobEnabled,
  pending,
  now,
  onChange,
  onClose,
  onCreate,
  onDelete,
  onUpload,
}: {
  row: SerializedRow;
  isNew: boolean;
  repo?: GhRepo;
  preview: PublicProject | null;
  blobEnabled: boolean;
  pending: boolean;
  now: number;
  onChange: (patch: Partial<SerializedRow>) => void;
  onClose: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onUpload: (f: File) => Promise<void>;
}) {
  const [tab, setTab] = useState<"card" | "featured">("card");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagText, setTagText] = useState(row.tags.join(", "));
  const [uploading, setUploading] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const manual = row.source === "manual";
  const text = (v: string | null) => v ?? "";
  const set = (k: keyof SerializedRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ [k]: e.target.value || null } as Partial<SerializedRow>);

  useEffect(() => {
    const id = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true }), 450);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-fg/25 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />
      <motion.aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? "Add project" : `Edit ${row.title || row.repoName}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[660px] flex-col border-l border-border bg-bg shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.35)] sm:inset-y-3 sm:right-3 sm:rounded-3xl sm:border"
        initial={{ x: "105%" }}
        animate={{ x: 0 }}
        exit={{ x: "105%" }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="eyebrow">{isNew ? "New" : manual ? "Manual project" : (row.repoName ?? "")}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{isNew ? "Add project" : "Edit project"}</h2>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ rotate: 90 }}
            transition={SPRING}
            className="grid size-10 place-items-center rounded-full border border-border hover:border-fg"
            aria-label="Close editor"
          >
            ✕
          </motion.button>
        </div>

        <motion.div
          className="flex-1 space-y-10 overflow-y-auto px-6 py-6"
          data-lenis-prevent
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
        >
          <motion.section variants={section} aria-label="Preview">
            <div className="mb-4 flex gap-1 rounded-full bg-surface p-1 text-sm" role="tablist">
              {(["card", "featured"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`relative flex-1 rounded-full px-3 py-2 transition-colors ${tab === t ? "text-fg" : "text-muted hover:text-fg"}`}
                >
                  {tab === t && <motion.span layoutId="editor-tab" className="absolute inset-0 rounded-full bg-bg shadow-sm" transition={SPRING} />}
                  <span className="relative">{t === "card" ? "Grid card" : "Featured cover"}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: EXPO }}
              >
                {preview ? (
                  tab === "card" ? (
                    <div className="max-w-sm">
                      <ProjectCard project={preview} now={now} />
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] overflow-clip rounded-xl bg-surface">
                      <ProjectCover title={preview.title} cover={preview.cover} language={preview.language} languageColor={preview.languageColor} sizes="600px" />
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted">No GitHub data for this repo — preview unavailable.</p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.section>

          <motion.section variants={section} className="space-y-5">
            <SectionTitle n="01">Card</SectionTitle>
            <Field label="Title" hint={repo ? `Default: ${prettifyRepoName(repo.name)}` : undefined}>
              <input className="input" value={text(row.title)} onChange={set("title")} placeholder={repo ? prettifyRepoName(repo.name) : "Project name"} />
            </Field>
            <Field label="Description" hint={repo?.description ? `GitHub: ${repo.description}` : undefined}>
              <textarea className="input min-h-24 resize-y" value={text(row.description)} onChange={set("description")} placeholder="What it is, who it's for, what makes it interesting." />
            </Field>
            <Field label="Tags" hint="Comma separated — shown as topics and used by the filters.">
              <input
                className="input"
                value={tagText}
                onChange={(e) => {
                  setTagText(e.target.value);
                  onChange({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) });
                }}
                placeholder="mern, ecommerce"
              />
              <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {row.tags.map((t) => (
                    <motion.span
                      key={t}
                      layout
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={SPRING}
                      className="rounded-full bg-surface px-2.5 py-1 text-xs"
                    >
                      {t}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </Field>
            <Field label="Live demo URL" hint={repo?.homepage ? `GitHub homepage: ${repo.homepage}` : undefined}>
              <input className="input" type="url" value={text(row.liveUrl)} onChange={set("liveUrl")} placeholder={repo?.homepage ?? "https://…"} />
            </Field>
            <Field label="Cover image" hint={blobEnabled ? "Paste an https URL or upload a file." : "Paste an https URL. (Uploads need BLOB_READ_WRITE_TOKEN.)"}>
              <div className="flex gap-2">
                <input className="input flex-1" type="url" value={text(row.coverImage)} onChange={set("coverImage")} placeholder="https://…" />
                <label
                  className={`btn-secondary cursor-pointer ${!blobEnabled ? "pointer-events-none opacity-40" : ""}`}
                  title={blobEnabled ? undefined : "Set BLOB_READ_WRITE_TOKEN to enable"}
                >
                  {uploading ? (
                    <motion.span className="size-4 rounded-full border-2 border-current border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  ) : (
                    "Upload"
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    className="sr-only"
                    disabled={!blobEnabled}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setUploading(true);
                        await onUpload(f);
                        setUploading(false);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </Field>
            {manual && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Repo URL (optional)">
                  <input className="input" type="url" value={text(row.repoUrl)} onChange={set("repoUrl")} placeholder="https://…" />
                </Field>
                <Field label="Language">
                  <input className="input" value={text(row.language)} onChange={set("language")} placeholder="TypeScript" />
                </Field>
              </div>
            )}
          </motion.section>

          <motion.section variants={section} className="space-y-5">
            <SectionTitle n="02">Case study</SectionTitle>
            <Field label="URL slug" hint={`ardevbajracharya.com.np/work/${row.slug || "…"}`}>
              <input
                className="input font-mono text-sm"
                value={row.slug}
                onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder={slugify(row.title ?? "") || "my-project"}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <Field label="Role">
                <input className="input" value={text(row.role)} onChange={set("role")} placeholder="Design & full-stack development" />
              </Field>
              <Field label="Year">
                <input className="input" value={text(row.year)} onChange={set("year")} placeholder="2026" />
              </Field>
            </div>
            <Field label="Summary" hint="One or two sentences shown under the case-study title.">
              <textarea className="input min-h-20 resize-y" value={text(row.summary)} onChange={set("summary")} />
            </Field>
            <Field label="Body" hint="Plain text. Blank line = new paragraph; a line starting with “## ” becomes a heading.">
              <textarea className="input min-h-56 resize-y font-mono text-sm leading-relaxed" value={text(row.body)} onChange={set("body")} />
            </Field>
          </motion.section>

          {isNew && (
            <motion.section variants={section} className="flex gap-8">
              <label className="flex items-center gap-3 text-sm">
                <Switch label="Visible" checked={row.visible} onChange={(v) => onChange({ visible: v })} /> Visible
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Switch label="Featured" checked={row.featured} onChange={(v) => onChange({ featured: v })} /> Featured
              </label>
            </motion.section>
          )}
        </motion.div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          {!isNew ? (
            <motion.button
              type="button"
              layout
              disabled={pending}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              onBlur={() => setConfirmDelete(false)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${confirmDelete ? "bg-accent text-on-accent" : "text-accent-ink hover:bg-accent/10"}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={String(confirmDelete)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="block">
                  {confirmDelete ? "Click again to delete" : "Delete"}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ) : (
            <span />
          )}
          {isNew ? (
            <button type="button" disabled={pending || !row.title} onClick={onCreate} className="btn-primary">
              {pending ? "Creating…" : "Create project"}
            </button>
          ) : (
            <button type="button" onClick={onClose} className="btn-primary">
              Done <span className="opacity-60">— remember to save</span>
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 font-display text-lg font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-full bg-accent/15 text-xs text-accent-ink">{n}</span>
      {children}
      <span className="h-px flex-1 bg-border" />
    </h3>
  );
}
