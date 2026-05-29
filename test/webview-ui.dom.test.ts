// DOM-level regression tests for the webview UI bugs that the native-Windows
// smoke test surfaced and this build fixed (see CLAUDE.md § Status). Each one
// drives the REAL media/chat.js and asserts the fixed behavior, so the bug can't
// silently come back:
//
//   1. History popover that "never closed"  -> open/close toggle + outside-click close
//   2. Session rows "only clickable on the label" -> whole row resumes; action
//      buttons stopPropagation so they don't also resume
//   3. Reasoning traces "no longer expandable" -> header click toggles the body
import { describe, it, expect } from "vitest";
import { bootWebview, dispatch, click, Posted } from "./webview-harness";

const $ = (doc: Document, id: string) => doc.getElementById(id) as HTMLElement;
const types = (posted: Posted[]) => posted.map((p) => p.type);

describe("history popover (regression: popover that never closed)", () => {
  it("opens on the history button and requests the session list", () => {
    const { window, posted, doc } = bootWebview();
    const pop = $(doc, "history-popover");
    expect((pop as any).hidden).toBe(true);

    click(window, $(doc, "history-btn"));

    expect((pop as any).hidden).toBe(false);
    expect(types(posted)).toContain("listSessions");
  });

  it("toggles closed when the history button is clicked again", () => {
    const { window, doc } = bootWebview();
    const pop = $(doc, "history-popover");
    click(window, $(doc, "history-btn"));
    expect((pop as any).hidden).toBe(false);

    click(window, $(doc, "history-btn"));
    expect((pop as any).hidden).toBe(true);
  });

  it("closes on an outside click but stays open on a click inside it", () => {
    const { window, doc } = bootWebview();
    const pop = $(doc, "history-popover");

    click(window, $(doc, "history-btn"));
    expect((pop as any).hidden).toBe(false);

    // click inside the popover -> stopPropagation keeps it open
    click(window, pop);
    expect((pop as any).hidden).toBe(false);

    // click elsewhere in the document -> closePopovers()
    click(window, $(doc, "messages"));
    expect((pop as any).hidden).toBe(true);
  });
});

describe("session rows (regression: only the label was clickable)", () => {
  const entries = [
    { id: "s1", displayName: "Add subtract fn", numMessages: 4, updatedAt: Date.now() - 60000 },
    { id: "s2", displayName: "Refactor parser", numMessages: 9, updatedAt: Date.now() - 3600000 },
  ];

  function openWithSessions() {
    const h = bootWebview();
    click(h.window, $(h.doc, "history-btn")); // open the popover so the list renders
    h.posted.length = 0; // forget the listSessions request; keep only row interactions
    dispatch(h.window, { type: "sessions", entries, activeId: null });
    return h;
  }

  it("renders one row per session with name + meta", () => {
    const { doc } = openWithSessions();
    const rows = doc.querySelectorAll(".history-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector(".history-row-name")!.textContent).toBe("Add subtract fn");
    expect(rows[0].querySelector(".history-row-meta")!.textContent).toContain("4 msg");
  });

  it("resumes the session when the row's META area (not the label) is clicked", () => {
    const { window, posted, doc } = openWithSessions();
    const meta = doc.querySelector(".history-row .history-row-meta") as HTMLElement;
    click(window, meta); // a non-label part of the row

    expect(posted).toContainEqual({ type: "resumeSession", id: "s1" });
  });

  it("delete button posts deleteSession and does NOT also resume (stopPropagation)", () => {
    const { window, posted, doc } = openWithSessions();
    const delBtn = doc.querySelector(".history-row .history-action-danger") as HTMLElement;
    click(window, delBtn);

    expect(posted).toContainEqual({ type: "deleteSession", id: "s1", name: "Add subtract fn" });
    expect(types(posted)).not.toContain("resumeSession");
  });

  it("hides the delete button for the active session, keeps it for others", () => {
    const h = bootWebview();
    click(h.window, $(h.doc, "history-btn"));
    h.posted.length = 0;
    dispatch(h.window, { type: "sessions", entries, activeId: "s1" });
    const rows = h.doc.querySelectorAll(".history-row");
    // s1 is active → no delete button (it's the live session; delete wouldn't stick).
    expect(rows[0].querySelector(".history-action-danger")).toBeNull();
    // s2 is not active → delete button present.
    expect(rows[1].querySelector(".history-action-danger")).not.toBeNull();
    // Rename stays available on the active row.
    expect(rows[0].querySelector(".history-action-btn")).not.toBeNull();
  });

  it("rename button enters rename mode and does NOT resume", () => {
    const { window, posted, doc } = openWithSessions();
    const renameBtn = doc.querySelectorAll(".history-row .history-action-btn")[0] as HTMLElement;
    click(window, renameBtn);

    expect(doc.querySelector(".history-row input.history-rename")).not.toBeNull();
    expect(types(posted)).not.toContain("resumeSession");
  });
});

describe("mode picker (the plan-gate entry path)", () => {
  it("offers Agent / Plan / YOLO and posts setMode with the chosen mode id", () => {
    const { window, posted, doc } = bootWebview();
    const pop = $(doc, "mode-popover");

    click(window, $(doc, "mode-btn"));
    expect((pop as any).hidden).toBe(false);
    const labels = [...pop.querySelectorAll(".mode-item-label")].map((l) => l.textContent);
    expect(labels).toEqual(["Agent mode", "Plan mode", "YOLO"]);

    const planItem = [...pop.querySelectorAll(".mode-popover-item")]
      .find((el) => el.querySelector(".mode-item-label")!.textContent === "Plan mode") as HTMLElement;
    click(window, planItem);

    expect(posted).toContainEqual({ type: "setMode", modeId: "plan" });
    expect((pop as any).hidden).toBe(true); // selecting a mode closes the popover
  });

  it("toggles the mode popover closed when the button is clicked again", () => {
    const { window, doc } = bootWebview();
    const pop = $(doc, "mode-popover");
    click(window, $(doc, "mode-btn"));
    expect((pop as any).hidden).toBe(false);
    click(window, $(doc, "mode-btn"));
    expect((pop as any).hidden).toBe(true);
  });
});

describe("reasoning trace (regression: thinking traces no longer expandable)", () => {
  it("renders a collapsed thinking block whose header toggles the body open/closed", () => {
    const { window, doc } = bootWebview();
    dispatch(window, { type: "thoughtChunk", text: "considering the approach…" });

    const block = doc.querySelector(".msg.thinking")!;
    const hdr = block.querySelector(".thinking-header") as HTMLElement;
    const body = block.querySelector(".thinking-body") as HTMLElement;
    const chevron = block.querySelector(".thinking-chevron") as HTMLElement;

    expect(body.hidden).toBe(true);
    expect(chevron.textContent).toBe("▶");

    click(window, hdr);
    expect(body.hidden).toBe(false);
    expect(chevron.textContent).toBe("▼");

    click(window, hdr);
    expect(body.hidden).toBe(true);
    expect(chevron.textContent).toBe("▶");
  });
});
