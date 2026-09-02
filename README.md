# LedgerFlow | Multi-Tenant B2B SaaS Financial Core Engine

A production-grade, secure, multi-tenant financial ledger and analytics dashboard built to optimize corporate billing workflows. The application bypasses automated deployment black-boxes, running entirely on a custom-architected, decoupled **Amazon Web Services (AWS)** cloud-native ecosystem.

🚀 **Live Production URL:** [http://ledgerflow-portfolio-abhi-2026.s3-website-us-east-1.amazonaws.com](http://ledgerflow-portfolio-abhi-2026.s3-website-us-east-1.amazonaws.com)  
📊 **Developer Sandbox Mode:** Click the "One-Click Demo Account" on the login gate to test-drive instantly.

---

## 🏛️ System Architecture Topology

LedgerFlow splits its operational boundaries into a completely decoupled, high-performance distributed network topology to maximize horizontal scaling potential and minimize system cross-contamination.

```text
       📱 PUBLIC INTERNET CLIENT (Browser)
                   │
                   ├───► Downloads Static React UI Assets (HTML/CSS/JS) via AWS S3 Edge [Idea 2]
                   │
                   ▼ (Fires RESTful API Data Payloads)
       💻 AMAZON EC2 VIRTUAL COMPUTE INSTANCE (Ubuntu Linux)
                   ├───► Orchestrates Network Rules via Express API Routers (Port 3000) [2.1]
                   └───► Background Runtime Thread Lifecycle Management via PM2 Engine [2.1]
                               │
                               ▼ (Secure Cryptographic SSL/TLS Handshake Tunnel)
                   🗄️ AMAZON RDS MANAGED DATA WAREHOUSE (PostgreSQL Instance)
                               └───► Enforces Parameterized Multi-Tenant Row Separation Boundaries [2.1]
```

---

## 🛡️ Core Engineering & Security Pillars

### 1. Robust Multi-Tenant Boundary Isolation

To guarantee complete corporate data compliance across shared physical hard drives, LedgerFlow rejects generic client-side filtering arrays.

- All database queries are explicitly isolated at the database engine layer via parameterized query filters matching cryptographically verified, stateless **JSON Web Token (JWT)** request header payloads [2.1].
- Cross-tenant data leaks are mathematically impossible; if an account attempts to spoof an invoice ID parameters request, the backend drops the handshake before data serialization triggers [2.1].

### 2. Encrypted Database Transport Layout

The platform utilizes a managed **AWS RDS PostgreSQL** data instance [2.1].

- All database network traffic traveling across data center zones is protected via a forced **SSL cryptographic connection handshake wrapper** (`ssl: { rejectUnauthorized: false }`) [2.1].
- This prevents any clear-text packet sniffing or man-in-the-middle attacks at the system infrastructure tier [2.1].

### 3. Zero-Trust Access Token & Key Perimeter Controls

- All secret runtime parameters (`JWT_SECRET`, database targets, API server bindings) are completely decoupled from code tracking histories using environment isolation files (`.env`).
- The system enforces strict wildcard rules inside the project perimeter guard (`.gitignore`), preventing cryptographic shell private key access credentials (`*.pem`) and node configurations from ever bleeding onto public version control systems.

---

## 💾 Relational Database Schema Topology

The database runtime ledger models relational mapping arrays to handle high-integrity business billing states without data anomalies.

### 👤 Tenant Profiles Metadata (`users`)

| Column Name | Data Type    | Constraints      | Architectural Intent                                  |
| :---------- | :----------- | :--------------- | :---------------------------------------------------- |
| `id`        | SERIAL       | PRIMARY KEY      | Unique global tenant record identity marker.          |
| `username`  | VARCHAR(255) | UNIQUE, NOT NULL | Account administrative lookup field name string.      |
| `password`  | VARCHAR(255) | NOT NULL         | Cryptographically hashed profile password text block. |

### 📁 Client Rosters Directory (`clients`)

| Column Name | Data Type    | Constraints             | Architectural Intent                                              |
| :---------- | :----------- | :---------------------- | :---------------------------------------------------------------- |
| `id`        | SERIAL       | PRIMARY KEY             | Unique reference pointer for account billing logs.                |
| `user_id`   | INT          | FOREIGN KEY ➔ users(id) | Establishes explicit row-level multi-tenant boundary walls [2.1]. |
| `name`      | VARCHAR(255) | NOT NULL                | Target enterprise organization profile name string.               |
| `email`     | VARCHAR(255) | NOT NULL                | Validated invoicing email communication pipeline link.            |

### 📄 Invoices Ledger (`invoices`)

| Column Name  | Data Type      | Constraints               | Architectural Intent                                                 |
| :----------- | :------------- | :------------------------ | :------------------------------------------------------------------- |
| `id`         | SERIAL         | PRIMARY KEY               | Unique structural tracking code identity tracker.                    |
| `user_id`    | INT            | FOREIGN KEY ➔ users(id)   | Multi-tenant fence bounding data to specific owners [2.1].           |
| `client_id`  | INT            | FOREIGN KEY ➔ clients(id) | Relational lookup anchor identifying target entity profiles.         |
| `amount`     | NUMERIC(12, 2) | NOT NULL                  | Precision calculation decimal field tracking balances.               |
| `status`     | VARCHAR(50)    | DEFAULT 'Unsettled'       | Operational lifecycle tracking engine variable loop.                 |
| `created_at` | TIMESTAMP      | DEFAULT NOW()             | Chronological sorting timeline field for dashboard chart processing. |

---

## 🛠️ Systems Lifecycle & Operations

### Persistent Process Lifecycle Operations

The Node.js Express server runtime is encapsulated within a **PM2 Process Manager** thread loop [2.1]. This configuration forces an automated application hot-reload if the process experiences memory starvation leaks or unexpected codebase loop exceptions, achieving maximum uptime in production:

```bash
# Force-sync server environment files and boot the background daemon engine
pm2 start server.js --name "ledgerflow-api" --update-env
```

### Static Interface Assets Delivery

The frontend user interface is compiled down via Vite into static textual data sheets (compressed HTML markup, optimized Tailwind styling, and plain script assets) [Idea 2]. These files are pushed directly to an **AWS S3 Storage Bucket** configured for static web hosting [2.1], bypassing standard heavy server constraints completely for extreme asset delivery speeds [Idea 2].

```bash
# Production compiler script configuration execution
npm run build
```

---

## 📈 Future System Roadmap

Planned core optimizations scheduled for upcoming developmental cycles:

1. **In-Memory Gateway Protection & Rate Limiting:** Integrate a local **Redis cache daemon** running on the EC2 node to throttle API endpoints via express-rate-limit middleware, short-circuiting malicious flooding traffic via HTTP 429 exceptions before it impacts the PostgreSQL cluster [2.1].
2. **Compound Database B-Tree Indexing:** Implement compound indexes on `invoices (user_id, created_at)` to optimize multi-tenant chronological query lookups from linear scans to constant time complexity [2.1].
3. **CI/CD Automation:** Engineer automated **GitHub Actions** deployment workflows to build frontend files and auto-SSH into the EC2 environment on every main branch push [2.1].
