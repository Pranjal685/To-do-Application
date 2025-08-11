import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { X, Calendar, Clock, Flag, Tag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Task, UpdateTaskForm } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function EditTaskModal({ isOpen, onClose, task }: EditTaskModalProps) {
  const { updateTask, isUpdating } = useTasks();
  const { projects } = useProjects();

  const defaultValues = useMemo(() => {
    if (!task) return undefined;
    return {
      title: task.title || '',
      description: task.description || '',
      priority: task.priority,
      project_id: task.project_id || '',
      due_date: task.due_date || undefined,
      estimated_duration: task.estimated_duration ?? undefined,
      tags: task.tags || [],
    };
  }, [task]);

  const { control, register, reset, handleSubmit, formState: { errors }, watch } = useForm<any>({
    values: defaultValues,
  });

  useEffect(() => {
    if (isOpen && task && defaultValues) {
      reset(defaultValues);
    }
  }, [isOpen, task, defaultValues, reset]);

  if (!task) return null;

  const computeDiff = (values: any): UpdateTaskForm => {
    const updates: UpdateTaskForm = {};
    const compare = (key: keyof UpdateTaskForm, normalize: (v: any) => any = (v) => v) => {
      const oldVal = normalize((task as any)[key]);
      const newVal = normalize(values[key as string]);
      if (newVal !== oldVal) {
        (updates as any)[key] = newVal;
      }
    };

    compare('title', (v) => v ?? '');
    compare('description', (v) => v ?? '');
    compare('priority');
    compare('project_id', (v) => v || null);
    compare('estimated_duration', (v) => (v === '' || v === undefined ? null : Number(v)));
    compare('due_date', (v) => (v ? v : null));

    // Tags array compare (simple string join for equality)
    const oldTags = (task.tags || []).join('|');
    const newTags = (values.tags || []).join('|');
    if (oldTags !== newTags) updates.tags = values.tags || [];

    return updates;
  };

  const onSubmit = (values: any) => {
    const updates = computeDiff(values);
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }
    updateTask(task.id, updates);
    onClose();
  };

  const titlePreview = task.title.length > 36 ? task.title.slice(0, 36) + '…' : task.title;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Edit Task — {titlePreview}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">Title *</label>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <Input id="title" {...field} className={errors.title ? 'border-red-500' : ''} />
                  )}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message as any}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
                    <Flag className="w-4 h-4 inline mr-1" /> Priority
                  </label>
                  <select
                    id="priority"
                    {...register('priority')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                    style={{ color: 'inherit', background: 'inherit' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="estimated_duration" className="block text-sm font-medium text-foreground mb-2">
                    <Clock className="w-4 h-4 inline mr-1" /> Duration (min)
                  </label>
                  <Controller
                    control={control}
                    name="estimated_duration"
                    render={({ field }) => (
                      <select
                        id="estimated_duration"
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                        style={{ color: 'inherit', background: 'inherit' }}
                      >
                        <option value="">Select duration</option>
                        {[5,10,15,20,30,45,60,90,120].map((m)=>(
                          <option key={m} value={m}>{m} min</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-foreground mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" /> Due Date
                </label>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => (
                    <DatePicker
                      id="due_date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                      popperClassName="custom-datepicker"
                      calendarClassName="custom-datepicker-calendar"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      popperModifiers={[{ name: 'offset', options: { offset: [0,8] } }, { name: 'preventOverflow', options: { boundary: 'viewport' } }]}
                      selected={field.value ? new Date(field.value) : null}
                      onChange={(date) => field.onChange(date ? (date as Date).toISOString() : undefined)}
                      showTimeSelect
                      timeIntervals={30}
                      timeCaption="Time"
                      dateFormat="dd-MM-yyyy h:mm aa"
                      placeholderText="Select due date"
                      autoComplete="off"
                    />
                  )}
                />
                <div className="mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => reset({ ...watch(), due_date: undefined })}>Clear due date</Button>
                </div>
              </div>

              {projects.length > 0 && (
                <div>
                  <label htmlFor="project_id" className="block text-sm font-medium text-foreground mb-2">Project</label>
                  <select
                    id="project_id"
                    {...register('project_id')}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">No Project</option>
                    {projects.map((p:any)=> (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Tag className="w-4 h-4 inline mr-1" /> Tags (comma separated)
                </label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={(field.value || []).join(', ')}
                      onChange={(e) => field.onChange(
                        e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                      )}
                      placeholder="e.g. work, study"
                    />
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>Save Changes</Button>
              </div>
            </form>

            {/* Scoped datepicker styles (same visual language as create modal) */}
            <style>{`
              .custom-datepicker.react-datepicker-popper { z-index: 60; }
              .custom-datepicker .react-datepicker { background: hsl(var(--card)); color: hsl(var(--foreground)); border: 1px solid hsl(var(--border)); border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.35); overflow: hidden; }
              .custom-datepicker .react-datepicker__header { background: hsl(var(--muted)); border-bottom: 1px solid hsl(var(--border)); padding-top: 10px; padding-bottom: 8px; }
              .custom-datepicker .react-datepicker__current-month, .custom-datepicker .react-datepicker-time__header, .custom-datepicker .react-datepicker-year-header { color: hsl(var(--foreground)); font-weight: 600; letter-spacing: .2px; }
              .custom-datepicker .react-datepicker__navigation-icon::before { border-color: hsl(var(--muted-foreground)); }
              .custom-datepicker .react-datepicker__month-container { padding: 6px 8px 10px 8px; }
              .custom-datepicker .react-datepicker__day-name { color: hsl(var(--muted-foreground)); font-weight: 500; width: 2.25rem; line-height: 2rem; }
              .custom-datepicker .react-datepicker__week { display: flex; justify-content: space-between; }
              .custom-datepicker .react-datepicker__day { width: 2.25rem; height: 2rem; line-height: 2rem; border-radius: 8px; color: hsl(var(--foreground)); font-weight: 500; }
              .custom-datepicker .react-datepicker__day:hover { background: hsl(var(--primary) / 0.12); color: hsl(var(--primary)); }
              .custom-datepicker .react-datepicker__day--outside-month { color: hsl(var(--muted-foreground)); }
              .custom-datepicker .react-datepicker__day--today { outline: 1px dashed hsl(var(--muted-foreground)); outline-offset: -2px; }
              .custom-datepicker .react-datepicker__day--selected, .custom-datepicker .react-datepicker__day--keyboard-selected { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
              .custom-datepicker .react-datepicker__time-container { border-left: 1px solid hsl(var(--border)); background: hsl(var(--card)); }
              .custom-datepicker .react-datepicker__time-container .react-datepicker__time { background: hsl(var(--card)); }
              .custom-datepicker .react-datepicker__time-list { padding-right: 4px; }
              .custom-datepicker .react-datepicker__time-list-item { color: hsl(var(--foreground)); border-radius: 8px; margin: 2px 6px; padding: 6px 8px; }
              .custom-datepicker .react-datepicker__time-list-item:hover { background: hsl(var(--primary) / 0.12); color: hsl(var(--primary)); }
              .custom-datepicker .react-datepicker__time-list-item--selected { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
              .custom-datepicker .react-datepicker__triangle { display: none; }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


