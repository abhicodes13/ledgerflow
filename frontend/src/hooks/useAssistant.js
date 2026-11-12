import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../lib/api";

const REQUEST_TIMEOUT_MS = 40_000; // the typing indicator gives up after this
const CARD_TTL_MS = 15 * 60 * 1000; // the server expires confirmation cards after 15 minutes
const MAX_MESSAGE = 2000;
const HISTORY_COUNT = 8;
// ASSUMPTION: the field name and shape the backend expects for history.
// Confirm with your backend dev. This is the only place to change.
const HISTORY_FIELD = "history"; // sent as [{ role: "user" | "assistant", content }]
const EXPIRED_NOTE =
  "This request expired or was already used. Ask again if you still need it.";

const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const actionLabel = (action) =>
  String(action || "action").replace(/[_-]+/g, " ");

const welcome = () => ({
  id: "welcome",
  type: "action_deck",
  sender: "ai",
  text: "Hi! I can add clients, draft invoices, mark payments as received, and send reminders. Pick a shortcut or just type what you need.",
});

// Never throws: network failures, timeouts, and plain-text bodies (a 429 may not be JSON)
// all come back as a result object.
async function request(apiBase, token, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data, failure: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      failure: err?.name === "AbortError" ? "timeout" : "network",
    };
  } finally {
    clearTimeout(timer);
  }
}

function failureText(r, fallback) {
  if (r.failure === "timeout") return "That's taking longer than expected.";
  if (r.failure === "network")
    return "I couldn't reach the server. Check your connection.";
  if (r.status === 429)
    return "Too many requests. Please wait a moment and try again.";
  if (r.status === 401) return "Your session has ended. Please sign in again.";
  if (r.status === 403 && r.data?.code === "SUBSCRIPTION_REQUIRED")
    return "An active subscription is required to do that.";
  return errorMessage(r.data, fallback);
}

const isRetryable = (r) =>
  Boolean(r.failure) || r.status === 429 || r.status >= 500;

// The last few text messages, plus a short line for each resolved card
export function buildHistory(messages) {
  return messages
    .map((m) => {
      if (m.type === "text") {
        return {
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        };
      }
      if (m.type === "approval_box" && m.history) {
        return { role: "assistant", content: m.history };
      }
      return null;
    })
    .filter(Boolean)
    .map((h) => ({
      ...h,
      content: String(h.content ?? "").slice(0, MAX_MESSAGE),
    }))
    .filter((h) => h.content.trim())
    .slice(-HISTORY_COUNT);
}

export function useAssistant({ apiBase, token, onChanged }) {
  const [messages, setMessages] = useState(() => [welcome()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState(token);

  const messagesRef = useRef(messages);
  const tokenRef = useRef(token);
  const sending = useRef(false);
  const inFlight = useRef(new Set()); // card ids being confirmed right now

  // A different account must never see the previous conversation
  if (owner !== token) {
    setOwner(token);
    setMessages([welcome()]);
    setInput("");
    setLoading(false);
  }

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const patch = useCallback(
    (id, changes) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...changes } : m)),
      ),
    [],
  );

  const add = useCallback(
    (message) =>
      setMessages((prev) => [...prev, { id: uid(), sender: "ai", ...message }]),
    [],
  );

  // Gray out cards the server has already expired
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (
            m.type === "approval_box" &&
            m.status === "waiting" &&
            now - m.createdAt > CARD_TTL_MS
          ) {
            changed = true;
            return {
              ...m,
              status: "expired",
              note: EXPIRED_NOTE,
              history: `Expired: ${actionLabel(m.action)}`,
            };
          }
          return m;
        });
        return changed ? next : prev;
      });
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const send = useCallback(
    async (raw, { retry = false } = {}) => {
      const text = String(raw ?? "").trim();
      if (!text || !token || sending.current) return;
      if (text.length > MAX_MESSAGE) {
        add({
          type: "error",
          text: "That message is too long. Please keep it under 2,000 characters.",
        });
        return;
      }

      sending.current = true;
      const sentWith = token;

      // History is what came BEFORE this message
      let past = messagesRef.current.filter((m) => m.type !== "error");
      if (retry) {
        const last = past[past.length - 1];
        if (
          last?.type === "text" &&
          last.sender === "user" &&
          last.text === text
        ) {
          past = past.slice(0, -1);
        }
        setMessages((prev) => prev.filter((m) => m.type !== "error"));
      } else {
        setMessages((prev) => [
          ...prev,
          { id: uid(), type: "text", sender: "user", text },
        ]);
        setInput("");
      }
      setLoading(true);

      const history = buildHistory(past);
      const body = { message: text };
      if (history.length) body[HISTORY_FIELD] = history;

      const r = await request(apiBase, token, "/api/chat", body);
      sending.current = false;
      if (tokenRef.current !== sentWith) return; // signed out meanwhile
      setLoading(false);

      if (r.failure || !r.ok) {
        // 401 and 403 are also handled globally (sign out, paywall)
        add({
          type: "error",
          text: failureText(r, "Sorry, I couldn't handle that request."),
          retryText: isRetryable(r) ? text : null,
        });
        return;
      }

      const d = r.data ?? {};
      if (d.type === "approval_required") {
        add({
          type: "approval_box",
          text: typeof d.message === "string" ? d.message : "",
          action: d.action,
          data: d.data,
          status: "waiting",
          createdAt: Date.now(),
          note: "",
        });
      } else if (d.type === "action_deck") {
        add({
          type: "action_deck",
          text: "Here's what I can do. Pick one or type what you need.",
        });
      } else {
        const reply = typeof d.message === "string" ? d.message.trim() : "";
        add({
          type: "text",
          text: reply || "I didn't get a reply. Try rephrasing that.",
        });
      }
    },
    [apiBase, token, add],
  );

  const confirm = useCallback(
    async (id) => {
      const card = messagesRef.current.find((m) => m.id === id);
      if (!card || card.type !== "approval_box") return;
      if (card.status !== "waiting" && card.status !== "failed") return;
      if (inFlight.current.has(id)) return; // instant double-click guard
      inFlight.current.add(id);
      const sentWith = token;
      patch(id, { status: "confirming", note: "" });

      // action and data go back exactly as the server sent them
      const r = await request(apiBase, token, "/api/chat/confirm", {
        action: card.action,
        data: card.data,
      });
      inFlight.current.delete(id);
      if (tokenRef.current !== sentWith) return;

      if (r.ok) {
        const text =
          typeof r.data?.message === "string" && r.data.message.trim()
            ? r.data.message
            : "Done.";
        patch(id, { status: "done", note: text, history: `Done: ${text}` });
        onChanged?.(); // refresh clients, invoices, metrics
        return;
      }
      if (r.status === 409) {
        patch(id, {
          status: "expired",
          note: errorMessage(r.data, EXPIRED_NOTE),
          history: `Expired: ${actionLabel(card.action)}`,
        });
        onChanged?.(); // it may have been confirmed elsewhere
        return;
      }
      patch(id, {
        status: "failed",
        note: failureText(r, "Couldn't run that action."),
        canRetry: isRetryable(r),
      });
    },
    [apiBase, token, onChanged, patch],
  );

  const cancel = useCallback(
    (id) => {
      const card = messagesRef.current.find((m) => m.id === id);
      if (!card || card.type !== "approval_box") return;
      if (card.status !== "waiting" && card.status !== "failed") return;
      patch(id, {
        status: "cancelled",
        note: "Cancelled.",
        history: `Cancelled: ${actionLabel(card.action)}`,
      });
    },
    [patch],
  );

  return { messages, input, setInput, loading, send, confirm, cancel };
}
