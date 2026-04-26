# 📈 StockHUB — Minimal Stack, Real Power

StockHUB is a **full-stack stock management system** that demonstrates how a clean architecture + solid database design can turn a simple CRUD application into a **functional, real-world web app**.

Built using a minimal tech stack, the project focuses on **clarity, efficiency, and database-driven design** rather than unnecessary complexity.

---

## ✨ Why This Project Stands Out

Most CRUD apps stop at “it works.”
This one goes a step further:

* ⚡ Real-time UI updates after every operation
* 📊 Data visualization (sector-wise stock distribution)
* 🧠 Thoughtful database usage with structured schema
* 🔄 Clean REST API design
* 📦 Preloaded dataset simulating real stock portfolios

👉 It shows how **PostgreSQL + simple Node backend** can power meaningful applications.

---

## 🧩 Core Functionality (CRUD Done Right)

* ➕ **Create** — Add stocks with name, sector, price, and quantity
* 📋 **Read** — View all stocks in a structured, sortable table
* ✏️ **Update** — Modify stock details dynamically
* ❌ **Delete** — Remove stocks instantly
* 🔄 **Live Refresh** — UI updates immediately after every operation

From your report screenshots (Insert, Delete, Update views), the system maintains **consistent state between UI and database** .

---

## 📊 Data Visualization Layer

Beyond CRUD, the app introduces **basic analytics**:

* 📌 Pie chart showing **stock distribution by sector**
* Helps visualize portfolio composition at a glance

As shown in your report (page 3), this adds a **decision-making layer** on top of raw CRUD operations .

---

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* Vanilla JavaScript

### Backend

* Node.js
* Express.js (REST API)

### Database

* PostgreSQL

---

## 🗄️ Database Design Philosophy

Instead of treating DB as storage only, this project uses PostgreSQL as a **core system component**:

* Structured schema with typed fields
* Auto table creation on server startup
* Persistent storage across sessions
* Preloaded dataset of 15 major companies:

  * Apple, Microsoft, Tesla, Amazon, Google, Meta, Nvidia
  * JPMorgan, Berkshire Hathaway, Coca-Cola, Visa
  * Walmart, Johnson & Johnson, Chevron, Samsung 

👉 This simulates a **real stock portfolio environment**, not just dummy inputs.

---

## 📁 Project Structure

```bash
stockHUB/
│── public/            # Frontend (UI + scripts)
│── db.js              # PostgreSQL connection
│── server.js          # API routes & server logic
│── sqlCURD.sql        # Schema + queries
│── package.json
│── .gitignore
```

---

## ⚙️ How It Works (Flow)

1. User interacts with UI (Add / Edit / Delete)
2. Request sent via JavaScript → Express API
3. Express processes request → PostgreSQL query
4. Database updates data
5. Updated data sent back → UI refreshes instantly

👉 Clean **frontend → API → database → UI loop**

---

## 🚀 Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/your-username/stockHUB.git
cd stockHUB
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup PostgreSQL

```bash
psql -U your_user -d your_db -f sqlCURD.sql
```

### 4. Configure DB (db.js)

```js
const pool = new Pool({
  user: "your_user",
  host: "localhost",
  database: "your_db",
  password: "your_password",
  port: 5432,
});
```

### 5. Run Server

```bash
node server.js
```

Visit:

```
http://localhost:3000
```

---

## 🔌 API Overview

| Method | Route       | Purpose          |
| ------ | ----------- | ---------------- |
| GET    | /stocks     | Fetch all stocks |
| POST   | /stocks     | Add stock        |
| PUT    | /stocks/:id | Update stock     |
| DELETE | /stocks/:id | Delete stock     |

---

## 🎯 Key Takeaway

This project proves:

> You don’t need complex frameworks to build impactful applications.
> A strong foundation in **CRUD + database design + clean API flow** is enough.

---

## 🔮 Future Enhancements

* 🔐 Authentication (JWT)
* 📈 Advanced analytics (profit/loss tracking)
* 🌐 Deployment (Render / Railway)
* 📊 Filtering, sorting, pagination
* 🧪 Testing (Jest / Supertest)

---

## 👨‍💻 Author

Vedant Palande

---

## 📄 License

MIT License
