# Applying the CollaBoard UI update

The updated source archive contains the full project source, the audit in `docs/ui-audit.md`, and the portable patch in `docs/CollaBoard-UI.patch`. Dependencies, generated builds, Git history and environment files are not included. Retain your existing `.env` files and deployment settings.

## Recommended: apply the patch to your existing repository

Extract the downloaded archive to a separate temporary folder. **Do not replace your working repository with the extracted folder.** Copy or refer to `docs/CollaBoard-UI.patch` from that extraction.

Start inside your current `collaboard_2` repository. First inspect your working tree and commit any work you want to retain:

```bash
git status --short
git switch -c feature/ui-ux-refresh
```

Replace `/path/to/CollaBoard-UI.patch` with the actual path to the extracted patch:

```bash
git apply --check /path/to/CollaBoard-UI.patch
git apply /path/to/CollaBoard-UI.patch
```

If the check reports conflicts, do not force it. The patch was generated against the uploaded September 8 source. Compare any newer local changes with the updated source and merge them deliberately.

Verify the frontend:

```bash
cd client
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Run the backend using your usual setup and development database. All real-app API configuration remains unchanged. The application still needs its backend for authentication and data.

Review before committing:

```bash
cd ..
git diff --stat
git diff
```

The patch adds frontend source files, tests, and `docs/ui-preview/api.js`, which is used by the new route-render test. Keep that fixture with the tests. No npm dependency changes are required.

Suggested commit message:

```text
feat(ui): refresh CollaBoard layouts and improve keyboard and mobile UX
```

Suggested PR title for the feature branch into `develop`:

```text
Refresh CollaBoard UI and improve navigation, dialogs, and mobile lists
```

## Standalone preview

Open `CollaBoard-UI-Preview.html` in a modern browser. It embeds the client code and styles, uses fictional people/tasks, and makes no live API requests. The screen selector lets you visit all eight main screens. Task creation, editing, moving and deleting operate only on the temporary in-memory fixture; reloading resets it. Workspace/member/invitation/workflow mutations display a preview-only explanation instead of changing a real account.

The full production application has no preview toolbar or sample-data substitution. Authentication forms in the standalone preview are simulated; do not use real credentials there.

To rebuild this optional preview after editing the client:

```bash
node docs/ui-preview/build.mjs /absolute/path/CollaBoard-UI-Preview.html
```

## Before merging

The build, lint and 20 frontend tests pass. Real browser visual QA was unavailable in the authoring environment. Check your desktop browser, a narrow/mobile viewport, long content, all four modal forms, permissions, and interactions against your backend before merging. Do not treat the sample preview as evidence that your deployed integration has been tested.
