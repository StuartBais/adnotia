// Native inputs, styled. Nothing here reimplements a control the browser
// already has: a native time input gets the platform's own picker, which is
// better than anything worth building.

import { el, field, fieldLabel, type Control } from "./dom";

interface BaseOptions {
  label?: string;
  optional?: boolean;
  hint?: string;
  placeholder?: string;
}

function makeInput(
  type: "time" | "number" | "text" | "password",
  options: BaseOptions & { value?: string; onChange?: (value: string) => void },
  extra: Record<string, string> = {},
): Control<string> {
  const input = el("input", { type, ...extra });
  input.value = options.value ?? "";
  if (options.placeholder !== undefined)
    input.placeholder = options.placeholder;
  if (options.label !== undefined)
    input.setAttribute("aria-label", options.label);

  input.addEventListener("input", () => options.onChange?.(input.value));

  const element =
    options.label === undefined
      ? input
      : field(fieldLabel(options.label, options.optional), input, options.hint);

  return {
    element,
    value: () => input.value,
    set(value) {
      input.value = value;
    },
  };
}

export function passwordInput(
  options: BaseOptions & {
    numeric?: boolean;
    autocomplete?: "current-password" | "new-password";
  } = {},
): Control<string> {
  return makeInput("password", options, {
    autocomplete: options.autocomplete ?? "current-password",
    ...(options.numeric ? { inputmode: "numeric", pattern: "[0-9]*" } : {}),
  });
}

export interface TimeInputOptions extends BaseOptions {
  value?: string;
  onChange?: (value: string) => void;
}

/** `HH:MM`, 24-hour. The kernel's date service does the arithmetic. */
export function timeInput(options: TimeInputOptions = {}): Control<string> {
  return makeInput("time", options);
}

export interface NumberInputOptions extends BaseOptions {
  value?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: string) => void;
}

export function numberInput(options: NumberInputOptions = {}): Control<string> {
  const extra: Record<string, string> = {};
  if (options.min !== undefined) extra["min"] = String(options.min);
  if (options.max !== undefined) extra["max"] = String(options.max);
  if (options.step !== undefined) extra["step"] = String(options.step);
  // A numeric keypad on a phone, without the spinner arrows of type=number.
  extra["inputmode"] = "decimal";
  return makeInput("number", options, extra);
}

export interface TextInputOptions extends BaseOptions {
  value?: string;
  /** A one-line note, or a box for something longer. */
  multiline?: boolean;
  onChange?: (value: string) => void;
}

export function textInput(options: TextInputOptions = {}): Control<string> {
  if (options.multiline !== true) return makeInput("text", options);

  const area = el("textarea", {});
  area.value = options.value ?? "";
  if (options.placeholder !== undefined) area.placeholder = options.placeholder;
  if (options.label !== undefined)
    area.setAttribute("aria-label", options.label);
  area.addEventListener("input", () => options.onChange?.(area.value));

  const element =
    options.label === undefined
      ? area
      : field(fieldLabel(options.label, options.optional), area, options.hint);

  return {
    element,
    value: () => area.value,
    set(value) {
      area.value = value;
    },
  };
}
