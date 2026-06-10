"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  MechanicEmptyState,
  MechanicShell,
  MechanicStatusBadge,
} from "@/components/mechanic-shell";
import { Button } from "@/components/ui/button";
import {
  addMechanicChecklist,
  addMechanicNote,
  addMechanicPhoto,
  formatDate,
  getMechanicTask,
  listMechanicTasks,
  MechanicTask,
  updateMechanicTaskStatus,
} from "@/lib/mechanic-tasks";
import { ServiceOrderStatus } from "@/lib/admin-service-orders";

const statuses: ServiceOrderStatus[] = [
  "CHECKED_IN",
  "DIAGNOSIS",
  "WAITING_APPROVAL",
  "IN_PROGRESS",
  "WAITING_SPAREPART",
  "QUALITY_CHECK",
  "READY_TO_PICKUP",
];

const emptyNote = {
  note: "",
  visibility: "INTERNAL" as "INTERNAL" | "CUSTOMER_VISIBLE",
};

const emptyPhoto = {
  url: "",
  caption: "",
  visibility: "CUSTOMER_VISIBLE" as "INTERNAL" | "CUSTOMER_VISIBLE",
};

const emptyChecklist = {
  title: "",
  isDone: true,
  note: "",
};

export default function MechanicTasksPage() {
  const [tasks, setTasks] = useState<MechanicTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MechanicTask | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState(emptyNote);
  const [photo, setPhoto] = useState(emptyPhoto);
  const [checklist, setChecklist] = useState(emptyChecklist);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTasks = useMemo(
    () => tasks.filter((task) => !["COMPLETED", "CANCELLED"].includes(task.status)),
    [tasks]
  );

  async function loadTasks(nextSearch = search, nextStatus = status) {
    setError("");
    setIsLoading(true);
    try {
      const result = await listMechanicTasks({
        search: nextSearch,
        status: nextStatus,
      });
      setTasks(result.data);
      if (result.data.length > 0) {
        const current =
          selectedTask && result.data.find((task) => task.id === selectedTask.id);
        const detail = await getMechanicTask((current || result.data[0]).id);
        setSelectedTask(detail);
      } else {
        setSelectedTask(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Request gagal");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshSelected(id = selectedTask?.id) {
    if (!id) return;
    const detail = await getMechanicTask(id);
    setSelectedTask(detail);
    setTasks((current) =>
      current.map((task) => (task.id === detail.id ? { ...task, ...detail } : task))
    );
  }

  async function runAction(action: () => Promise<unknown>) {
    if (!selectedTask) return;
    setError("");
    setIsSubmitting(true);
    try {
      await action();
      await refreshSelected(selectedTask.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Request gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    listMechanicTasks()
      .then(async (result) => {
        if (!isMounted) return;
        setTasks(result.data);
        if (result.data[0]) {
          const detail = await getMechanicTask(result.data[0].id);
          if (isMounted) setSelectedTask(detail);
        } else {
          setSelectedTask(null);
        }
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Request gagal");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    await runAction(() => addMechanicNote(selectedTask.id, note));
    setNote(emptyNote);
  }

  async function submitPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    await runAction(() =>
      addMechanicPhoto(selectedTask.id, {
        url: photo.url,
        caption: photo.caption || undefined,
        visibility: photo.visibility,
      })
    );
    setPhoto(emptyPhoto);
  }

  async function submitChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    await runAction(() =>
      addMechanicChecklist(selectedTask.id, {
        title: checklist.title,
        isDone: checklist.isDone,
        note: checklist.note || undefined,
      })
    );
    setChecklist(emptyChecklist);
  }

  return (
    <MechanicShell
      title="Mechanic Tasks"
      description="Lihat task service yang ditugaskan, update progress, catatan, foto, dan checklist pekerjaan."
    >
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Task Aktif" value={activeTasks.length} />
        <SummaryCard label="Total Task" value={tasks.length} />
        <SummaryCard
          label="Quality Check"
          value={tasks.filter((task) => task.status === "QUALITY_CHECK").length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <section className="space-y-4">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <div className="grid gap-3">
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Cari kode, customer, layanan, atau plat"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">Semua status</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={() => loadTasks(search, status)}>
                  Filter
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <MechanicEmptyState
              title="Memuat task"
              description="Daftar task mekanik sedang diambil."
            />
          ) : null}
          {!isLoading && tasks.length === 0 ? (
            <MechanicEmptyState
              title="Belum ada task"
              description="Task service akan tampil setelah admin assign service order ke mekanik."
            />
          ) : null}

          <div className="space-y-3">
            {tasks.map((task) => {
              const isActive = selectedTask?.id === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => refreshSelected(task.id)}
                  className={`w-full rounded-xl border bg-background p-4 text-left shadow-sm transition hover:border-primary/40 ${
                    isActive ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{task.code}</p>
                      <h2 className="mt-1 font-semibold">{task.serviceName}</h2>
                    </div>
                    <MechanicStatusBadge status={task.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {task.customer?.name || "-"} - {task.vehicle?.plateNumber || "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimasi: {formatDate(task.estimatedFinishedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            note={note}
            photo={photo}
            checklist={checklist}
            isSubmitting={isSubmitting}
            onStatusChange={(nextStatus) =>
              runAction(() => updateMechanicTaskStatus(selectedTask.id, nextStatus))
            }
            onNoteChange={setNote}
            onPhotoChange={setPhoto}
            onChecklistChange={setChecklist}
            onNoteSubmit={submitNote}
            onPhotoSubmit={submitPhoto}
            onChecklistSubmit={submitChecklist}
          />
        ) : (
          <MechanicEmptyState
            title="Pilih task"
            description="Detail task, form progress, dan checklist akan tampil di sini."
          />
        )}
      </div>
    </MechanicShell>
  );
}

function TaskDetail({
  task,
  note,
  photo,
  checklist,
  isSubmitting,
  onStatusChange,
  onNoteChange,
  onPhotoChange,
  onChecklistChange,
  onNoteSubmit,
  onPhotoSubmit,
  onChecklistSubmit,
}: {
  task: MechanicTask;
  note: typeof emptyNote;
  photo: typeof emptyPhoto;
  checklist: typeof emptyChecklist;
  isSubmitting: boolean;
  onStatusChange: (status: ServiceOrderStatus) => void;
  onNoteChange: (value: typeof emptyNote) => void;
  onPhotoChange: (value: typeof emptyPhoto) => void;
  onChecklistChange: (value: typeof emptyChecklist) => void;
  onNoteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPhotoSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChecklistSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isLocked = ["COMPLETED", "CANCELLED"].includes(task.status);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{task.code}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {task.serviceName}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {task.customer?.name || "-"} - {task.vehicle?.plateNumber || "-"} -{" "}
              {task.vehicle?.brand || "-"} {task.vehicle?.model || ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MechanicStatusBadge status={task.status} />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={task.status}
              disabled={isLocked || isSubmitting}
              onChange={(event) =>
                onStatusChange(event.target.value as ServiceOrderStatus)
              }
            >
              <option value={task.status}>{task.status}</option>
              {statuses
                .filter((status) => status !== task.status)
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoCard label="Current Step" value={task.currentStep} />
          <InfoCard label="Check-in" value={formatDate(task.checkInAt)} />
          <InfoCard label="Estimasi Selesai" value={formatDate(task.estimatedFinishedAt)} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextBlock title="Keluhan Customer" value={task.customerComplaint || "-"} />
          <TextBlock title="Diagnosis Awal" value={task.initialDiagnosis || "-"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Service & Sparepart">
          <List title="Service Items" items={task.serviceItems || []} />
          <List title="Sparepart Items" items={task.sparepartItems || []} />
        </Panel>

        <Panel title="Checklist Pekerjaan">
          <form onSubmit={onChecklistSubmit} className="space-y-3">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Contoh: Cek rem depan"
              value={checklist.title}
              disabled={isLocked || isSubmitting}
              onChange={(event) =>
                onChecklistChange({ ...checklist, title: event.target.value })
              }
            />
            <textarea
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Catatan checklist"
              value={checklist.note}
              disabled={isLocked || isSubmitting}
              onChange={(event) =>
                onChecklistChange({ ...checklist, note: event.target.value })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checklist.isDone}
                disabled={isLocked || isSubmitting}
                onChange={(event) =>
                  onChecklistChange({ ...checklist, isDone: event.target.checked })
                }
              />
              Tandai selesai
            </label>
            <Button disabled={isLocked || isSubmitting || !checklist.title}>
              Tambah Checklist
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            {(task.checklists || []).map((item) => (
              <div key={item.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {item.isDone ? "Done" : "Open"} - {item.title}
                </p>
                {item.note ? (
                  <p className="mt-1 text-muted-foreground">{item.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Catatan Progress">
          <form onSubmit={onNoteSubmit} className="space-y-3">
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Tulis catatan teknis atau update untuk customer"
              value={note.note}
              disabled={isLocked || isSubmitting}
              onChange={(event) => onNoteChange({ ...note, note: event.target.value })}
            />
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={note.visibility}
              disabled={isLocked || isSubmitting}
              onChange={(event) =>
                onNoteChange({
                  ...note,
                  visibility: event.target.value as "INTERNAL" | "CUSTOMER_VISIBLE",
                })
              }
            >
              <option value="INTERNAL">Internal</option>
              <option value="CUSTOMER_VISIBLE">Customer Visible</option>
            </select>
            <Button disabled={isLocked || isSubmitting || !note.note}>
              Tambah Catatan
            </Button>
          </form>
          <ActivityList
            items={(task.notes || []).map((item) => ({
              id: item.id,
              title: item.visibility,
              body: item.note,
              date: item.createdAt,
            }))}
          />
        </Panel>

        <Panel title="Foto Progress">
          <form onSubmit={onPhotoSubmit} className="space-y-3">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://..."
              value={photo.url}
              disabled={isLocked || isSubmitting}
              onChange={(event) => onPhotoChange({ ...photo, url: event.target.value })}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Caption"
              value={photo.caption}
              disabled={isLocked || isSubmitting}
              onChange={(event) =>
                onPhotoChange({ ...photo, caption: event.target.value })
              }
            />
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={photo.visibility}
              disabled={isLocked || isSubmitting}
              onChange={(event) =>
                onPhotoChange({
                  ...photo,
                  visibility: event.target.value as "INTERNAL" | "CUSTOMER_VISIBLE",
                })
              }
            >
              <option value="CUSTOMER_VISIBLE">Customer Visible</option>
              <option value="INTERNAL">Internal</option>
            </select>
            <Button disabled={isLocked || isSubmitting || !photo.url}>
              Tambah Foto
            </Button>
          </form>
          <ActivityList
            items={(task.photos || []).map((item) => ({
              id: item.id,
              title: item.visibility,
              body: item.caption || item.url,
              date: item.createdAt,
            }))}
          />
        </Panel>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function List({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; quantity: number }[];
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada item.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border bg-muted/30 p-3 text-sm">
              {item.name} x{item.quantity}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityList({
  items,
}: {
  items: { id: string; title: string; body: string; date: string }[];
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">Belum ada data.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{item.title}</p>
          <p className="mt-1 text-muted-foreground">{item.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.date)}</p>
        </div>
      ))}
    </div>
  );
}
