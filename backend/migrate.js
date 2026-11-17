// =========================================================================
// MIGRATION RUNNER
//
//   node migrate.js          apply every migration that has not run yet
//   node migrate.js status   show what is applied and what is pending
//
// Migrations are the .sql files in backend/migrations, applied in filename
// order (001_..., 002_..., 003_...). Each file runs in its own transaction and
// is recorded in the schema_migrations table, so it can never run twice.
// If a file fails, its changes are rolled back and the runner stops.
//
// Rules that keep this safe:
//   - Never edit a migration that has already been applied anywhere.
//     A new change is a new file with the next number.
//   - Write migrations so they can be re-run (IF NOT EXISTS) and so they only
//     ADD things. Old code keeps working while the new column exists.
//   - Run it against production BEFORE deploying code that needs the change.
//
// It uses the same database connection as the app (./db), so whatever
// DATABASE_URL points at is what gets migrated. Check it before you run it.
// =========================================================================
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const LOCK_ID = 727274; // any constant; stops two runners from overlapping

function listMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();
}

async function main() {
  const statusOnly = process.argv[2] === "status";
  const files = listMigrationFiles();
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename   TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );

    const appliedRows = await client.query(
      "SELECT filename, applied_at FROM schema_migrations ORDER BY filename",
    );
    const applied = new Map(
      appliedRows.rows.map((r) => [r.filename, r.applied_at]),
    );
    const pending = files.filter((f) => !applied.has(f));

    // Applied files that no longer exist in the folder: a warning sign
    const missing = [...applied.keys()].filter((f) => !files.includes(f));
    for (const f of missing) {
      console.warn(
        `WARNING: ${f} is recorded as applied but the file is missing from migrations/`,
      );
    }

    if (statusOnly) {
      for (const f of files) {
        console.log(`${applied.has(f) ? "applied " : "PENDING "} ${f}`);
      }
      console.log(`\n${pending.length} pending, ${applied.size} applied`);
      return;
    }

    if (pending.length === 0) {
      console.log("Nothing to apply. The database is up to date.");
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Applying ${file} ...`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        console.log(`  done`);
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(`  FAILED: ${error.message}`);
        console.error(`  Nothing from ${file} was kept. Fix it and run again.`);
        process.exitCode = 1;
        return;
      }
    }
    console.log("All migrations applied.");
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [LOCK_ID])
      .catch(() => {});
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration runner crashed:", error.message);
  process.exit(1);
});
