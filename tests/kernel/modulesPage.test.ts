import { describe, expect, it, vi } from "vitest";
import { createStore } from "../../src/kernel/store/store";
import { modulesPage } from "../../src/kernel/shell/modules";
import medication from "../../src/modules/medication/manifest";
import sleep from "../../src/modules/sleep/manifest";

describe("module settings", () => {
  it("preserves data when disabled and requires confirmation before deletion", () => {
    const store = createStore();
    store.set("sleep", { version: 1, days: { "2026-09-01": { hours: "8" } } });
    store.updateKernel((kernel) => ({ ...kernel, enabledModules: ["sleep"] }));
    const confirm = vi.fn().mockReturnValue(false);
    const root = document.createElement("div");
    modulesPage({ store, modules: [sleep], confirm }).render(root);
    const button = (text: string) =>
      [...root.querySelectorAll("button")].find(
        (node) => node.textContent === text,
      )!;
    button("On").click();
    expect(store.document().kernel.enabledModules).toEqual([]);
    expect(store.get("sleep")).toBeDefined();
    button("Delete data").click();
    expect(store.get("sleep")).toBeDefined();
    confirm.mockReturnValue(true);
    button("Delete data").click();
    expect(store.get("sleep")).toBeUndefined();
    store.dispose();
  });

  it("enforces eligibility in Settings and saves the chosen module order", () => {
    const store = createStore();
    const root = document.createElement("div");
    modulesPage({ store, modules: [medication, sleep] }).render(root);
    const medicationRow = root.querySelector(".card")!;
    (medicationRow.querySelector("button") as HTMLButtonElement).click();
    expect(store.document().kernel.enabledModules).toEqual([]);
    [...medicationRow.querySelectorAll("button")]
      .find((node) => node.textContent === "Yes")!
      .click();
    expect(store.document().kernel.enabledModules).toEqual(["medication"]);
    (
      root.querySelector('[aria-label="Move Sleep up"]') as HTMLButtonElement
    ).click();
    expect(store.document().kernel.moduleOrder.slice(0, 2)).toEqual([
      "sleep",
      "medication",
    ]);
    store.dispose();
  });
});
