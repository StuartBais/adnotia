import type { ModuleManifest } from "../registry/types";
import type { KernelStore } from "../store/store";
import { el } from "../ui/index";
import { moduleChoice } from "./firstRun";
import type { OffTabPage } from "./router";

export function modulesPage(options: {
  store: KernelStore;
  modules: readonly ModuleManifest[];
  confirm?: (message: string) => boolean;
}): OffTabPage {
  const { store } = options;
  const page: OffTabPage = {
    id: "modules",
    title: "Manage tools",
    render(container) {
      const space = store.space();
      const order = store.document().kernel.moduleOrder;
      const rank = (id: string) =>
        order.includes(id) ? order.indexOf(id) : Number.MAX_SAFE_INTEGER;
      const modules = options.modules
        .filter(
          (manifest) =>
            manifest.audience === (space === "adult" ? "adult" : "parent"),
        )
        .sort((left, right) => rank(left.id) - rank(right.id));
      container.replaceChildren();
      if (
        modules.length === 0 ||
        (space === "family" && store.profile() === undefined)
      ) {
        container.append(
          el("p", { text: "No tools available in this space yet." }),
        );
        return;
      }
      for (const [index, manifest] of modules.entries()) {
        const status = el("p", { class: "hint", role: "status" });
        const remove = el("button", {
          type: "button",
          class: "btn",
          text: "Delete data",
        });
        remove.disabled = store.get(manifest.id) === undefined;
        const row = moduleChoice({
          manifest,
          space,
          enabled: store.document().kernel.enabledModules.includes(manifest.id),
          onChange: (enabled) => {
            if (enabled && store.get(manifest.id) === undefined) {
              const fixture = manifest.fixtures?.empty;
              const initial =
                typeof fixture === "object" &&
                fixture !== null &&
                !Array.isArray(fixture)
                  ? structuredClone(fixture)
                  : {};
              store.set(manifest.id, {
                ...initial,
                version: manifest.version,
              });
            }
            store.updateKernel((kernel) => ({
              ...kernel,
              enabledModules: enabled
                ? [...new Set([...kernel.enabledModules, manifest.id])]
                : kernel.enabledModules.filter((id) => id !== manifest.id),
              moduleOrder: kernel.moduleOrder.includes(manifest.id)
                ? kernel.moduleOrder
                : [...kernel.moduleOrder, manifest.id],
            }));
            remove.disabled = store.get(manifest.id) === undefined;
            status.textContent = enabled
              ? "Tool enabled."
              : "Tool disabled. Its data is still here.";
          },
        });
        remove.addEventListener("click", () => {
          const confirm = options.confirm ?? globalThis.confirm;
          if (
            !confirm(
              `Delete all ${manifest.name} data in this space? This cannot be undone here.`,
            )
          )
            return;
          store.deleteSlice(manifest.id);
          remove.disabled = true;
          status.textContent = "Data deleted.";
        });
        function move(offset: number): void {
          const ids = modules.map((entry) => entry.id);
          const other = index + offset;
          if (other < 0 || other >= ids.length) return;
          [ids[index], ids[other]] = [ids[other]!, ids[index]!];
          store.updateKernel((kernel) => ({
            ...kernel,
            moduleOrder: [
              ...ids,
              ...kernel.moduleOrder.filter((id) => !ids.includes(id)),
            ],
          }));
          page.render(container);
        }
        const up = el("button", {
          type: "button",
          class: "btn small",
          text: "\u2191",
          title: `Move ${manifest.name} up`,
          "aria-label": `Move ${manifest.name} up`,
        });
        const down = el("button", {
          type: "button",
          class: "btn small",
          text: "\u2193",
          title: `Move ${manifest.name} down`,
          "aria-label": `Move ${manifest.name} down`,
        });
        up.disabled = index === 0;
        down.disabled = index === modules.length - 1;
        up.addEventListener("click", () => move(-1));
        down.addEventListener("click", () => move(1));
        row.append(el("div", { class: "btnrow" }, [up, down, remove]), status);
        container.append(row);
      }
    },
  };
  return page;
}
