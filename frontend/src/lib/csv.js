import { saveBlob } from "./api";

// Spreadsheets run text that starts with = + - @ as a formula, so a client named
// "=HYPERLINK(...)" could do harm when the file is opened. Such text gets a leading
// apostrophe. Plain numbers and phone numbers (+1 201 555 1234) are left alone.
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?[\d\s().-]+$/;

function cell(value) {
  if (value == null) return "";
  let text = String(value);
  if (
    typeof value !== "number" &&
    FORMULA_START.test(text) &&
    !PLAIN_NUMBER.test(text)
  ) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows, columns) {
  const head = columns.map((c) => cell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => cell(c.value(row))).join(","),
  );
  return [head, ...lines].join("\r\n");
}

export function downloadCsv(filename, rows, columns) {
  // The BOM makes Excel read accents and symbols correctly
  const text = `\uFEFF${toCsv(rows, columns)}\r\n`;
  saveBlob(new Blob([text], { type: "text/csv;charset=utf-8" }), filename);
}

export const dollars = (cents) => ((Number(cents) || 0) / 100).toFixed(2);

// "2026-12-31" or "2026-12-31T00:00:00Z" -> "2026-12-31"
export const dateOnly = (value) =>
  /^\d{4}-\d{2}-\d{2}/.exec(String(value ?? ""))?.[0] ?? "";
