// Small shared helpers (money, dates, HTML escaping)

const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents || 0) / 100,
  );

// Accepts a "YYYY-MM-DD" string or a JS Date and returns "YYYY-MM-DD" with no
// time-zone day shift.
function toYmd(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

function formatDate(value) {
  const ymd = toYmd(value);
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );

// "2026-02-31" has the right shape but is not a real date
function isRealDate(ymd) {
  if (typeof ymd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

module.exports = { money, toYmd, formatDate, escapeHtml, isRealDate };
