# Implementation Plan: To-Do List Dashboard

## Overview

Implement the entire To-Do List Dashboard as a single `index.html` file containing embedded CSS and JavaScript. The build follows the unidirectional data flow pattern defined in the design: every user action mutates `state`, writes to Local Storage, then re-renders only the affected UI section. No frameworks, no build step, no external dependencies.

## Tasks

- [ ] 1. Scaffold the HTML shell and embedded CSS
  - [ ] 1.1 Create `index.html` with document boilerplate
    - Write the `<!DOCTYPE html>` declaration, `<html lang="en">`, `<head>` with `charset`, `viewport`, and `<title>To-Do List Dashboard</title>`
    - Add the four top-level body sections as empty containers: `#input-section`, `#filter-controls`, `#task-list` + `#empty-state`, and `#stats-panel`, using the exact markup from the design (IDs, classes, ARIA attributes, `data-filter` values, `role="alert"`, `aria-live`)
    - Add an empty `<style>` block in `<head>` and an empty `<script>` block at the end of `<body>`
    - _Requirements: 2.1, 8.2, 8.3, 10.1_

  - [ ] 1.2 Write all CSS — reset, layout, components, and responsive breakpoint
    - CSS custom properties for color palette, spacing, and font sizes (minimum 14 px body text)
    - Single-column layout: input section on top, filter controls, task list, stats panel below — no horizontal scroll from 320 px to 1280 px
    - Style the Input Section: text input, Add button, validation message (`hidden` attribute toggle)
    - Style the Filter Controls: three buttons, `.active` class for selected state with visually distinct style
    - Style the Task List: `<ul>` reset, `.task-item` row with checkbox, task text, delete button; `.completed` class applies `text-decoration: line-through` to `.task-text`
    - Style the Statistics Panel: three stat boxes with `.stat-value` and `.stat-label`
    - Visible `:focus-visible` focus ring on all interactive elements
    - Responsive rule (`@media (max-width: 480px)`) for narrow viewports
    - _Requirements: 2.4, 3.3, 5.5, 8.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 2. Implement the JavaScript state, storage, and CRUD core
  - [ ] 2.1 Define constants, state object, and `generateId`
    - `const STORAGE_KEY = "todo-dashboard-tasks"`
    - `const MAX_TASKS = 500` and `const MAX_CHARS = 500`
    - `const state = { tasks: [], filter: "all" }`
    - `generateId()`: use `crypto.randomUUID()` when available, fall back to `"id-" + Date.now() + "-" + Math.random().toString(36).slice(2)`
    - _Requirements: 7.7, 8.2_

  - [ ] 2.2 Implement `saveToStorage` and `loadFromStorage`
    - `saveToStorage()`: `localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks))`
    - `loadFromStorage()`: reads the key, returns `[]` if `null`; wraps `JSON.parse` in try/catch — if parse fails or result is not an array, overwrites with `"[]"` and returns `[]`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 2.3 Implement `addTask(description)`
    - Trim the description; if blank, call `showValidation("Task text is required.")` and return
    - If `state.tasks.length >= MAX_TASKS`, call `showValidation("Task limit of 500 reached.")` and return
    - Push `{ id: generateId(), description, status: "active", createdAt: Date.now() }` onto `state.tasks`
    - Call `saveToStorage()`, `clearInput()`, `focusInput()`, `renderTaskList()`, `renderStats()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.4_

  - [ ] 2.4 Implement `toggleTask(id)` and `deleteTask(id)`
    - `toggleTask(id)`: find the task in `state.tasks` by id; flip `status` between `"active"` and `"completed"`; call `saveToStorage()`, `renderTaskList()`, `renderStats()`
    - `deleteTask(id)`: reassign `state.tasks` to a filtered array excluding the matching id; call `saveToStorage()`, `renderTaskList()`, `renderStats()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [ ] 3. Implement filtering and statistics logic
  - [ ] 3.1 Implement `getVisibleTasks()` and `getStats()`
    - `getVisibleTasks()`: return `state.tasks` unmodified for `"all"`, filter by `status === "active"` for `"active"`, filter by `status === "completed"` for `"completed"` — never mutate `state.tasks`
    - `getStats()`: derive `total`, `active`, `completed` from `state.tasks`; always satisfy `total === active + completed`
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

- [ ] 4. Implement DOM rendering functions
  - [ ] 4.1 Implement `renderTaskList()`
    - Call `getVisibleTasks()` to get the tasks to show
    - If the list is empty, hide `#task-list` and show `#empty-state` with an appropriate message (e.g., "No tasks here yet." or "No tasks match the current filter.")
    - Otherwise show `#task-list` and hide `#empty-state`
    - Build each `<li class="task-item [completed]" data-id="...">` with a checkbox (checked when completed, `aria-label` including task description), a `<span class="task-text">`, and a delete `<button>` with `aria-label`
    - Assign `innerHTML` once per render (full list rebuild) — do not read state back from the DOM
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4, 5.2, 5.3, 5.4, 5.7_

  - [ ] 4.2 Implement `renderStats()`
    - Call `getStats()` and update `#stat-total`, `#stat-active`, `#stat-completed` text content
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 4.3 Implement input helper functions: `showValidation`, `clearValidation`, `clearInput`, `focusInput`
    - `showValidation(msg)`: set `#validation-msg` text content to `msg` and remove the `hidden` attribute
    - `clearValidation()`: set `#validation-msg` text content to `""` and add the `hidden` attribute
    - `clearInput()`: set `#task-input` value to `""`
    - `focusInput()`: call `.focus()` on `#task-input`
    - _Requirements: 1.4, 1.5, 9.4_

- [ ] 5. Implement event handlers and initialisation
  - [ ] 5.1 Wire Add button and Enter-key handler
    - Add `click` listener on `#add-btn` → calls `addTask(input.value)`
    - Add `keydown` listener on `#task-input` → if `event.key === "Enter"` calls `addTask(input.value)`
    - Add `focus` listener on `#task-input` → calls `clearValidation()`
    - _Requirements: 1.2, 1.5, 1.6_

  - [ ] 5.2 Wire task list event delegation (toggle and delete)
    - Add a single `click` listener on `#task-list` using event delegation
    - If `event.target` matches `.complete-toggle`: extract `data-id` from the parent `<li>`, call `toggleTask(id)`
    - If `event.target` matches `.delete-btn`: extract `data-id` from the parent `<li>`, call `deleteTask(id)`
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 5.3 Wire filter button click handler
    - Add a `click` listener on `#filter-controls` using event delegation
    - If `event.target` matches `.filter-btn`: read `data-filter`, set `state.filter`, update `aria-pressed` and `.active` class on all filter buttons, call `renderTaskList()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 5.4 Write the `init` function and call it on `DOMContentLoaded`
    - `init()`: call `loadFromStorage()` and assign the result to `state.tasks`; call `renderTaskList()`; call `renderStats()`; call `focusInput()`
    - Ensure the "All" filter button has `.active` class and `aria-pressed="true"` in the static HTML (default state requires no JS for initial filter render)
    - Register `document.addEventListener("DOMContentLoaded", init)`
    - _Requirements: 5.6, 7.4, 7.5, 7.6_

- [ ] 6. Checkpoint — manual verification pass
  - Open `index.html` via a `file://` URL in Chrome, Firefox, Edge, and Safari
  - Work through the full Manual Verification Checklist in `design.md` (functional checks, persistence checks, correctness property spot-checks, visual and accessibility checks)
  - Fix any issues found before considering the feature complete
  - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_

## Notes

- All tasks target a single file: `index.html` in the project root
- Tasks 1–5 are sequential because each layer depends on the previous (HTML shell → CSS → JS state → JS render → JS events → init)
- Task 6 (manual checklist) is the verification gate; it cannot be parallelised with implementation tasks
- The design has a Correctness Properties section, but explicitly documents that there is no testing library and all properties are verified manually via the browser checklist — automated test sub-tasks are therefore omitted
- Tasks 1.1 and 1.2 write to the same file; they must remain sequential (wave 0 → wave 1)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "3.1"] },
    { "id": 5, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 6, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 7, "tasks": ["5.4"] }
  ]
}
```
