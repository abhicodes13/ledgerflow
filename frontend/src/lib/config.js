// One place for the API address. A trailing slash would turn "/api" into "//api".
export const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");
