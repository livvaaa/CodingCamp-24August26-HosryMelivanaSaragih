# Design Document — To-Do List Dashboard

## Overview

The To-Do List Dashboard is a self-contained, single-page web application delivered as one HTML file. It runs entirely in the browser with no server, no build step, and no external dependencies. All task data is persisted in the browser's Local Storage API.

The guiding principle is simplicity: one file, one responsibility per JS function, one source of truth for state (an in-memory array that is always kept in sync with Local Storage). Every user interaction updates the in-memory state first, then writes to storage, then re-renders the relevant UI section.

### Goals

- Zero-dependency: pure HTML5 + CSS3 + ES6 JavaScript
- Works when opened via `file://` URL in Chrome, Firefox, Edge, and Safari
- Persists up to 500 tasks across browser sessions
- Responsive between 320 px and 1280 px viewport width
- Accessible: keyboard-navigable with visible focus indicators, minimum 14 px font

---

## Architecture

The application follows a **unidirectional data flow** pattern inside a single HTML file:

```
User Action
    │
    ▼
Event Handler (JS)
    │
    ▼
State Mutation  ──► Local Storage Write
    │
    ▼
UI Re-render
```

Three logical layers are embedded in the single file:

| Layer | Technology | Responsibility |
|---|---|---|
| Markup | HTML5 | Static shell — containers, semantic structure, ARIA roles |
| Style | CSS3 (embedded `<style>`) | Layout, visual states, responsive breakpoints, focus rings |
| Logic | ES6 JS (embedded `<script>`) | State, CRUD, storage I/O, DOM updates, event delegation |

There is **no virtual DOM**, no reactive framework, and no module bundler. DOM updates are fine-grained: only the parts of the UI that change are re-rendered.

---

## File Structure

```
todo-list-dashboard/
└── index.html          ← the entire application
```

`index.html` is structured internally as:

```
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>To-Do List Dashboard</title>
    <style>
      /* ── Reset & Custom Properties ── */
      /* ── Layout ── */
      /* ── Input Section ── */
      /* ── Filter Controls ── */
      /* ── Task List ── */
      /* ── Statistics Panel ── */
      /* ── Empty State ── */
      /* ── Responsive (≤ 480 px) ── */
    </style>
  </head>
  <body>
    <!-- Input Section -->
    <!-- Filter Controls -->
    <!-- Task List -->
    <!-- Statistics Panel -->

    <script>
      // ── Constants ──
      // ── State ──
      // ── Storage ──
      // ── Task CRUD ──
      // ── Filtering & Statistics ──
      // ── DOM Rendering ──
      // ── Event Handlers ──
      // ── Initialisation ──
    </script>
  </body>
</html>
```

---

## Components and Interfaces

### 1. Input Section

**HTML structure:**
```html
<section id="input-section" aria-label="Add new task">
  <input type="text" id="task-input" maxlength="500"
         placeholder="What needs to be done?"
         aria-label="Task description" />
  <button id="add-btn" type="button">Add</button>
  <p id="validation-msg" role="alert" aria-live="polite" hidden></p>
</section>
```

**Behaviour:**
- `maxlength="500"` enforces the character limit natively
- Pressing Enter in the input fires the same handler as clicking Add
- The validation message `<p>` uses `role="alert"` so screen readers announce it
- After a task is added the input is cleared and `.focus()` is called on it

---

### 2. Filter Controls

**HTML structure:**
```html
<nav id="filter-controls" aria-label="Filter tasks">
  <button class="filter-btn active" data-filter="all"  aria-pressed="true">All</button>
  <button class="filter-btn"        data-filter="active" aria-pressed="false">Active</button>
  <button class="filter-btn"        data-filter="completed" aria-pressed="false">Completed</button>
</nav>
```

**Behaviour:**
- Exactly three buttons, driven by a `data-filter` attribute
- The active filter button gets the class `active` and `aria-pressed="true"`
- Selecting a filter updates `state.filter`, re-renders the task list, but does **not** affect the underlying task collection

---

### 3. Task List

**HTML structure (rendered dynamically):**
```html
<ul id="task-list" aria-label="Task list" aria-live="polite">
  <!-- Task items injected here -->
</ul>
<p id="empty-state" hidden>No tasks here yet.</p>
```

Each `Task_Item`:
```html
<li class="task-item [completed]" data-id="<uuid>">
  <input type="checkbox" class="complete-toggle"
         aria-label="Mark '<description>' as complete"
         [checked] />
  <span class="task-text">Description text</span>
  <button class="delete-btn" type="button"
          aria-label="Delete '<description>'">×</button>
</li>
```

**Behaviour:**
- The list is rebuilt by `renderTaskList()` whenever state changes
- A `completed` CSS class on `<li>` drives strikethrough styling
- An empty-state `<p>` is shown (and the `<ul>` hidden) when no tasks match the current filter

---

### 4. Statistics Panel

**HTML structure:**
```html
<section id="stats-panel" aria-label="Task statistics">
  <div class="stat">
    <span class="stat-value" id="stat-total">0</span>
    <span class="stat-label">Total</span>
  </div>
  <div class="stat">
    <span class="stat-value" id="stat-active">0</span>
    <span class="stat-label">Active</span>
  </div>
  <div class="stat">
    <span class="stat-value" id="stat-completed">0</span>
    <span class="stat-label">Completed</span>
  </div>
</section>
```

**Behaviour:**
- `renderStats()` reads directly from `state.tasks` (the full unfiltered collection)
- Updated after every add, delete, and toggle operation

---

## Data Models

### Task Object

```js
{
  id:          string,   // UUID v4 — crypto.randomUUID() or fallback
  description: string,   // trimmed, 1–500 characters
  status:      "active" | "completed",
  createdAt:   number    // Date.now() — used to enforce insertion order
}
```

### Application State

```js
const state = {
  tasks:  Task[],                      // in-memory source of truth, insertion order
  filter: "all" | "active" | "completed"  // currently selected filter
};
```

### Local Storage Schema

- **Key:** `"todo-dashboard-tasks"`
- **Value:** `JSON.stringify(state.tasks)` — a JSON array of Task objects

```js
// Write
localStorage.setItem("todo-dashboard-tasks", JSON.stringify(state.tasks));

// Read
const raw = localStorage.getItem("todo-dashboard-tasks");
// raw is null  → initialise with []
// raw is valid JSON array → use it
// raw is anything else   → initialise with [], overwrite storage
```

The `filter` value is **not** persisted — the app always boots with the "All" filter active.

### UUID Generation

```js
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older file:// environments
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}
```

---

## Key Algorithms

### Task CRUD

```
addTask(description):
  1. Trim description
  2. If blank → show validation message, return
  3. If state.tasks.length >= 500 → show limit message, return
  4. Create Task object { id, description, status: "active", createdAt }
  5. Push to state.tasks
  6. saveToStorage()
  7. clearInput(), focusInput()
  8. renderTaskList(), renderStats()

toggleTask(id):
  1. Find task by id in state.tasks
  2. Flip status: "active" → "completed", "completed" → "active"
  3. saveToStorage()
  4. renderTaskList(), renderStats()

deleteTask(id):
  1. Filter state.tasks to remove task with matching id
  2. saveToStorage()
  3. renderTaskList(), renderStats()
```

### Filtering Logic

```
getVisibleTasks():
  if state.filter === "all"       → return state.tasks
  if state.filter === "active"    → return state.tasks.filter(t => t.status === "active")
  if state.filter === "completed" → return state.tasks.filter(t => t.status === "completed")
```

### Statistics Calculation

```
getStats():
  total     = state.tasks.length
  completed = state.tasks.filter(t => t.status === "completed").length
  active    = total - completed
  return { total, active, completed }
```

---

## State Management

Single source of truth pattern:

1. `state.tasks` is the **only authoritative list** of tasks
2. Every mutation (add / toggle / delete) modifies `state.tasks` first
3. `saveToStorage()` is called immediately after every mutation
4. `renderTaskList()` and `renderStats()` always derive their output from `state.tasks` — they never hold their own state
5. The filter (`state.filter`) is in-memory only; no separate filter state is stored in the DOM

This means the DOM is always a pure function of `state`:

```
DOM = render(state)
```

No data is read back from the DOM to drive logic.

---

## Error Handling

### Malformed Local Storage Data

```js
function loadFromStorage() {
  try {
    const raw = localStorage.getItem("todo-dashboard-tasks");
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed;
  } catch {
    // Overwrite corrupt data with an empty collection
    localStorage.setItem("todo-dashboard-tasks", "[]");
    return [];
  }
}
```

Requirement 7.6 is satisfied: malformed data is silently recovered, and the user starts with an empty list rather than a broken UI.

### 500-Task Limit

When `state.tasks.length >= 500`:
- `addTask()` returns early
- A visible limit-reached message is shown in the same `#validation-msg` element
- The `Add` button is not disabled (the message clears as soon as a task is deleted)

### Input Validation

- Empty / whitespace-only input → inline validation message shown, task not created
- Validation message is cleared on the next successful add or when the input field gains focus

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. The properties below are design-level correctness criteria and manual verification checklists. They are not executed by a testing library; they serve as precise behavioral specifications to guide implementation and to be spot-checked manually in the browser.*

### Property 1: Whitespace-only descriptions are always rejected

*For any* string composed entirely of whitespace characters, calling `addTask` with that string SHALL leave `state.tasks` unchanged.

**Validates: Requirements 1.5**

---

### Property 2: Valid task addition increases the task collection by exactly one

*For any* `state.tasks` array with fewer than 500 tasks and any non-whitespace-only description string, calling `addTask` SHALL result in `state.tasks` having exactly one more element than before, and the new element SHALL have the trimmed description and `status === "active"`.

**Validates: Requirements 1.2, 1.3**

---

### Property 3: Toggle is its own inverse (round-trip)

*For any* task in `state.tasks`, calling `toggleTask(id)` twice in succession SHALL leave the task's `status` identical to what it was before the first toggle.

**Validates: Requirements 3.1, 3.2**

---

### Property 4: Delete removes exactly the target task

*For any* `state.tasks` array and any valid task id present in it, calling `deleteTask(id)` SHALL result in a `state.tasks` array that contains all previous tasks except the one with the matching id.

**Validates: Requirements 4.1**

---

### Property 5: Filter does not mutate the task collection

*For any* `state.tasks` array and any filter value, calling `getVisibleTasks()` SHALL return a subset of `state.tasks` without modifying `state.tasks` itself.

**Validates: Requirements 5.2, 5.3, 5.4**

---

### Property 6: Statistics are always consistent with the task collection

*For any* `state.tasks` array, `getStats()` SHALL return values where `total === active + completed`, `total === state.tasks.length`, `active` equals the count of tasks with `status === "active"`, and `completed` equals the count of tasks with `status === "completed"`.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 7: Storage round-trip preserves the task collection

*For any* valid `state.tasks` array, serialising it with `saveToStorage()` and then deserialising it with `loadFromStorage()` SHALL produce an array that is deeply equal to the original.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

---

### Property 8: Task collection limit is enforced

*For any* `state.tasks` array that has exactly 500 tasks, calling `addTask` with any valid description SHALL leave `state.tasks` unchanged at length 500.

**Validates: Requirements 9.4**

---

## Manual Verification Checklist

This project has no test setup, no testing libraries, and no automated tests. Use this checklist to verify correctness by interacting with the application directly in a browser.

### Functional Checks

- [ ] Adding a task with valid text creates a task item at the bottom of the list with "active" status
- [ ] Adding a task with empty or whitespace-only text shows a validation message and adds nothing
- [ ] Adding a task at the 500-character limit is accepted; typing beyond 500 characters is blocked
- [ ] When 500 tasks exist, attempting to add another shows the limit message and adds nothing
- [ ] Checking the Complete_Toggle on an active task applies strikethrough styling and marks it completed
- [ ] Checking the Complete_Toggle on a completed task removes strikethrough styling and marks it active
- [ ] Toggling a task twice returns it to its original status
- [ ] Clicking the Delete button removes the task from the list permanently
- [ ] Selecting "Active" filter shows only active tasks; selecting "Completed" shows only completed tasks; selecting "All" shows every task
- [ ] Filtering does not change the underlying task data (switching back to "All" restores all tasks)
- [ ] Statistics panel always shows correct Total, Active, and Completed counts after every add, toggle, and delete
- [ ] When no tasks match the current filter, an empty-state message is shown
- [ ] On page load, the "All" filter is selected by default

### Persistence Checks

- [ ] After adding tasks and refreshing the page, all tasks are still present
- [ ] After toggling and deleting tasks, then refreshing, the changes are preserved
- [ ] Opening the app in a new tab shows the same task list
- [ ] Manually setting localStorage key `"todo-dashboard-tasks"` to invalid JSON, then refreshing, starts with an empty list

### Correctness Property Spot-Checks

Manual equivalents of the 8 design properties above:

- [ ] **Property 1**: Type only spaces in the input field and click Add — no task is added
- [ ] **Property 2**: Add a task with a normal description — task count increases by exactly 1, new task is "active"
- [ ] **Property 3**: Toggle any task twice — it returns to its original status
- [ ] **Property 4**: Delete a task — only that task is removed; all others remain unchanged
- [ ] **Property 5**: Apply any filter — the underlying task count in "All" view is unchanged after switching back
- [ ] **Property 6**: Add/toggle/delete tasks in various combinations — Total always equals Active + Completed
- [ ] **Property 7**: Add tasks, refresh the page — all tasks and their statuses are restored exactly
- [ ] **Property 8**: Add tasks until the limit message appears — confirm no task is added beyond 500

### Visual and Accessibility Checks

- [ ] All text is at least 14px and clearly legible
- [ ] Text has sufficient contrast against the background
- [ ] Layout displays correctly at narrow widths (resize browser to ~320px) with no horizontal scrolling
- [ ] Every interactive element (input, Add button, checkboxes, delete buttons, filter buttons) is reachable and operable with the Tab key
- [ ] Focused elements show a visible focus ring
