import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { X, Calendar, Flag, Tag, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateTaskForm } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useSettings } from '@/contexts/SettingsContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Switch } from '@/components/ui/Switch';
import { requestNotificationPermission, scheduleReminder } from '@/lib/notifications';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDueDate?: Date;
}

export default function CreateTaskModal({ isOpen, onClose, defaultDueDate }: CreateTaskModalProps) {
  const { createTask, isCreating } = useTasks();
  const { projects } = useProjects();
  const { settings } = useSettings();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [scheduleDueReminder, setScheduleDueReminder] = useState<boolean>(!!settings.reminderMinutesBefore);
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>(settings.reminderMinutesBefore ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<CreateTaskForm>({
    defaultValues: {
      title: '',
      description: '',
      priority: settings.defaultPriority,
      project_id: '',
      due_date: (() => {
        if (defaultDueDate) return defaultDueDate.toISOString();
        if (settings.defaultDueDateOffsetDays || settings.defaultDueDateOffsetDays === 0) {
          const d = new Date();
          d.setDate(d.getDate() + (settings.defaultDueDateOffsetDays ?? 0));
          return d.toISOString();
        }
        return undefined;
      })(),
      estimated_duration: settings.defaultEstimatedDuration ?? undefined,
      tags: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset((prev) => ({
        ...prev,
        due_date: defaultDueDate ? defaultDueDate.toISOString() : undefined,
      }));
    }
  }, [isOpen, defaultDueDate, reset]);

  const onSubmit = async (data: CreateTaskForm) => {
    createTask({
      ...data,
      tags,
      project_id: data.project_id ? data.project_id : (null as any),
      due_date: data.due_date ? data.due_date : (null as any),
      estimated_duration: data.estimated_duration ? Number(data.estimated_duration) : undefined,
    });
    if (scheduleDueReminder && data.due_date && reminderMinutes !== '' && settings.desktopNotifications) {
      const permitted = await requestNotificationPermission();
      if (permitted) {
        const when = new Date(data.due_date).getTime() - Number(reminderMinutes) * 60 * 1000;
        if (when > Date.now()) {
          scheduleReminder({
            id: crypto.randomUUID(),
            title: `Task due soon: ${data.title}`,
            message: `Due at ${new Date(data.due_date).toLocaleString()}`,
            when,
          });
        }
      }
    }
    reset();
    setTags([]);
    setTagInput('');
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

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
              <h2 className="text-xl font-semibold text-foreground">Create New Task</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 relative">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Task Title *
                </label>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <Input
                      id="title"
                      {...field}
                      placeholder="Enter task title..."
                      autoComplete="off"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter task description..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
                    <Flag className="w-4 h-4 inline mr-1" />
                    Priority
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
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duration (min)
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
                        {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((min) => (
                          <option key={min} value={min}>{min} min</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-foreground mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date
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
                      popperPlacement="bottom"
                      selected={field.value ? new Date(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      showTimeSelect
                      dateFormat="dd-MM-yyyy h:mm aa"
                      placeholderText="Select due date"
                      autoComplete="off"
                    />
                  )}
                />
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> Reminder</p>
                    <p className="text-xs text-muted-foreground">Schedule a notification before due time</p>
                  </div>
                  <Switch checked={scheduleDueReminder} onCheckedChange={setScheduleDueReminder} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Minutes before due</label>
                    <Input
                      type="number"
                      min={0}
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={!scheduleDueReminder}
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>
              </div>

              {projects.length > 0 && (
                <div>
                  <label htmlFor="project_id" className="block text-sm font-medium text-foreground mb-2">
                    Project
                  </label>
                  <select
                    id="project_id"
                    {...register('project_id')}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">No Project</option>
                    {projects.map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
            {/* Scoped dark theme overrides for react-datepicker */}
            <style>{`
              /* Root popper wrapper */
              .custom-datepicker {
                z-index: 60; /* above modal content */
              }

              .custom-datepicker .react-datepicker {
                background-color: #0b1220; /* dark surface */
                border: 1px solid #273244; /* border */
                color: #e5e7eb; /* foreground */
                box-shadow: 0 10px 30px rgba(0,0,0,0.45);
              }

              .custom-datepicker .react-datepicker__header {
                background-color: #0f172a;
                border-bottom: 1px solid #273244;
              }

              .custom-datepicker .react-datepicker__current-month,
              .custom-datepicker .react-datepicker-time__header,
              .custom-datepicker .react-datepicker-year-header {
                color: #e5e7eb;
              }

              /* Navigation arrows */
              .custom-datepicker .react-datepicker__navigation-icon::before {
                border-color: #94a3b8; /* slate-400 */
              }

              /* Day names */
              .custom-datepicker .react-datepicker__day-name {
                color: #94a3b8;
              }

              /* Days */
              .custom-datepicker .react-datepicker__day,
              .custom-datepicker .react-datepicker__time-list-item {
                color: #e5e7eb;
              }

              .custom-datepicker .react-datepicker__day:hover,
              .custom-datepicker .react-datepicker__time-list-item:hover {
                background-color: #1e293b; /* hover */
              }

              .custom-datepicker .react-datepicker__day--today {
                background: transparent;
                outline: 1px dashed #64748b;
              }

              .custom-datepicker .react-datepicker__day--selected,
              .custom-datepicker .react-datepicker__day--keyboard-selected,
              .custom-datepicker .react-datepicker__time-list-item--selected {
                background-color: #3b82f6; /* primary */
                color: #0b1220;
              }

              .custom-datepicker .react-datepicker__day--outside-month {
                color: #64748b; /* muted */
              }

              /* Time select column */
              .custom-datepicker .react-datepicker__time-container {
                border-left: 1px solid #273244;
              }

              .custom-datepicker .react-datepicker__time-list {
                background-color: #0b1220;
                scrollbar-width: thin;
              }

              /* Input popper triangle */
              .custom-datepicker .react-datepicker__triangle::before,
              .custom-datepicker .react-datepicker__triangle::after {
                border-bottom-color: #0b1220 !important;
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}