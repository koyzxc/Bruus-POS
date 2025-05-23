# BRUUS Coffee Shop POS System - Complete Documentation

## I. INTRODUCTION

### A. OVERVIEW OF THE PROJECT

The **BRUUS Unified POS and Inventory Platform** is a modern, iPad-optimized solution designed specifically for Philippine coffee shops. Built with offline-first architecture, it streamlines operations by unifying sales processing, real-time inventory tracking, and automated alerts while supporting Philippine Peso (₱) transactions.

#### PROBLEM STATEMENT
The current coffee shop POS systems suffer from critical inefficiencies:
- **Weak security** with no role-based access, allowing unauthorized personnel to view sensitive data
- **Manual inventory tracking**, leading to errors and delays in restocking
- **No low-stock alerts**, risking ingredient shortages during peak hours
- **Poor mobile optimization**, causing operational delays on tablet devices
- **Inability to track sales analytics** by product or identify non-selling items
- **System instability** (crashes, lagging), disrupting order processing
- **No offline capability**, failing during internet outages

### a. OBJECTIVES OF THE STUDY
The BRUUS system aims to:
- **Implement role-based access control** (Owner/Barista) to secure sensitive data
- **Automate real-time inventory updates** with low-stock alerts
- **Provide comprehensive sales analytics** (daily/weekly reports by product)
- **Design a stable, iPad-optimized interface** with intuitive touch controls
- **Enable offline operation** with automatic sync when reconnected
- **Support Philippine Peso pricing** with realistic ₱100-150 product ranges

### b. SCOPE AND LIMITATIONS

**Scope:**
- Complete POS system with order processing and role-based authentication
- Advanced inventory management with automated alerts and real-time updates
- Sales analytics dashboard with product performance insights
- iPad 10-optimized responsive design
- Hybrid online/offline data synchronization
- Philippine market localization (₱ currency, local business workflows)

**Limitations:**
- Does not include direct supplier ordering (alerts only)
- Limited to coffee shop menu items (no complex restaurant features)
- Offline mode delays real-time sync until reconnection
- Single-location support (not multi-branch)

---

## B. PROJECT BACKGROUND

### a. DESCRIPTION OF THE PROJECT DOMAIN

The Philippine coffee shop industry relies heavily on efficient POS systems to manage high transaction volumes and dynamic inventory needs. Small to medium coffee shops often struggle with outdated systems, leading to operational bottlenecks, financial inaccuracies, and customer dissatisfaction. BRUUS targets Filipino coffee shop owners seeking modern, cost-effective solutions optimized for local operations.

### b. CURRENT SYSTEM ANALYSIS

**Existing system problems:**
- Lacks role-based security, exposing financial data to all staff
- Requires manual inventory input, increasing human error risk
- Provides no low-stock notifications or sales analytics
- Uses desktop-only interfaces, incompatible with mobile/tablet workflow
- Suffers from frequent crashes and performance issues
- No offline capability, causing complete shutdowns during connectivity issues

### c. JUSTIFICATION OF THE PROPOSED SYSTEM

**BRUUS addresses these gaps by:**
- **Enhanced security** through role-based access (Owner/Barista roles)
- **Automated inventory management** with real-time updates and smart alerts
- **Actionable business insights** via comprehensive sales analytics
- **iPad-first design** optimized for touch interaction and coffee shop workflows
- **Offline-first architecture** ensuring continuous operation during outages
- **Philippine market focus** with ₱ currency support and local pricing optimization
- **Cost-effective solution** reducing operational overhead and improving profitability

---

## II. STAKEHOLDER AND USER ANALYSIS

### A. USER PERSONAS

#### 1. Coffee Shop Owner (jec)
- **Goals:** Secure system oversight, real-time inventory tracking, comprehensive sales analytics, automated business alerts
- **Behaviors:** Monitors daily sales, manages staff permissions, reviews performance reports, makes strategic decisions
- **Pain Points:** Weak security exposing sensitive data, manual inventory causing errors, lack of business insights
- **BRUUS Solutions:** Admin dashboard, user management, sales analytics, automated low-stock alerts

#### 2. Barista Staff
- **Goals:** Efficient order processing, intuitive interface, reliable system performance
- **Behaviors:** Processes customer orders, manages product inventory, uses POS throughout busy periods
- **Pain Points:** System crashes during peak hours, complex interfaces slowing service, manual inventory updates
- **BRUUS Solutions:** Touch-optimized interface, automatic inventory deduction, offline capability

### B. STAKEHOLDER IDENTIFICATION

| Stakeholder | Interest in BRUUS Project |
|-------------|---------------------------|
| **Coffee Shop Owner** | Secure system, automated inventory, business analytics, cost reduction |
| **Barista Staff** | Stable POS, intuitive interface, reduced manual work, faster service |
| **Customers** | Faster service, accurate orders, consistent experience |
| **Business Partners** | Reliable order processing, inventory visibility |

### C. USER STORIES AND REQUIREMENTS

#### 1. USER STORIES

**Owner Stories:**
- As an owner, I want role-based access control so only I can view sensitive financial data and manage users
- As an owner, I want automated low-stock alerts so I can reorder ingredients before running out
- As an owner, I want daily/weekly sales reports by product so I can optimize my menu offerings
- As an owner, I want to track non-selling products so I can make data-driven menu decisions
- As an owner, I want offline capability so my business continues during internet outages

**Barista Stories:**
- As a barista, I want a stable POS system so orders process quickly without crashes
- As a barista, I want touch-friendly buttons optimized for iPad so I can work efficiently
- As a barista, I want automatic inventory updates so I don't have to manually track stock
- As a barista, I want the system to work offline so service continues during connectivity issues

#### 2. FUNCTIONAL REQUIREMENTS
- **Authentication:** Role-based access (Owner/Barista) with secure login
- **Product Management:** Image upload, size options (M/L), Philippine Peso pricing
- **Order Processing:** Touch-optimized interface, automatic calculations, receipt generation
- **Inventory Management:** Real-time stock tracking, automatic deduction, low-stock alerts
- **Sales Analytics:** Product performance tracking, daily/weekly reports, non-selling item identification
- **Offline Capability:** Local data storage, automatic sync when reconnected

#### 3. NON-FUNCTIONAL REQUIREMENTS
- **Performance:** Handle 50+ concurrent transactions without lag
- **Security:** Encrypted data, HTTPS communications, secure password hashing
- **Usability:** Intuitive iPad interface, <2 taps for common tasks
- **Reliability:** 99.9% uptime, automatic crash recovery, offline resilience
- **Scalability:** Support small to medium coffee shop operations
- **Localization:** Philippine Peso currency, local business workflows

---

## III. SYSTEM REQUIREMENTS

### A. HARDWARE REQUIREMENTS

#### Primary Device:
- **iPad 10th Generation** (recommended)
  - 10.9-inch Liquid Retina touchscreen
  - A14 Bionic chip or newer
  - 64GB storage minimum (128GB recommended)
  - Wi-Fi + Cellular capability
  - 10+ hour battery life
  - Drop protection case for coffee shop environment

#### Network Infrastructure:
- **Primary Connection:** Fiber/DSL 25 Mbps down / 5 Mbps up
- **Backup Connection:** Mobile hotspot with unlimited data
- **Wi-Fi Equipment:** Business-grade router with WPA3 security

#### Optional Hardware:
- Thermal receipt printer (Bluetooth compatible)
- Electronic cash drawer with security lock
- Barcode scanner for inventory management

### B. SOFTWARE REQUIREMENTS

#### Core Technology Stack:
- **Frontend:** React 18 + TypeScript for type-safe, responsive UI
- **Backend:** Node.js 18+ with Express.js framework
- **Database:** PostgreSQL (primary) + SQLite (offline backup)
- **Authentication:** Passport.js with session management
- **ORM:** Drizzle ORM for type-safe database operations
- **Styling:** Tailwind CSS for iPad-optimized responsive design

#### Operating System:
- **iPadOS 15.0+** (recommended: iPadOS 16+)
- **Safari browser** (primary) with modern JavaScript support
- Touch event support for tablet interaction
- Local storage for offline capability

### C. DATABASE REQUIREMENTS

#### Database Architecture:
- **Primary:** PostgreSQL 14+ (cloud-hosted via Neon)
- **Backup:** Local SQLite for offline operations
- **Storage:** 10GB minimum (50GB recommended)
- **Performance:** <100ms query response time

#### Required Tables:
- **Users:** UserID, Username, Role (Owner/Barista), Password (hashed)
- **Products:** ProductID, Name, Price (₱), Category, Size (M/L), ImageURL
- **Orders:** OrderID, OrderNumber, Total, AmountPaid, Change, UserID, Timestamp
- **OrderItems:** ItemID, OrderID, ProductID, Quantity, Price, Size
- **Inventory:** ItemID, Name, CurrentStock, MinimumStock, Unit (ml, g, kg, pc)
- **Categories:** CategoryID, Name, DisplayOrder

---

## IV. SYSTEM ARCHITECTURE

### A. High-Level Architecture

#### 1. Frontend Layer (React + TypeScript)
- **POS Interface:** Touch-optimized order processing
- **Admin Dashboard:** User management and system settings
- **Analytics Dashboard:** Sales reports and inventory insights
- **Responsive Design:** iPad 10-optimized layouts

#### 2. Backend Layer (Node.js + Express)
- **RESTful API:** Handles all business logic and data operations
- **Authentication:** Role-based access with Passport.js
- **Real-time Updates:** Automatic inventory synchronization
- **Offline Support:** Local SQLite with automatic sync

#### 3. Database Layer
- **PostgreSQL:** Primary cloud database for reliability
- **SQLite:** Local backup ensuring offline capability
- **Drizzle ORM:** Type-safe database operations
- **Automatic Sync:** Seamless online/offline transitions

### B. Key Features Implementation

#### 1. Role-Based Authentication
- **Owner (jec):** Full administrative access, user management, analytics
- **Barista:** Order processing, basic inventory management
- **Secure Sessions:** bcrypt password hashing, secure cookies

#### 2. Inventory Management
- **Real-time Tracking:** Automatic stock deduction with each order
- **Low-Stock Alerts:** Configurable minimum thresholds
- **Multi-unit Support:** ml, g, kg, pc, oz measurements
- **Ingredient Tracking:** Product recipes with usage calculations

#### 3. Sales Analytics
- **Product Performance:** Daily/weekly sales by item
- **Size Analysis:** Medium vs Large sales comparison
- **Revenue Tracking:** Philippine Peso totals and trends
- **Non-selling Identification:** Items with low/zero sales

#### 4. Offline Capability
- **Local SQLite:** Continues operations without internet
- **Automatic Sync:** Updates cloud database when reconnected
- **Data Integrity:** Prevents data loss during outages

---

## V. DEVELOPMENT METHODOLOGY

### A. Technology Stack Justification

**Frontend: React + TypeScript**
- Component-based architecture for maintainable code
- TypeScript provides type safety reducing runtime errors
- Excellent iPad touch support and responsive capabilities

**Backend: Node.js + Express**
- JavaScript full-stack development efficiency
- Excellent package ecosystem and community support
- RESTful API design for clean separation of concerns

**Database: PostgreSQL + SQLite**
- PostgreSQL for robust cloud data management
- SQLite for reliable offline operations
- Drizzle ORM for type-safe database interactions

### B. Philippine Market Optimization

**Currency Support:**
- Native Philippine Peso (₱) formatting
- Realistic pricing in ₱100-150 range
- Accurate change calculation and display

**Local Business Workflows:**
- Cash-heavy transaction support
- Receipt printing for customer records
- Inventory management suited to local supply chains

---

## VI. CONCLUSION

The **BRUUS Coffee Shop POS System** represents a modern, comprehensive solution specifically designed for Philippine coffee shop operations. By combining robust functionality with iPad-optimized design, offline capability, and local market focus, BRUUS addresses the critical pain points of existing systems while providing a scalable platform for business growth.

**Key Achievements:**
- ✅ Secure role-based access protecting sensitive data
- ✅ Automated inventory management reducing operational overhead
- ✅ Comprehensive sales analytics enabling data-driven decisions
- ✅ iPad-first design optimizing staff productivity
- ✅ Offline-first architecture ensuring business continuity
- ✅ Philippine market localization with ₱ currency support

BRUUS positions coffee shop owners for success in the competitive Philippine market through technology that enhances efficiency, reduces costs, and improves customer service quality.

---

*Built with modern web technologies for reliable, scalable coffee shop operations in the Philippines. ☕*