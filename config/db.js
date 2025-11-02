const { Client } = require("pg");

const client = new Client(process.env.DATABASE_URL);
(async () => {
  await client.connect();
  try {
    const query1 = await client.query('USE diary_app;')
    const results = await client.query("SELECT current_database();");
    console.log(results);
  } catch (err) {
    console.error("error executing query:", err);
  }
})();

module.exports = client;