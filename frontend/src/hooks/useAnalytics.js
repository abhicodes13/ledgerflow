import { useEffect, useState } from "react";
import { errorMessage } from "../lib/api";

/* The analytics endpoints return raw cents. Their exact field names weren't specified,
   so these readers accept likely variants. If a chart looks empty, check the Network
   response and adjust the key lists here. This is the only place that reads them. */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const count = (v) => (Array.isArray(v) ? v.length : num(v));
const pick = (obj, keys) => {
  for (const k of keys) if (obj?.[k] != null) return obj[k];
  return undefined;
};
const asArray = (payload, keys) => {
  if (Array.isArray(payload)) return payload;
  for (const k of [...keys, "data", "rows", "items", "results"]) {
    if (Array.isArray(payload?.[k])) return payload[k];
    if (Array.isArray(payload?.data?.[k])) return payload.data[k];
  }
  return [];
};

function bucketLabel(raw) {
  const text = String(raw);
  if (/not.?yet|current|not.?due|upcoming/i.test(text)) return "Not yet due";
  const range = text.match(/(\d+)\D+(\d+)/);
  if (range) return `${range[1]}–${range[2]} days`;
  const plus =
    text.match(/(\d+)\s*\+/) || text.match(/(?:over|plus|gt)\D*(\d+)/i);
  if (plus) return `${plus[1]}+ days`;
  return text.replace(/[_-]+/g, " ");
}

export function normalizeAging(payload) {
  let list = asArray(payload, ["buckets", "aging"]);
  if (!list.length) {
    const obj = payload?.buckets ?? payload?.aging ?? payload?.data ?? payload;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      list = Object.entries(obj)
        .filter(
          ([, v]) => v && (typeof v === "object" || typeof v === "number"),
        )
        .map(([key, v]) =>
          typeof v === "object" ? { key, ...v } : { key, total_cents: v },
        );
    }
  }
  return list.map((b, i) => {
    const name = pick(b, ["label", "name", "bucket", "key"]) ?? i;
    return {
      key: String(name),
      label: bucketLabel(name),
      cents: num(
        pick(b, [
          "total_cents",
          "amount_cents",
          "outstanding_cents",
          "balance_cents",
          "cents",
          "total",
          "amount",
        ]),
      ),
      count: count(
        pick(b, ["count", "invoice_count", "invoices", "num_invoices"]),
      ),
    };
  });
}

export function normalizeRevenue(payload) {
  return asArray(payload, ["months", "revenue", "series"]).map((r) => ({
    month: String(pick(r, ["month", "period", "date", "label"]) ?? ""),
    invoiced: num(
      pick(r, ["invoiced_cents", "invoiced", "billed_cents", "billed"]),
    ),
    collected: num(
      pick(r, ["collected_cents", "collected", "paid_cents", "paid"]),
    ),
  }));
}

export function normalizeClients(payload) {
  return asArray(payload, ["clients"]).map((c, i) => ({
    id: pick(c, ["client_id", "id"]) ?? i,
    name: String(pick(c, ["client_name", "name"]) ?? "Client"),
    email: String(pick(c, ["email", "client_email"]) ?? ""),
    invoices: count(pick(c, ["invoice_count", "invoices", "total_invoices"])),
    outstanding: num(pick(c, ["outstanding_cents", "outstanding"])),
    overdue: num(pick(c, ["overdue_cents", "overdue"])),
    paid: num(pick(c, ["paid_cents", "collected_cents", "paid"])),
  }));
}

async function get(apiBase, token, path, signal) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(body, "Couldn't load this."));
  return body;
}

// Loads one endpoint. Reloads when `path` or `version` changes. Old data stays visible while it reloads.
export function useInsight(apiBase, token, path, normalize, version) {
  const [state, setState] = useState({
    path: null,
    status: "loading",
    data: [],
    error: "",
  });

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    get(apiBase, token, path, controller.signal)
      .then((body) =>
        setState({ path, status: "ready", data: normalize(body), error: "" }),
      )
      .catch((err) => {
        if (err.name !== "AbortError") {
          setState({ path, status: "error", data: [], error: err.message });
        }
      });
    return () => controller.abort();
  }, [apiBase, token, path, normalize, version]);

  return state.path === path
    ? state
    : { status: "loading", data: [], error: "" };
}
