import React, { useEffect, useMemo, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Project, Task } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import {
  LayoutGrid,
  List as ListIcon,
  Star,
  StarOff,
  Pin,
  PinOff,
  Share2,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ViewMode = 'grid' | 'list';

function usePerUserStorage<T>(key: string, userId?: string, initial: T | (() => T) = [] as unknown as T) {
  const storageKey = userId ? `${key}_${userId}` : key;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as T;
      return typeof initial === 'function' ? (initial as () => T)() : initial;
    } catch {
      return typeof initial === 'function' ? (initial as () => T)() : initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [storageKey, value]);
  return [value, setValue] as const;
}

function ProjectProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  );
}

function SortableWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function ProjectCard({
  project,
  openTasks,
  isPinned,
  isFavorite,
  onTogglePin,
  onToggleFavorite,
  onDelete,
  onShare,
}: {
  project: Project;
  openTasks: number;
  isPinned: boolean;
  isFavorite: boolean;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground p-4 shadow-sm hover:shadow transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 rounded" style={{ backgroundColor: project.color }} />
          <div>
            <div className="font-semibold text-lg">{project.name}</div>
            {project.description && (
              <div className="text-sm text-muted-foreground mt-0.5">{truncateText(project.description, 80)}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label={isPinned ? 'Unpin' : 'Pin'} onClick={onTogglePin}>
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" aria-label={isFavorite ? 'Unfavorite' : 'Favorite'} onClick={onToggleFavorite}>
            {isFavorite ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" aria-label="Share" onClick={onShare}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ProjectProgressBar progress={project.progress ?? 0} />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>{openTasks} open tasks</div>
          <div>Updated {formatRelativeTime(project.updated_at)}</div>
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  openTasks,
  isPinned,
  isFavorite,
  onTogglePin,
  onToggleFavorite,
  onDelete,
  onShare,
}: {
  project: Project;
  openTasks: number;
  isPinned: boolean;
  isFavorite: boolean;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-4 px-3 py-2 border-b border-border hover:bg-accent/40">
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-2 h-6 rounded" style={{ backgroundColor: project.color }} />
        <div className="font-medium">{project.name}</div>
      </div>
      <div className="col-span-2 text-sm text-muted-foreground">{openTasks} open</div>
      <div className="col-span-3 text-sm text-muted-foreground">Updated {formatRelativeTime(project.updated_at)}</div>
      <div className="col-span-2 flex items-center justify-end gap-1">
        <Button size="icon" variant="ghost" aria-label={isPinned ? 'Unpin' : 'Pin'} onClick={onTogglePin}>
          {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </Button>
        <Button size="icon" variant="ghost" aria-label={isFavorite ? 'Unfavorite' : 'Favorite'} onClick={onToggleFavorite}>
          {isFavorite ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
        </Button>
        <Button size="icon" variant="ghost" aria-label="Share" onClick={onShare}>
          <Share2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Delete" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const { projects, isLoading, deleteProject } = useProjects();
  const { tasks } = useTasks();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [view, setView] = usePerUserStorage<ViewMode>('projects_view', user?.id, 'grid');
  const [pinned, setPinned] = usePerUserStorage<string[]>('projects_pinned', user?.id, []);
  const [favorites, setFavorites] = usePerUserStorage<string[]>('projects_favorites', user?.id, []);
  const [archived, setArchived] = usePerUserStorage<string[]>('projects_archived', user?.id, []);
  const [order, setOrder] = usePerUserStorage<string[]>('projects_order', user?.id, []);

  // Merge persisted order with server projects
  const orderedProjects = useMemo<Project[]>(() => {
    const active = projects.filter((p: Project) => !archived.includes(p.id));
    if (order.length === 0) return active;
    const idToProject = new Map<string, Project>(active.map((p: Project) => [p.id, p]));
    const inOrder: Project[] = [];
    order.forEach((id: string) => {
      const proj = idToProject.get(id);
      if (proj) inOrder.push(proj);
      idToProject.delete(id);
    });
    // Append new ones not yet in order
    return [...inOrder, ...Array.from(idToProject.values())];
  }, [projects, order, archived]);

  const pinnedProjects = orderedProjects.filter((p: Project) => pinned.includes(p.id));
  const otherProjects = orderedProjects.filter((p: Project) => !pinned.includes(p.id));

  const openByProject = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t: Task) => {
      if (t.project_id && t.status !== 'done') {
        map.set(t.project_id, (map.get(t.project_id) || 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent, list: Project[], isPinnedList: boolean) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = list.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    const newIds = arrayMove(ids, oldIndex, newIndex);

    // Merge back into global order preserving other section
    const pinnedIds = pinnedProjects.map((p) => p.id);
    const otherIds = otherProjects.map((p) => p.id);
    const newPinned = isPinnedList ? newIds : pinnedIds;
    const newOthers = isPinnedList ? otherIds : newIds;
    setOrder([...newPinned, ...newOthers]);
  }

  function togglePin(id: string) {
    setPinned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
    // also move to front section in order
    setOrder((prev) => {
      const without = prev.filter((x) => x !== id);
      return [id, ...without];
    });
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }

  function removeProject(id: string) {
    // optimistic local cleanup for per-user UI state
    setPinned((prev) => prev.filter((x) => x !== id));
    setFavorites((prev) => prev.filter((x) => x !== id));
    setArchived((prev) => prev.filter((x) => x !== id));
    setOrder((prev) => prev.filter((x) => x !== id));
    deleteProject(id);
  }

  async function share(project: Project) {
    const shareText = `${project.name} — ${window.location.origin}/kanban`;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {}
  }

  useEffect(() => {
    // Initialize default order if empty
    if (projects.length > 0 && order.length === 0) {
      setOrder(projects.map((p) => p.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasProjects = orderedProjects.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Grid
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            <ListIcon className="w-4 h-4 mr-2" /> List
          </Button>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {!hasProjects && (
        <div className="mt-24 flex flex-col items-center text-center gap-4">
          <div className="text-2xl font-semibold">Create your first project</div>
          <div className="text-muted-foreground">Organize tasks by initiatives, sprints, or teams.</div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Project
          </Button>
        </div>
      )}

      {hasProjects && (
        <div className="mt-6 space-y-8">
          {pinnedProjects.length > 0 && (
            <section>
              <div className="text-sm font-semibold text-muted-foreground mb-3">Pinned</div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, pinnedProjects, true)}>
                <SortableContext items={pinnedProjects.map((p) => p.id)} strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
                  {view === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar">
                      {pinnedProjects.map((project) => (
                        <SortableWrapper key={project.id} id={project.id}>
                          <ProjectCard
                            project={project}
                            openTasks={openByProject.get(project.id) || 0}
                            isPinned={pinned.includes(project.id)}
                            isFavorite={favorites.includes(project.id)}
                            onTogglePin={() => togglePin(project.id)}
                            onToggleFavorite={() => toggleFavorite(project.id)}
                            onDelete={() => removeProject(project.id)}
                            onShare={() => share(project)}
                          />
                        </SortableWrapper>
                      ))}
                    </div>
                  ) : (
                  <div className="rounded-lg border border-border overflow-hidden max-h-[70vh] overflow-y-auto scrollbar">
                      {pinnedProjects.map((project) => (
                        <SortableWrapper key={project.id} id={project.id}>
                          <ProjectRow
                            project={project}
                            openTasks={openByProject.get(project.id) || 0}
                            isPinned={pinned.includes(project.id)}
                            isFavorite={favorites.includes(project.id)}
                            onTogglePin={() => togglePin(project.id)}
                            onToggleFavorite={() => toggleFavorite(project.id)}
                            onDelete={() => removeProject(project.id)}
                            onShare={() => share(project)}
                          />
                        </SortableWrapper>
                      ))}
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </section>
          )}

          <section>
            {pinnedProjects.length > 0 && (
              <div className="text-sm font-semibold text-muted-foreground mb-3">All projects</div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, otherProjects, false)}>
              <SortableContext items={otherProjects.map((p) => p.id)} strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
                {view === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar">
                    {otherProjects.map((project) => (
                      <SortableWrapper key={project.id} id={project.id}>
                        <ProjectCard
                          project={project}
                          openTasks={openByProject.get(project.id) || 0}
                          isPinned={pinned.includes(project.id)}
                          isFavorite={favorites.includes(project.id)}
                          onTogglePin={() => togglePin(project.id)}
                          onToggleFavorite={() => toggleFavorite(project.id)}
                          onDelete={() => removeProject(project.id)}
                          onShare={() => share(project)}
                        />
                      </SortableWrapper>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden max-h-[70vh] overflow-y-auto scrollbar">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                      <div className="col-span-5">Project</div>
                      <div className="col-span-2">Open</div>
                      <div className="col-span-3">Last update</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    {otherProjects.map((project) => (
                      <SortableWrapper key={project.id} id={project.id}>
                        <ProjectRow
                          project={project}
                          openTasks={openByProject.get(project.id) || 0}
                          isPinned={pinned.includes(project.id)}
                          isFavorite={favorites.includes(project.id)}
                          onTogglePin={() => togglePin(project.id)}
                          onToggleFavorite={() => toggleFavorite(project.id)}
                          onDelete={() => removeProject(project.id)}
                          onShare={() => share(project)}
                        />
                      </SortableWrapper>
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </section>
        </div>
      )}

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}


