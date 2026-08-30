const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "EASY_BILL_LK_SECRET_CHANGE_ME";

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "database.json");

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const db = {
      users: [],
      products: [],
      tables: [],
      sales: [],
      counter: 1
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return {
      users: [],
      products: [],
      tables: [],
      sales: [],
      counter: 1
    };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Login required"
    });
  }

  const token = header.substring(7);

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired login"
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only"
    });
  }
  next();
}

/* ================= REGISTER ================= */

app.post("/api/register", async (req, res) => {
  const { username, password, phone } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password required"
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Username must contain at least 3 characters"
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 4 characters"
    });
  }

  const db = loadDB();

  const exists = db.users.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  if (exists) {
    return res.status(409).json({
      success: false,
      message: "Username already exists"
    });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now().toString(),
    username,
    password: hash,
    phone: phone || "",
    role: db.users.length === 0 ? "admin" : "cashier",
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDB(db);

  res.json({
    success: true,
    message: "Account created successfully",
    user: {
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role
    }
  });
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const db = loadDB();

  const user = db.users.find(
    u => u.username.toLowerCase() === String(username || "").toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password"
    });
  }

  const valid = await bcrypt.compare(password || "", user.password);

  if (!valid) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role
    }
  });
});

/* ================= CURRENT USER ================= */

app.get("/api/me", auth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/* ================= USERS ================= */

app.get("/api/users", auth, adminOnly, (req, res) => {
  const db = loadDB();

  res.json({
    success: true,
    users: db.users.map(u => ({
      id: u.id,
      username: u.username,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt
    }))
  });
});

/* ================= PRODUCTS ================= */

app.get("/api/products", auth, (req, res) => {
  const db = loadDB();

  res.json({
    success: true,
    products: db.products
  });
});

app.post("/api/products", auth, adminOnly, (req, res) => {
  const { name, category, price, stock } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "Name and price required"
    });
  }

  const db = loadDB();

  const product = {
    id: Date.now(),
    name,
    category: category || "Other",
    price: Number(price),
    stock: Number(stock || 0)
  };

  db.products.push(product);
  saveDB(db);

  res.json({
    success: true,
    product
  });
});

/* ================= TABLES ================= */

app.get("/api/tables", auth, (req, res) => {
  const db = loadDB();

  if (!db.tables.length) {
    for (let i = 1; i <= 18; i++) {
      db.tables.push({
        id: i,
        name: `Table ${i}`,
        occupied: false,
        items: [],
        total: 0
      });
    }

    saveDB(db);
  }

  res.json({
    success: true,
    tables: db.tables
  });
});

app.put("/api/tables/:id", auth, (req, res) => {
  const db = loadDB();

  const table = db.tables.find(
    t => t.id === Number(req.params.id)
  );

  if (!table) {
    return res.status(404).json({
      success: false,
      message: "Table not found"
    });
  }

  table.items = req.body.items || [];

  table.total = table.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.qty),
    0
  );

  table.occupied = table.items.length > 0;

  saveDB(db);

  res.json({
    success: true,
    table
  });
});

/* ================= SALES ================= */

app.get("/api/sales", auth, (req, res) => {
  const db = loadDB();

  res.json({
    success: true,
    sales: db.sales
  });
});

app.post("/api/sales", auth, (req, res) => {
  const {
    type,
    table,
    items,
    discount,
    payment,
    cashAmount
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({
      success: false,
      message: "Bill has no items"
    });
  }

  const db = loadDB();

  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.qty),
    0
  );

  const allowedDiscount =
    req.user.role === "admin"
      ? Math.max(0, Number(discount || 0))
      : 0;

  const finalDiscount = Math.min(
    allowedDiscount,
    subtotal
  );

  const total = subtotal - finalDiscount;

  if (
    payment === "Cash" &&
    Number(cashAmount || 0) < total
  ) {
    return res.status(400).json({
      success: false,
      message: "Cash amount is not enough"
    });
  }

  const billNo =
    "KOT-" + String(db.counter).padStart(4, "0");

  db.counter++;

  const sale = {
    id: Date.now(),
    bill: billNo,
    type: type || "Takeaway",
    table: table || null,
    items,
    subtotal,
    discount: finalDiscount,
    total,
    payment: payment || "Cash",
    cashAmount: Number(cashAmount || 0),
    change:
      payment === "Cash"
        ? Math.max(0, Number(cashAmount || 0) - total)
        : 0,
    cashier: req.user.username,
    date: new Date().toISOString()
  };

  db.sales.push(sale);

  /* STOCK DEDUCTION */
  items.forEach(item => {
    const product = db.products.find(
      p => p.id === item.id
    );

    if (product) {
      product.stock = Math.max(
        0,
        Number(product.stock) - Number(item.qty)
      );
    }
  });

  /* CLEAR TABLE AFTER SETTLEMENT */
  if (table) {
    const tableObj = db.tables.find(
      t => t.id === Number(table)
    );

    if (tableObj) {
      tableObj.items = [];
      tableObj.total = 0;
      tableObj.occupied = false;
    }
  }

  saveDB(db);

  res.json({
    success: true,
    sale
  });
});

/* ================= HEALTH ================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "EASY BILL LK",
    status: "online"
  });
});

/* ================= SPA ================= */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

app.listen(PORT, () => {
  console.log(`EASY BILL LK running on port ${PORT}`);
});