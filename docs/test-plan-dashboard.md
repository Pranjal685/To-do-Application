## Dashboard Page QA Test Plan

This checklist guides a thorough manual QA pass of the `Dashboard` page, covering functional flows, edge cases, performance, accessibility, and responsiveness.

### Pre-requisites
- Backend running at `http://localhost:4000` with DB migrated.
- Frontend running via `pnpm dev` on `http://localhost:3000`.
- A test user signed in from the app (or use the provided seed script).

### Data Setup (recommended)
- Projects: 2 projects (A, B).
- Tasks (30–50 for perf tests), including:
  - Status: `todo`, `in_progress`, `review`, `done`.
  - Priority: `low`, `medium`, `high`, `urgent`.
  - Due dates: none, today, yesterday, tomorrow.
  - Created at: a mix of older/newer.
  - Tags: 0, 1–3, and >3.
  - Title/description: include very long variants.
  - Estimated duration: 0, small (5), large (1440).

You can seed with `scripts/seed_dashboard.ps1` or use the HTTP snippets in `docs/seed-dashboard.http`.

---

### Areas to Validate

1) Header and Empty State
- With 0 tasks: header shows “Welcome to AI Todo! 👋” and an empty-state card with a button that opens the create task modal.
- With >0 tasks: header shows “Good to see you back! 👋” and indicates active task count.

2) Loading State
- Simulate slow network: spinner shows until both tasks and projects finish loading. No partial render.

3) Stats Tiles
- Tiles: Tasks Completed, Active Tasks, Projects, Due Today.
- Checks:
  - Completed equals number of tasks with `status === 'done'`.
  - Active equals tasks with `status !== 'done'`.
  - Projects equals project count from backend.
  - Due Today counts tasks where local date matches today; tasks without `due_date` are excluded.
  - Edge: tasks=0 → completion rate shows 0%; all completed → 100%.
  - Timezone: verify due dates near midnight respect local date matching.

4) Visible Tasks List
- `settings.taskView.showCompleted = true`: includes done tasks.
- `settings.taskView.showCompleted = false`: excludes done tasks.
- Sorting:
  - `sortBy = due_date`: earlier dates first; tasks without due date appear last.
  - `sortBy = priority`: order urgent → high → medium → low.
  - `sortBy = created_at`: older first (validate intended UX).
- Scroll container (`max-h-[60vh]`) shows all tasks; when empty, a friendly message appears.

5) Task Card Rendering
- Title wraps/clamps to 2 lines; long text truncates without layout break.
- Description displays only when present.
- Tags:
  - 0 → hidden section.
  - 1–3 → all visible.
  - >3 → first 3 + “+N”.
- Status chip reflects correct colors and labels.
- Due date and duration rendered only when present; formatting correct.
- Priority badge matches priority color.

6) Task Interactions
- Edit: hover shows edit icon → modal opens populated. Cancel closes; save updates cache and shows success toast.
- Delete: hover shows delete icon → confirm dialog; cancel does nothing; confirm removes card and updates stats.
- Status change: move a task to/from done; `completed_at` updated; visibility reflects `showCompleted`; stats update instantly.

7) Create Task Modal (via “Add Task”)
- Validation: title required; error shows and blocks submit.
- Defaults: priority and other defaults reflect `Settings`.
- Due date picker: date/time selection works; format and storage correct.
- Estimated duration formatting: `5m`, `1h`, `1h 30m`, `0m`, `24h`.
- Project selection: shows existing projects; “No Project” works.
- Tags: add via button and Enter; duplicates prevented; remove tag works.
- Reminders: toggle disabled unless desktop notifications enabled; permission prompt does not crash; future-due reminder scheduled without errors.
- After submit: success toast, modal closes, list updates and stats refresh.

8) Settings Integration
- Toggle `taskView.showCompleted`: visible list updates; stats remain based on all tasks.
- Change `taskView.sortBy`: list order updates instantly.
- Change defaults (priority/due offset): new create modal defaults reflect changes.

9) Error/Network Robustness
- Simulate 500 on tasks/projects: toast and stable UI.
- Missing/expired token: lists empty (queries disabled); UI remains stable.
- Partial failure (tasks ok, projects fail): loader logic doesn’t hang indefinitely.
- Backend duplicates same ID: list deduplicates; counts and rendering correct.

10) Performance and Stability
- With ~100 tasks: smooth scroll; no jank; animations don’t cause layout shift.
- Rapid create/update/delete: no duplicates or stale flash post-invalidation.
- Repeatedly open/close modals: no visual leaks or console errors.

11) Accessibility
- Keyboard: Tab reaches “Add Task”; Enter/Space activate; Focus trapping in modal; Esc and overlay click close.
- Screen reader: meaningful button labels; icons with accessible names where needed.
- Contrast: readable in light/dark themes.
- Reduced motion (if supported): animations respect preferences.

12) Responsiveness
- Mobile: 1-column layout; stats stack; tap targets comfortable.
- Tablet: 2-column stats; content readable.
- Desktop: 4-column stats; 2+1 main layout.
- Long words/tags don’t overflow or break layout.

13) Visual Consistency
- Colors align with design tokens in both themes.
- Unique keys on task list prevent animation glitches.

---

### Quick Edge Case Matrix
- Invalid/malformed date strings → sorting/filtering does not crash.
- `estimated_duration = 0` and very large (1440) → formatted correctly.
- Missing or malformed `created_at` → no runtime error during sorting.
- Mixed ID types from backend (string/number) → deduping works.
- Projects = 0 while tasks exist → Projects tile shows 0; create modal still offers “No Project”.

---

### Suggested Automation (added in repo)
- Unit/integration tests with Vitest and Testing Library in `src/pages/__tests__/Dashboard.test.tsx` covering loading, empty, stats correctness, and sorting behavior (priority).


