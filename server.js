const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- FILE PATHS ---
const DATA_FILE = path.join(__dirname, "requests.json");
const PAID_DATA_FILE = path.join(__dirname, "paidRequests.json");

// --- VIEW ENGINE ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: true }));

// --- HOMEPAGE ---
app.get("/", (req, res) => {
  res.render("index");
});

// --- FREE REQUEST FORM SUBMIT ---
app.post("/submit", (req, res) => {
  const { name, category, request } = req.body;

  let requests = [];
  if (fs.existsSync(DATA_FILE)) {
    requests = JSON.parse(fs.readFileSync(DATA_FILE));
  }

  requests.push({
    name,
    category,
    request,
    date: new Date().toLocaleString()
  });

  fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2));

  res.send(`
    <h2>💕 Thank you, ${name}!</h2>
    <p>Your request has been saved. I’ll get back to you soon ✨</p>
    <a href="/">Go back</a>
  `);
});

// --- PAID REQUEST FORM SUBMIT ---
app.post("/submit-paid", (req, res) => {
  const { name, package: pkg, request, paymentLink } = req.body;

  let paidRequests = [];
  if (fs.existsSync(PAID_DATA_FILE)) {
    paidRequests = JSON.parse(fs.readFileSync(PAID_DATA_FILE));
  }

  paidRequests.push({
    name,
    package: pkg,
    request,
    paymentLink,
    date: new Date().toLocaleString()
  });

  fs.writeFileSync(PAID_DATA_FILE, JSON.stringify(paidRequests, null, 2));

  res.send(`
    <h2>💖 Thank you, ${name}!</h2>
    <p>Your paid request has been received. Make sure your payment is sent via the link provided. ✨</p>
    <a href="/">Go back</a>
  `);
});

// --- ADMIN / ORDERS PAGE ---
app.get("/admin", (req, res) => {
  let requests = [];
  let paidRequests = [];

  if (fs.existsSync(DATA_FILE)) {
    requests = JSON.parse(fs.readFileSync(DATA_FILE));
  }

  if (fs.existsSync(PAID_DATA_FILE)) {
    paidRequests = JSON.parse(fs.readFileSync(PAID_DATA_FILE));
  }

  res.render("orders", { requests, paidRequests });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🌸 server running at http://localhost:${PORT}`);
});
