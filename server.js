const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: true }));

// --- File paths ---
const FREE_FILE = path.join(__dirname, "free_requests.json");
const PAID_FILE = path.join(__dirname, "paid_requests.json");

// ✅ Make images folder public
app.use("/images", express.static(path.join(__dirname, "images")));

// routes
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

// --- Helpers to read/write JSON ---
const readJSON = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// --- FREE REQUEST FORM SUBMIT ---
app.post("/submit", (req, res) => {
  const { name, category, request, channelName, visibility } = req.body;
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const requests = readJSON(FREE_FILE);
  requests.push({ id, name, category, request, channelName, visibility, created_at });
  writeJSON(FREE_FILE, requests);

  res.send(`
    <h2>💕 Thank you, ${name}!</h2>
    <p>Your request has been saved. I’ll get back to you soon ✨</p>
    <a href="/">Go back</a>
  `);
});

// --- PAID REQUEST FORM SUBMIT ---
app.post("/submit-paid", (req, res) => {
  const { name, package: pkg, request, paymentLink, channelName, visibility } = req.body;
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const paidRequests = readJSON(PAID_FILE);
  paidRequests.push({ id, name, package: pkg, request, paymentLink, channelName, visibility, created_at });
  writeJSON(PAID_FILE, paidRequests);

  res.send(`
    <h2>💖 Thank you, ${name}!</h2>
    <p>Your paid request has been received. Make sure your payment is sent via the link provided. ✨</p>
    <a href="/">Go back</a>
  `);
});

// --- ADMIN / ORDERS PAGE ---
app.get("/admin", (req, res) => {
  const requests = readJSON(FREE_FILE).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const paidRequests = readJSON(PAID_FILE).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.render("orders", { requests, paidRequests });
});

// --- DELETE REQUEST ---
app.delete("/delete-request/:id", (req, res) => {
  const id = req.params.id;

  let requests = readJSON(FREE_FILE);
  const freeIndex = requests.findIndex(r => r.id === id);
  if (freeIndex !== -1) {
    requests.splice(freeIndex, 1);
    writeJSON(FREE_FILE, requests);
    return res.sendStatus(200);
  }

  let paidRequests = readJSON(PAID_FILE);
  const paidIndex = paidRequests.findIndex(r => r.id === id);
  if (paidIndex !== -1) {
    paidRequests.splice(paidIndex, 1);
    writeJSON(PAID_FILE, paidRequests);
    return res.sendStatus(200);
  }

  res.sendStatus(404);
});

// --- HOME PAGE ---
app.get("/", (req, res) => {
  res.render("index");
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🌸 server running at http://localhost:${PORT}`);
});

