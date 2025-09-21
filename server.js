const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: true }));

// --- Connect to Render Postgres ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render Postgres URL
  ssl: { rejectUnauthorized: false },         // only needed if Render requires SSL
});

// --- FREE REQUEST FORM SUBMIT ---
app.post("/submit", async (req, res) => {
  const { name, category, request, channelName, visibility } = req.body;
  const id = crypto.randomUUID();
  const created_at = new Date(); // use created_at instead of "date"

  try {
    await pool.query(
      `INSERT INTO free_requests (id, name, category, request, channelName, visibility, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, name, category, request, channelName, visibility, created_at]
    );

    res.send(`
      <h2>💕 Thank you, ${name}!</h2>
      <p>Your request has been saved. I’ll get back to you soon ✨</p>
      <a href="/">Go back</a>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Something went wrong");
  }
});

// --- PAID REQUEST FORM SUBMIT ---
app.post("/submit-paid", async (req, res) => {
  const { name, package: pkg, request, paymentLink, channelName, visibility } = req.body;
  const id = crypto.randomUUID();
  const created_at = new Date();

  try {
    await pool.query(
      `INSERT INTO paid_requests (id, name, package, request, paymentLink, channelName, visibility, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, name, pkg, request, paymentLink, channelName, visibility, created_at]
    );

    res.send(`
      <h2>💖 Thank you, ${name}!</h2>
      <p>Your paid request has been received. Make sure your payment is sent via the link provided. ✨</p>
      <a href="/">Go back</a>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Something went wrong");
  }
});

// --- ADMIN / ORDERS PAGE ---
app.get("/admin", async (req, res) => {
  try {
    const { rows: requests } = await pool.query(
      "SELECT * FROM free_requests ORDER BY created_at DESC"
    );
    const { rows: paidRequests } = await pool.query(
      "SELECT * FROM paid_requests ORDER BY created_at DESC"
    );
    res.render("orders", { requests, paidRequests });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Could not load orders");
  }
});

// --- DELETE REQUEST ---
app.delete("/delete-request/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const free = await pool.query(
      "DELETE FROM free_requests WHERE id=$1 RETURNING *",
      [id]
    );
    if (free.rowCount > 0) return res.sendStatus(200);

    const paid = await pool.query(
      "DELETE FROM paid_requests WHERE id=$1 RETURNING *",
      [id]
    );
    if (paid.rowCount > 0) return res.sendStatus(200);

    res.sendStatus(404);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// --- HOME PAGE ---
app.get("/", (req, res) => {
  res.render("index");
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🌸 server running at http://localhost:${PORT}`);
});
