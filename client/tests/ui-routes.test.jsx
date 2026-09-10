import { jest, test, expect, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import * as fixture from "../../docs/ui-preview/api.js";

jest.unstable_mockModule("../src/services/api", () => fixture);
jest.unstable_mockModule("../src/services/realtime", () => ({
  getRealtimeSocket: () => ({
    connected: false,
    on() {},
    off() {},
    emit() {},
    connect() {},
  }),
  disconnectRealtimeSocket() {},
}));
const { default: App } = await import("../src/App.jsx");
beforeEach(() => fixture.saveSession());

test.each([
  ["/login", "Sign in to CollaBoard"],
  ["/register", "Create your account"],
  ["/workspaces", "My Workspaces"],
  ["/workspaces/w1/projects", "Product team"],
  ["/workspaces/w1/projects/p1", "CollaBoard"],
  ["/workspaces/w1/members", "Members & Access"],
  ["/workspaces/w1/projects/p1/access", "Project Access"],
  ["/invitations", "My Invitations"],
])("screen %s renders its primary heading with representative API data", async (route, heading) => {
  render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
  expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
});

test("workspace actions use accessible icon-only buttons", async () => {
  render(<MemoryRouter initialEntries={["/workspaces"]}><App /></MemoryRouter>);

  expect(
    await screen.findByRole("heading", { level: 1, name: "My Workspaces" }),
  ).toBeInTheDocument();

  const editButton = screen.getByRole("button", {
    name: "Edit Product team",
  });
  const deleteButton = screen.getByRole("button", {
    name: "Delete Product team",
  });

  expect(editButton).toHaveAttribute("title", "Edit Product team");
  expect(deleteButton).toHaveAttribute("title", "Delete Product team");
  expect(editButton.querySelector("svg")).not.toBeNull();
  expect(deleteButton.querySelector("svg")).not.toBeNull();
  expect(editButton).not.toHaveTextContent("Edit");
  expect(deleteButton).not.toHaveTextContent("Delete");
});
