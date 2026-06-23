const { Pool } = require("pg");

// A connection POOL (not a single Client). CockroachDB's serverless tier closes
// idle connections, and a lone Client never reconnects — so after a few idle
// minutes every query would fail until a restart. A Pool transparently opens a
// fresh connection per query and replaces dropped ones, so the app keeps working.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// If an idle pooled connection errors out (e.g. the DB dropped it), log it instead
// of letting the unhandled 'error' event crash the whole process. The next query
// just gets a new connection.
pool.on("error", (err) => {
  console.warn("⚠️  Idle database connection error (the pool will reconnect):", err.message);
});

// Quick startup check so the console shows whether the DB is reachable. We don't
// crash if it isn't — the server can still boot for frontend work.
(async () => {
  try {
    const result = await pool.query("SELECT current_database();");
    console.log(`🗄️  Connected to database: ${result.rows[0].current_database}`);
  } catch (err) {
    console.warn("⚠️  Could not connect to the database:", err.message);
    console.warn("   Set DATABASE_URL in .env and restart to enable persistence.");
  }
})();

module.exports = pool;
