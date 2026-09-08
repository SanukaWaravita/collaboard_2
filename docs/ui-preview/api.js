// Synthetic data for the standalone review only. Never imported by the real app.
import { PROJECT_PERMISSIONS, WORKSPACE_PERMISSIONS } from "../../client/src/constants/access.js";
const user = { id: "u1", name: "Alex Morgan", email: "alex@example.test" };
let loggedIn = true;
export const getToken = () => loggedIn ? "offline-preview" : null;
export const getCurrentUser = () => loggedIn ? user : null;
export const saveSession = () => { loggedIn = true; };
export const clearSession = () => { loggedIn = false; };
const statuses = [
  { id: "todo", name: "To do", color: "#778499", position: 0, isCompleted: false },
  { id: "doing", name: "In progress", color: "#0866d9", position: 1, isCompleted: false },
  { id: "done", name: "Done", color: "#26804d", position: 2, isCompleted: true },
];
const workspaces = [
  { id: "w1", name: "Product team", slug: "product-team", currentUserRole: "OWNER", projectCount: 2, memberCount: 3, permissions: Object.values(WORKSPACE_PERMISSIONS) },
  { id: "w2", name: "Design studio", slug: "design-studio", currentUserRole: "MEMBER", projectCount: 1, memberCount: 3, permissions: ["READ_WORKSPACE"] },
];
const projects = [
  { id: "p1", workspaceId: "w1", name: "CollaBoard", projectKey: "CLB", description: "A shared space for planning, building, and shipping our next release.", visibility: "open", currentUserRole: "OWNER", isMember: true, taskCount: 5, workflowStatuses: statuses, permissions: Object.values(PROJECT_PERMISSIONS) },
  { id: "p2", workspaceId: "w1", name: "Team onboarding", projectKey: "TEAM", description: "Help every teammate get from their first clone to their first contribution.", visibility: "private", currentUserRole: "OWNER", isMember: true, taskCount: 0, workflowStatuses: statuses, permissions: Object.values(PROJECT_PERMISSIONS) },
  { id: "p3", workspaceId: "w2", name: "Interface exploration", projectKey: "UI", description: "Explore layouts and review the small details together.", visibility: "open", currentUserRole: "REVIEWER", isMember: true, taskCount: 0, workflowStatuses: statuses, permissions: ["READ_PROJECT"] },
];
const members = [
  { userId: "u1", name: "Alex Morgan", email: "alex@example.test", projectRole: "OWNER", workspaceRole: "OWNER", memberType: "INTERNAL", canBeAssigned: true },
  { userId: "u2", name: "Sam Rivera", email: "sam@example.test", projectRole: "CONTRIBUTOR", workspaceRole: "MEMBER", memberType: "INTERNAL", canBeAssigned: true },
  { userId: "u3", name: "Taylor Chen", email: "taylor@example.test", projectRole: "REVIEWER", workspaceRole: "MEMBER", memberType: "INTERNAL", canBeAssigned: false },
];
const date = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
let tasks = [
  { id: "t1", title: "Refine the workspace experience", description: "Make projects easier to find and the next action clear.", status: "todo", dueDate: date(2), assigneeIds: ["u1"] },
  { id: "t2", title: "Review mobile layouts", description: "Check long names, touch targets, and the task list on a small screen.", status: "todo", dueDate: null, assigneeIds: [] },
  { id: "t3", title: "Polish task creation", description: "Keep the important fields first and make saving easy to reach.", status: "doing", dueDate: date(0), assigneeIds: ["u1", "u2"] },
  { id: "t4", title: "Verify project permissions", description: "Check owner, contributor, reviewer, and guest experiences.", status: "doing", dueDate: date(-1), assigneeIds: ["u2"] },
  { id: "t5", title: "Set up automated tests", description: "Cover authentication and the key task flows.", status: "done", dueDate: date(-2), assigneeIds: ["u1"] },
].map(t => ({ ...t, projectId: "p1", version: 1, reporterId: "u1", reporter: user, canAssignReporter: true }));
const invitation = { id: "i1", project: projects[1], workspace: workspaces[0], role: "CONTRIBUTOR", memberType: "INTERNAL", status: "PENDING", email: "teammate@example.test", invitedBy: members[1] };
const clone = (data) => JSON.parse(JSON.stringify(data));
export async function apiRequest(path, { method = "GET", body = {} } = {}) {
  const parts = path.split("/").filter(Boolean);
  const workspace = workspaces.find(w => w.id === parts[1]) ?? workspaces[0];
  const project = projects.find(p => p.id === parts[1]) ?? projects[0];
  if (path.startsWith("/auth/")) return { user, token: "offline-preview" };
  if (method === "GET") {
    if (path === "/workspaces") return clone({ workspaces });
    if (path === "/invitations") return clone({ invitations: [invitation] });
    if (parts[0] === "workspaces" && parts[2] === "projects") return clone({ projects: projects.filter(p => p.workspaceId === workspace.id) });
    if (parts[0] === "workspaces" && parts[2] === "members") return clone({ workspace, projects: projects.filter(p => p.workspaceId === workspace.id), currentUserId: "u1", pendingInvitations: [], members: members.map(m => ({ ...m, projectAccess: [], accessSummary: { accessibleProjectCount: 2, totalProjects: 2, explicitProjectCount: 2, inheritedProjectCount: 0 }, canChangeWorkspaceRole: false, canRemoveFromWorkspace: false })) });
    if (parts[0] === "workspaces") return clone({ workspace });
    if (parts[0] === "projects" && parts[2] === "members") return clone({ members, canManageMembers: project.permissions.includes("MANAGE_MEMBERS") });
    if (parts[0] === "projects" && parts[2] === "invitations") return clone({ invitations: [] });
    if (parts[0] === "projects") return clone({ project, tasks: tasks.filter(t => t.projectId === project.id) });
  }
  if (parts[0] === "tasks" && method === "PATCH") {
    tasks = tasks.map(t => t.id === parts[1] ? { ...t, ...body, reporter: members.find(m => m.userId === (body.reporterId ?? t.reporterId)) ?? user, version: t.version + 1 } : t);
    return clone({ task: tasks.find(t => t.id === parts[1]) });
  }
  if (parts[0] === "tasks" && method === "DELETE") { tasks = tasks.filter(t => t.id !== parts[1]); return null; }
  if (parts[0] === "projects" && parts[2] === "tasks" && method === "POST") {
    const task = { ...body, id: `t${Date.now()}`, projectId: project.id, version: 1, reporter: user, canAssignReporter: true }; tasks.push(task); return clone({ task });
  }
  throw new Error("This action is not connected in the design preview. Use the full application to manage workspaces, members, invitations, and workflow settings.");
}
