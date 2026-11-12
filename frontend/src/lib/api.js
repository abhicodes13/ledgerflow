// Pull a readable message out of whatever shape the server's error has.
export function errorMessage(data, fallback = "Something went wrong.") {
  if (!data) return fallback;
  if (typeof data === "string") return data;

  const e = data.error ?? data.message ?? data.errors;
  if (typeof e === "string") return e;

  const text = (x) =>
    typeof x === "string" ? x : (x?.message ?? x?.msg ?? "");

  if (Array.isArray(e)) {
    const parts = e.map(text).filter(Boolean);
    return parts.length ? parts.join(" ") : fallback;
  }
  if (e && typeof e === "object") {
    if (text(e)) return text(e);
    const parts = Object.values(e).flat().map(text).filter(Boolean);
    return parts.length ? parts.join(" ") : fallback;
  }
  return fallback;
}

// Reads a failed fetch Response and returns a message for it.
export async function readError(res, fallback) {
  const data = await res.json().catch(() => null);
  return errorMessage(data, fallback);
}

// Fetches a protected file (the PDF route needs the auth header, so a plain link won't work)
export async function fetchPdfBlob(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok)
    throw new Error(await readError(res, "Couldn't download the PDF."));
  return res.blob();
}

// Triggers a browser download for a blob
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// POST JSON without ever throwing: plain-text bodies, empty bodies, and 429s all come back as a result.
export async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: null, network: true };
  }
  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null; // not JSON (for example a rate-limit message)
  }
  return { ok: res.ok, status: res.status, data, network: false };
}
