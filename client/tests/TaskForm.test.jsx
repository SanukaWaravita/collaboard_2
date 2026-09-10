import { describe, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskForm from "../src/components/TaskForm.jsx";

const workflowStatuses = [
  { id: "todo", name: "To Do" },
  { id: "done", name: "Done" },
];
const currentUser = { id: "creator", name: "Task Creator" };
const reporters = [
  { userId: "creator", name: "Task Creator" },
  { userId: "reviewer", name: "Project Reviewer" },
];
const assignees = [
  { userId: "creator", name: "Task Creator" },
  { userId: "reviewer", name: "Project Reviewer" },
];
const draftStorageKey = "collaboard:task-draft:v1:creator:project-1";

function renderForm(overrides = {}) {
  const onSubmit = jest.fn();
  render(<TaskForm
    workflowStatuses={workflowStatuses}
    currentUser={currentUser}
    reporters={reporters}
    onSubmit={onSubmit}
    onCancel={jest.fn()}
    {...overrides}
  />);
  return { user: userEvent.setup(), onSubmit };
}

describe("Task form", () => {
  test("submits trimmed text, selected status and creator as reporter", async () => {
    const { user, onSubmit } = renderForm();
    await user.type(screen.getByLabelText("Title"), "  Write M4 tests  ");
    await user.type(screen.getByLabelText("Description"), "  Verify task creation  ");
    await user.selectOptions(screen.getByLabelText("Status"), "done");
    await user.click(screen.getByRole("button", { name: "Create Task" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Write M4 tests", description: "Verify task creation",
      status: "done", dueDate: null, assigneeIds: [], reporterId: "creator",
    });
  });

  test("does not submit a whitespace-only title", async () => {
    const { user, onSubmit } = renderForm();
    await user.type(screen.getByLabelText("Title"), "   ");
    await user.click(screen.getByRole("button", { name: "Create Task" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("clearing an existing due date submits null", async () => {
    const { user, onSubmit } = renderForm({ initialTask: {
      id: "task-1", title: "Existing task", status: "todo",
      dueDate: "2026-09-30", reporterId: "creator",
    } });
    await user.click(screen.getByRole("button", { name: "Clear", exact: true }));
    expect(screen.getByLabelText("Due date")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ dueDate: null }));
  });

  test("reporter-only editing sends no changes to restricted task fields", async () => {
    const { user, onSubmit } = renderForm({
      initialTask: { id: "task-1", title: "Restricted task", status: "todo", reporterId: "creator" },
      canEditTaskFields: false, canAssignReporter: true,
    });
    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Change Reporter" })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Reporter"), "reviewer");
    await user.click(screen.getByRole("button", { name: "Change Reporter" }));
    expect(onSubmit).toHaveBeenCalledWith({ reporterId: "reviewer" });
  });

  test("prevents further submission while saving", async () => {
    const { user, onSubmit } = renderForm({ isSubmitting: true });
    expect(screen.getByLabelText("Title")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Saving..." }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("automatically stores unfinished task details in localStorage", async () => {
    const { user } = renderForm({ draftStorageKey, assignees });

    await user.type(screen.getByLabelText("Title"), "Recovered task");
    await user.type(screen.getByLabelText("Description"), "Still in progress");
    await user.selectOptions(screen.getByLabelText("Status"), "done");
    await user.click(screen.getByRole("checkbox", { name: "Project Reviewer" }));

    expect(JSON.parse(localStorage.getItem(draftStorageKey))).toEqual(
      expect.objectContaining({
        version: 1,
        title: "Recovered task",
        description: "Still in progress",
        status: "done",
        assigneeIds: ["reviewer"],
        reporterId: "creator",
      }),
    );
  });

  test("recovers a valid unfinished draft for the current project", () => {
    localStorage.setItem(draftStorageKey, JSON.stringify({
      version: 1,
      savedAt: "2026-09-10T12:00:00.000Z",
      title: "Recovered task",
      description: "Continue after reload",
      status: "done",
      dueDate: "2026-09-30",
      assigneeIds: ["reviewer", "former-member"],
      reporterId: "reviewer",
    }));

    renderForm({ draftStorageKey, assignees, canAssignReporter: true });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Unsaved draft recovered",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Recovered task");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Continue after reload",
    );
    expect(screen.getByLabelText("Status")).toHaveValue("done");
    expect(screen.getByLabelText("Due date")).toHaveValue("2026-09-30");
    expect(screen.getByLabelText("Reporter")).toHaveValue("reviewer");
    expect(
      screen.getByRole("checkbox", { name: "Project Reviewer" }),
    ).toBeChecked();
  });

  test("lets the user discard a recovered draft and start clean", async () => {
    localStorage.setItem(draftStorageKey, JSON.stringify({
      version: 1,
      title: "Discard me",
      description: "Old work",
      status: "done",
      dueDate: "2026-09-30",
      assigneeIds: ["reviewer"],
      reporterId: "reviewer",
    }));
    const { user } = renderForm({
      draftStorageKey,
      assignees,
      canAssignReporter: true,
    });

    await user.click(screen.getByRole("button", { name: "Discard draft" }));

    expect(localStorage.getItem(draftStorageKey)).toBeNull();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveValue("todo");
    expect(screen.getByLabelText("Due date")).toHaveValue("");
    expect(screen.getByLabelText("Reporter")).toHaveValue("creator");
    expect(screen.queryByText("Unsaved draft recovered")).not.toBeInTheDocument();
  });

  test("ignores task drafts while editing an existing task", () => {
    localStorage.setItem(draftStorageKey, JSON.stringify({
      version: 1,
      title: "Creation draft",
      status: "done",
      assigneeIds: [],
      reporterId: "creator",
    }));

    renderForm({
      draftStorageKey,
      initialTask: {
        id: "task-1",
        title: "Existing task",
        status: "todo",
        reporterId: "creator",
      },
    });

    expect(screen.getByLabelText("Title")).toHaveValue("Existing task");
    expect(screen.queryByText("Unsaved draft recovered")).not.toBeInTheDocument();
  });
});
