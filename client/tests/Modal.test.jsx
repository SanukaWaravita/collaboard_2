import { jest, test, expect } from "@jest/globals";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "../src/components/Modal";

function Harness({ busy = false, onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open form</button>{open &&
    <Modal busy={busy} onClose={() => { onClose(); setOpen(false); }}>
      <form role="dialog" aria-modal="true" aria-label="Example form">
        <button type="button">Close</button><input aria-label="Name" />
        <button type="submit">Save</button>
      </form>
    </Modal>}</>;
}

test("focus remains in the dialog and returns to its trigger on Escape", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Open form" }));
  expect(screen.getByLabelText("Name")).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  expect(document.body.style.overflow).toBe("hidden");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open form" })).toHaveFocus();
  expect(document.body.style.overflow).toBe("");
});

test("Escape cannot discard an in-flight save", async () => {
  const onClose = jest.fn();
  const user = userEvent.setup();
  const { rerender } = render(<Harness busy onClose={onClose} />);
  await user.click(screen.getByRole("button", { name: "Open form" }));
  await user.keyboard("{Escape}");
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  rerender(<Harness busy={false} onClose={onClose} />);
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
});
