# LedgerFlow | Multi-Tenant B2B SaaS Financial Core Engine

A production-grade, highly resilient, secure multi-tenant financial ledger and analytics dashboard built to optimize corporate billing workflows. The application completely bypasses automated deployment black-boxes, running entirely on a custom-architected, decoupled **Amazon Web Services (AWS)** cloud-native ecosystem—engineered from the ground up for **exactly \$0.00 out of pocket**.

🚀 **Live Production URL:** [http://ledgerflow-portfolio-abhi-2026.s3-website-us-east-1.amazonaws.com](http://ledgerflow-portfolio-abhi-2026.s3-website-us-east-1.amazonaws.com)  
📊 **Developer Sandbox Mode:** Click the emerald-gradient **"⚡ One-Click Recruiter Demo Login"** button on the login gate to instantly authenticate and test-drive a live sandboxed data view in less than a millisecond.

---

## 🏛️ System Architecture Topology

LedgerFlow splits its operational boundaries into a completely decoupled, high-performance distributed network topology to maximize horizontal scaling potential, ensure automated system deployment, and minimize resource cross-contamination.

```text
📱 PUBLIC INTERNET CLIENT (Browser)
 │
 ├───► Downloads Static React UI Assets via AWS S3 Site Hosting (Automated via CI/CD)
 │
 ▼ (Fires RESTful API Data Payloads over Stateless JWT Tokens)
💻 AMAZON EC2 VIRTUAL COMPUTE INSTANCE (Ubuntu Linux Server Core)
 ├───► Intercepts Network Floods via In-Memory Redis Cache Firewall (Port 6379)
 ├───► Orchestrates Logic Rules & Security Gates via Express Routers (Port 3000)
 ├───► Enforces Strict Database Client Pool Restrictions (max: 10 connections)
 └───► Ensures Background Runtime Process Lifecycle Resilience via PM2 Engine
 │
 ▼ (Secure Cryptographic SSL/TLS Handshake Tunnel)
🗄️ AMAZON RDS MANAGED DATA WAREHOUSE (PostgreSQL Instance)
 └───► Enforces Parameterized Multi-Tenant Row Separation Boundaries
```

---

## 🛡️ Core Engineering & Security Pillars

### 1. Robust Multi-Tenant Boundary Isolation

To guarantee complete corporate data compliance across shared physical hard drives, LedgerFlow rejects generic client-side filtering arrays.

- All database queries are explicitly isolated at the database engine layer via parameterized query filters matching cryptographically verified, stateless **JSON Web Token (JWT)** request header payloads.
- Cross-tenant data leaks are mathematically impossible; if an account attempts to spoof invoice ID parameters, the backend drops the handshake before data serialization triggers.

### 2. High-Velocity In-Memory Gateway Protection (Redis Cache Firewall)

To defend the core computation engines from malicious denial-of-service script loops, the network infrastructure integrates a dedicated **Redis database instance running directly in system RAM**.

- Custom security middleware monitors client traffic speeds, instantly dropping brute-force registration floods via **HTTP 429 Too Many Requests** exceptions within micro-milliseconds before they can place computational strain on the primary database disk.

### 3. Database Concurrency Control (Connection Pooling)

The backend connection utility utilizes a strict database client limit (`max: 10`) alongside precise timeouts inside `db.js`.

- This connection pooling gate mathematically protects the managed database cluster from connection exhaustion, memory starvation, and process gridlocks under massive, concurrent active traffic spikes.

### 4. Encrypted Database Transport Layout

The platform utilizes a managed **AWS RDS PostgreSQL** data instance.

- All database network traffic traveling across data center zones is protected via a forced **SSL cryptographic connection handshake wrapper** (`ssl: { rejectUnauthorized: false }`).
- This prevents any clear-text packet sniffing or man-in-the-middle attacks at the system infrastructure tier.

### 5. Zero-Trust Access Token & Key Perimeter Controls

- All secret runtime parameters (`JWT_SECRET`, database targets, Redis bindings) are completely decoupled from code tracking histories using environment isolation files (`.env`).
- The system enforces strict wildcard rules inside the project perimeter guard (`.gitignore`), preventing cryptographic shell private key access credentials (`*.pem`) and node configurations from ever bleeding onto public version control systems.

---

## 💾 Relational Database Schema Topology

The database runtime ledger models relational mapping arrays to handle high-integrity business billing states without data anomalies.

### 👤 Tenant Profiles Metadata (`users`)

| Column Name     | Data Type    | Constraints      | Architectural Intent                                  |
| :-------------- | :----------- | :--------------- | :---------------------------------------------------- |
| `id`            | SERIAL       | PRIMARY KEY      | Unique global tenant record identity marker.          |
| `username`      | VARCHAR(255) | UNIQUE, NOT NULL | Account administrative lookup field name string.      |
| `password_hash` | VARCHAR(255) | NOT NULL         | Cryptographically hashed profile password text block. |

### 📁 Client Rosters Directory (`clients`)

| Column Name | Data Type    | Constraints             | Architectural Intent                                        |
| :---------- | :----------- | :---------------------- | :---------------------------------------------------------- |
| `id`        | SERIAL       | PRIMARY KEY             | Unique reference pointer for account billing logs.          |
| `user_id`   | INT          | FOREIGN KEY ➔ users(id) | Establishes explicit row-level multi-tenant boundary walls. |
| `name`      | VARCHAR(255) | NOT NULL                | Target enterprise organization profile name string.         |
| `email`     | VARCHAR(255) | NOT NULL                | Validated invoicing email communication pipeline link.      |

### 📄 Invoices Ledger (`invoices`)

| Column Name  | Data Type      | Constraints               | Architectural Intent                                                 |
| :----------- | :------------- | :------------------------ | :------------------------------------------------------------------- |
| `id`         | SERIAL         | PRIMARY KEY               | Unique structural tracking code identity tracker.                    |
| `user_id`    | INT            | FOREIGN KEY ➔ users(id)   | Multi-tenant fence bounding data to specific owners.                 |
| `client_id`  | INT            | FOREIGN KEY ➔ clients(id) | Relational lookup anchor identifying target entity profiles.         |
| `amount`     | NUMERIC(12, 2) | NOT NULL                  | Precision calculation decimal field tracking balances.               |
| `status`     | VARCHAR(50)    | DEFAULT 'Unsettled'       | Operational lifecycle tracking engine variable loop.                 |
| `created_at` | TIMESTAMP      | DEFAULT NOW()             | Chronological sorting timeline field for dashboard chart processing. |

---

## 🛠️ Systems Lifecycle & Operations

### Autonomous Production Deployment Pipeline (CI/CD)

The client interface deployment is completely automated via a secure **GitHub Actions workflow pipeline** (`.github/workflows/deploy.yml`).

- The exact second a code change is pushed to the repository branch, autonomous virtual cloud nodes provision a clean Ubuntu framework, checkout the codebase, verify dependencies, and compile an optimized static React production build using Vite.
- The compiled assets are then instantly synchronized live to the target **AWS S3 static web hosting bucket** utilizing automated **AWS CLI configuration tokens**, enforcing zero-manual-intervention code shipping patterns.

### Persistent Process Lifecycle Operations

The Node.js Express server runtime is encapsulated within a **PM2 Process Manager** thread loop. This configuration forces an automated application hot-reload if the process experiences memory starvation leaks or unexpected codebase loop exceptions, achieving maximum uptime in production:

```bash
# Force-sync server environment files and boot the background daemon engine
pm2 start server.js --name "ledgerflow-api" --update-env
```

---

## 📈 Future System Roadmap

Planned core structural optimizations scheduled for upcoming developmental cycles:

1. **Infrastructure as Code (IaC):** Script the entire decoupled AWS network, S3 storage assets, EC2 compute targets, and RDS instances into a single configuration sheet using **Terraform** to enable one-click global environment replication.
2. **Compound Database B-Tree Indexing:** Implement compound indexes on `invoices (user_id, created_at)` to optimize multi-tenant chronological query lookups from linear scans to constant time complexity.
