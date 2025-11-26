// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, "flexirent.db");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Open / create DB
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Failed to open DB:", err);
    process.exit(1);
  }
  console.log("SQLite DB opened at", DB_PATH);
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    location TEXT,
    rent REAL,
    description TEXT,
    owner_contact TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    model TEXT,
    rent_per_day REAL,
    available INTEGER DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS movein_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    address TEXT,
    date TEXT,
    items TEXT
  )`);

  // Insert sample vehicles if table is empty
  db.get("SELECT COUNT(*) AS c FROM vehicles", (err, row) => {
    if (!err && row && row.c === 0) {
      const stmt = db.prepare(
        "INSERT INTO vehicles(type, model, rent_per_day, available) VALUES (?, ?, ?, ?)"
      );
      stmt.run("Car", "Maruti Swift", 1200, 1);
      stmt.run("Bike", "Bajaj Pulsar", 400, 1);
      stmt.run("Van", "Eeco Cargo", 2200, 1);
      stmt.finalize();
      console.log("Inserted sample vehicles");
    }
  });
});

// ------------------- API -------------------

// GET /api/search?location=...
app.get("/api/search", (req, res) => {
  const location = req.query.location || "";
  const sql =
    "SELECT id, title, location, rent, description, owner_contact FROM houses WHERE location LIKE ? ORDER BY id DESC";
  db.all(sql, [`%${location}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/upload
app.post("/api/upload", (req, res) => {
  const { title, location, rent, description, owner_contact } = req.body || {};
  if (!location) return res.status(400).json({ error: "location required" });
  const sql = `INSERT INTO houses (title, location, rent, description, owner_contact) VALUES (?,?,?,?,?)`;
  db.run(
    sql,
    [title || "", location, rent || 0, description || "", owner_contact || ""],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "success", id: this.lastID });
    }
  );
});

// POST /api/movein
app.post("/api/movein", (req, res) => {
  const { name, phone, address, date, items } = req.body || {};
  if (!name || !phone || !address)
    return res.status(400).json({ error: "name, phone and address required" });
  const sql = `INSERT INTO movein_requests (name, phone, address, date, items) VALUES (?,?,?,?,?)`;
  db.run(sql, [name, phone, address, date || "", items || ""], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: "success", id: this.lastID });
  });
});

// GET /api/vehicles
app.get("/api/vehicles", (req, res) => {
  db.all("SELECT * FROM vehicles ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ------------------- Frontend -------------------
// Serve static frontend (we’ll put files into backend/public)
const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));

// SPA fallback for non-API routes (Express v5 safe)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).send("API route not found");
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
