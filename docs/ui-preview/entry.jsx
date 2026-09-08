import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import App from "../../client/src/App.jsx";
import "../../client/src/index.css";
import { saveSession } from "./api.js";
const screens = [
  ["/workspaces/w1/projects/p1", "Task board"],
  ["/workspaces", "Workspaces"],
  ["/workspaces/w1/projects", "Projects"],
  ["/workspaces/w1/members", "Workspace members"],
  ["/workspaces/w1/projects/p1/access", "Project access"],
  ["/invitations", "Invitations"],
  ["/login", "Sign in"],
  ["/register", "Register"],
];
function Preview() {
  const navigate = useNavigate();
  const location = useLocation();
  return <>
    <div className="preview-toolbar">
      <strong>CollaBoard · UI review</strong>
      <span>Sample data · no live connection · reload to reset</span>
      <label>Screen <select value={screens.some(([path]) => path === location.pathname) ? location.pathname : ""} onChange={event => { saveSession(); navigate(event.target.value); }}>
        <option value="" disabled>Current screen</option>
        {screens.map(([path, name]) => <option key={path} value={path}>{name}</option>)}
      </select></label>
    </div>
    <App />
  </>;
}
createRoot(document.getElementById("root")).render(<MemoryRouter initialEntries={[screens[0][0]]}><Preview /></MemoryRouter>);
