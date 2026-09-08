import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";

// Keep real routing and page interactions; replace only the API boundary.
// This is a client integration test, not a browser E2E test.
let token;
const apiRequest = jest.fn();
const saveSession = jest.fn((session) => { token = session.token; });
jest.unstable_mockModule("../src/services/api", () => ({
  getToken: () => token, apiRequest, saveSession,
}));
const { default: ProtectedRoute } = await import("../src/components/ProtectedRoute.jsx");
const { default: LoginPage } = await import("../src/pages/LoginPage.jsx");

function ProjectDestination() {
  const location = useLocation();
  return <h1>Project destination: {location.pathname}{location.search}{location.hash}</h1>;
}

function renderRoutes(entry) {
  render(<MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/workspaces" element={<h1>Workspaces destination</h1>} />
        <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectDestination />} />
      </Route>
    </Routes>
  </MemoryRouter>);
  return userEvent.setup();
}

async function signIn(user) {
  await user.type(screen.getByLabelText("Email address"), "member@example.com");
  await user.type(screen.getByLabelText("Password"), "test-password");
  await user.click(screen.getByRole("button", { name: "Sign In" }));
}

beforeEach(() => {
  token = null;
  apiRequest.mockReset();
  apiRequest.mockResolvedValue({ token: "test-token", user: { id: "member" } });
});

describe("Authentication navigation", () => {
  test("signed-out users are sent to the login page", () => {
    renderRoutes("/workspaces/team/projects/project-1");
    expect(screen.getByRole("heading", { name: "Sign in to CollaBoard" })).toBeInTheDocument();
  });

  test("signed-in users can open a protected project", () => {
    token = "existing-session";
    renderRoutes("/workspaces/team/projects/project-1");
    expect(screen.getByRole("heading", { name: /Project destination:/ })).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("returns to the requested project after login, including search and hash", async () => {
    const destination = "/workspaces/team/projects/project-1?view=list#task-2";
    const user = renderRoutes(destination);
    await signIn(user);
    expect(await screen.findByRole("heading", { name: `Project destination: ${destination}` })).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST", body: { email: "member@example.com", password: "test-password" },
    });
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  test("direct login falls back to Workspaces", async () => {
    const user = renderRoutes("/login");
    await signIn(user);
    expect(await screen.findByRole("heading", { name: "Workspaces destination" })).toBeInTheDocument();
  });

  test("failed login shows the server message and keeps the user signed out", async () => {
    apiRequest.mockRejectedValue(new Error("Invalid email or password"));
    const user = renderRoutes("/workspaces/team/projects/project-1");
    await signIn(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(saveSession).not.toHaveBeenCalled();
    expect(token).toBeNull();
  });
});
