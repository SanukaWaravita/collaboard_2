# Theme support

Collaboard supports light and dark appearance modes throughout authenticated and public pages.

## Behaviour

- On a first visit, the interface follows the operating-system colour-scheme preference.
- Choosing the theme control saves an explicit preference in `localStorage` under `collaboard-theme`.
- A saved preference takes precedence over subsequent operating-system changes.
- Theme changes are synchronized between open Collaboard tabs through the browser `storage` event.
- A small pre-render script applies the saved theme before React starts, avoiding a flash of the wrong theme.

## Accessibility

- The control exposes its next action through `aria-label` and `title` and its current state through `aria-pressed`.
- Both themes retain visible keyboard focus states and semantic success, warning, danger, and status colours.
- Reduced-motion and reduced-transparency preferences are respected.
- Native form controls receive the matching `color-scheme` so browser-rendered controls remain legible.

## Manual verification

1. Open a public page and switch between light and dark mode.
2. Sign in and confirm the same preference appears in the navigation.
3. Reload the page and confirm the selected theme remains active.
4. Open Collaboard in a second tab, change the theme in the first tab, and confirm the second tab updates.
5. Clear the `collaboard-theme` storage key and confirm the operating-system preference is followed.
6. Check authentication, workspace cards and lists, project boards and lists, task forms, workflow management, and access management in both themes.
