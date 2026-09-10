---
title: CollaBoard UI and UX audit
date: 2026-09-08
project: collaboard_2
status: Implemented; visual review pending
source: collaboard_2-8_9_2026-22.17.zip
---

# CollaBoard — UI and UX audit

## Assessment

The main issue is inconsistent hierarchy and density. This is not a wholesale absence of modern techniques: your existing client already includes responsive rules, CSS variables, permission-aware controls, custom workflow colors, card/list views, loading/error states, reduced-motion support, and accessible labels on many actions. Those are useful foundations.

What makes the experience feel dated is the accumulation of individually styled screens: the indigo global theme, cyan authentication/entity screens, grey Kanban panels, radio-like view switches, small heavy text, and multiple nested borders. Functional details compete with the actual project or task.

This audit inspects the supplied source and its interactions. It is **not a screenshot-based assessment of your deployed app**. The environment blocked the browser preview, so visual rendering, real touch behavior, zoom, and screen-reader behavior still need manual verification. The implementation and automated checks below are complete within that limit.

## Design direction

A calm, focused productivity application: a neutral background, white content surfaces, one blue action accent, system typography, comfortable spacing, clear page titles, and limited shadows. Workflow colors remain meaningful domain data. Desktop navigation occupies a compact left rail; mobile navigation returns to the top.

The supplied `apple-design-skill.md` informed restraint, predictable controls, system typography, immediate press feedback, keyboard access, reduced motion, reduced transparency, and increased contrast. This is an application of those principles, not a pixel reproduction of an Apple product. No new gesture/animation library was added; desktop drag-and-drop remains the existing implementation, with status editing as its keyboard/touch alternative.

## Findings and changes

| Area | Source finding | Change in this update | Priority |
| --- | --- | --- | --- |
| Design consistency | Different accent colors, surface colors and button treatments across CSS modules | Shared tokens and an app-wide refinement stylesheet; workflow/due-date semantics retained | High |
| Navigation | Generic top bar, limited account context; page header and toolbar look like one dense framed control | Desktop navigation rail with signed-in identity; responsive mobile header; larger unframed page identity | Medium |
| Typography | Some recurring metadata was 0.6–0.72rem; tightly packed, heavy labels | Minimum legacy metadata size raised to 0.75rem; primary task controls and common labels increased; system font and quieter weights | High |
| Actions | Every entity card carries multiple prominent controls | Primary emphasis reserved for creation; lighter open/edit actions and quieter destructive controls | Medium |
| View switching | Small radio-like indicators, reset whenever the page remounts | Segmented controls and optional local view preferences for workspaces, projects and tasks | Medium |
| Mobile lists | Workspace/project/task tables enforce widths of approximately 820–1320px | Labelled stacked rows below 600px, retaining all columns and explicit table semantics | High |
| Kanban | Heavy grey panels, thick colored top borders, small card text | Softer columns, restrained status markers, larger task titles, more consistent spacing | Medium |
| Task editing | Editing is mainly exposed through a small icon | Editable task titles are also keyboard-accessible buttons; existing permission checks remain in effect | Medium |
| Dialog behavior | Forms declare modal semantics but lack shared focus containment, Escape dismissal and restoration | Shared portal-based modal wrapper, background inertness, scroll locking, focus loop, Escape guard during saves, and trigger-focus restoration | High |
| Forms | Status is below reporter and assignee controls; save/cancel at the bottom of long forms | Status moved before due date/people; compact description field; sticky modal action row | Medium |
| Authentication | Strong decorative gradient; no password visibility control | Calmer two-panel presentation and show/hide password controls; existing autocomplete and redirect behavior retained | Medium |
| Access screens | Dense nested panels and repeated guidance compete with controls | Shared surface/type/spacing treatment, retaining role guidance and the existing access model | Medium |
| Accessibility preferences | Reduced-motion rules existed; transparency and contrast preferences were not handled consistently | Added reduced-transparency and increased-contrast treatments, link focus styles, and a skip-to-content link | Medium |
| Browser identity | HTML document title was `client` | Branded title and short description | Low |

## Scope and architecture

The production changes are confined to the frontend and supporting documentation/tests. API routes, request payload contracts, authentication/session keys, data models, backend authorization, MongoDB logic, workflow rules and deployment configuration are preserved. Dependency manifests and lockfiles are unchanged.

`client/src/styles/refinement.css` is loaded after the existing styles as a deliberate compatibility layer. This makes the first redesign easy to inspect, transfer and revert. It does add CSS weight. A later maintenance pass can consolidate styles into their owning modules once the design is accepted; that cleanup should preserve the rendered result.

New reusable pieces:

- `components/Modal.jsx`: shared modal behavior.
- `components/Icon.jsx`: small consistent navigation icon set.
- `hooks/useViewPreference.js`: validated, failure-tolerant view preferences.
- `tests/Modal.test.jsx`: focus loop, restoration and save guard.
- `tests/ui-routes.test.jsx`: representative route-render coverage.
- `docs/ui-preview/`: isolated synthetic-data adapter and standalone preview builder.

## What remains

These are follow-up candidates, not features silently included in the update:

1. **Visual acceptance:** inspect desktop, tablet and phone layouts in your browser, including 200% zoom, long titles, many assignees, empty states, and larger custom workflows. Verify keyboard behavior and contrast with actual browser tools.
2. **Destructive interactions:** native browser confirmations remain. A later shared confirmation dialog can make deletion, access removal and ownership transfer clearer without weakening their safeguards.
3. **Task reading:** a dedicated read-only task detail view would help reviewers inspect long descriptions without opening an edit experience. Cards currently preserve the existing three-line description clamp.
4. **Finding information:** search and filters would help once workspaces and tasks grow. They should be designed around actual team usage and tested with realistic volumes.
5. **People/permissions:** workspace members and project access remain complex flows. Test the existing inherited-versus-explicit access explanations with teammates before simplifying them further.
6. **Unsaved drafts:** new-Task draft persistence was implemented on 10 September 2026 using browser `localStorage`, isolated by user and Project. Edit-form dirty-state protection remains a possible follow-up. Saving already blocks dismissal, and backdrop clicks deliberately do not dismiss.
7. **Theme and motion:** dark mode, custom spring physics, touch drag-and-drop, and optimistic network updates are not part of this change.

## Verification

| Check | Result |
| --- | --- |
| Install from the existing frontend lockfile | Passed |
| Production `npm run build` | Passed |
| `npm run lint` | Passed |
| Existing frontend tests | 10 passed |
| New modal interaction tests | 2 passed |
| New route-render tests | 8 passed |
| Combined frontend suite | 20 passed across 4 suites |
| Standalone compiled preview | Built; task board renders without JavaScript errors in a simulated DOM |
| Real browser visual, mobile/touch and screen-reader QA | Not completed: browser preview was blocked by the environment |
| Live backend / Atlas / deployed end-to-end flows | Not exercised; no live application data was changed |

The route tests use fictional API responses. They demonstrate that the screens render against representative response shapes; they do not replace backend integration or permission testing. The preview adapter never enters the production build.

## Quick review sequence

1. Open the standalone HTML preview and compare the eight screens through its screen selector.
2. Try Kanban/List, a task-title click, the task form and the workflow settings dialog.
3. Use Tab, Shift+Tab and Escape in each modal; confirm focus returns to its opener.
4. Narrow your browser and inspect the list views and mobile navigation.
5. Apply the patch to your local feature branch, run the frontend checks, then exercise the same flows against your own development backend.
6. Review the changes with your team before merging into `develop` and then promoting to `main` through your usual workflow.
