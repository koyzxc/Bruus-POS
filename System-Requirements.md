# BRUUS Coffee Shop POS - System Requirements

## 📱 Hardware Requirements

### **a) POS Terminals/Tablets with Touchscreens**
- **iPad 10th Generation** (Primary Recommendation)
  - 10.9-inch Liquid Retina touchscreen display
  - A14 Bionic chip or newer for smooth performance
  - 64GB storage minimum (128GB recommended for extended use)
  - Wi-Fi + Cellular capability for connectivity redundancy
  - Touch ID or Face ID for secure access
  - Battery life: 10+ hours for full-day operation
  - Drop protection case recommended for coffee shop environment

### **Alternative Tablet Options**
- **iPad 9th Generation** (Budget Option)
  - 10.2-inch Retina display
  - A13 Bionic chip (sufficient for POS operations)
  - 64GB storage minimum
- **Samsung Galaxy Tab A8** (Android Alternative)
  - 10.5-inch touchscreen
  - Compatible web browser required

### **Network Infrastructure**
- **Primary Internet Connection**
  - Fiber/DSL: 25 Mbps download / 5 Mbps upload (minimum)
  - Business-grade connection recommended for stability
- **Backup Connectivity**
  - Mobile hotspot device with unlimited data plan
  - Cellular data capability on tablets
- **Wi-Fi Equipment**
  - Business-grade Wi-Fi 6 router
  - WPA3 security protocol
  - Coverage for entire coffee shop area

### **Optional Hardware (Recommended)**
- **Receipt Printer**: Thermal printer (Bluetooth/USB compatible)
- **Cash Drawer**: Electronic cash drawer with security lock
- **Barcode Scanner**: For inventory management (if needed)
- **External Battery Pack**: For extended operation during power outages
- **Payment Terminal**: For card payments integration (future)

---

## 💻 Software Requirements

### **b) Operating System & Browser**
- **iPadOS 15.0** or later (recommended: iPadOS 16+)
- Automatic system updates enabled for security
- **Safari browser** (latest version) - primary browser
- **Chrome/Firefox** (alternative browsers for compatibility)

### **Core Technologies Stack**
- **Frontend**: React.js (responsive UI)
  - TypeScript for type safety
  - Modern JavaScript (ES6+)
- **Backend**: Node.js + Express.js
  - RESTful API architecture
  - Session-based authentication
- **Database**: PostgreSQL with MySQL compatibility
  - Real-time data synchronization
  - Offline SQLite backup capability
- **Cloud Storage**: AWS S3 (or similar) for product images

### **Required Browser Features**
- JavaScript enabled (essential)
- Local storage support (for offline mode)
- Touch event support (for tablet interaction)
- Cookie support (for user sessions)
- HTTPS/SSL support (for secure connections)

---

## 🗄️ Database Requirements

### **c) Database Structure & Tables**
- **Primary Database**: PostgreSQL 14+ (MySQL compatible)
  - Cloud-hosted (recommended: Neon, AWS RDS, or similar)
  - SSL/TLS encryption required
  - Connection pooling enabled
  - Automatic daily backups minimum

### **Required Database Tables**
- **Users Table**: UserID, Role, Password (hashed)
  - Supports Owner and Barista roles
  - Secure password hashing (bcrypt)
- **Products Table**: ProductID, Name, Price, ImageURL, SizeOptions
  - Support for Medium (M) and Large (L) sizes
  - Price in Philippine Pesos (₱)
  - Category classification (COFFEE, PASTRY, etc.)
- **Sales Table**: SaleID, ProductID, Quantity, Timestamp
  - Transaction tracking with timestamps
  - Link to user who processed the sale
- **Inventory Table**: ItemID, CurrentStock, MinimumThreshold
  - Real-time stock tracking
  - Automatic low-stock alerts
  - Unit measurements (ml, g, kg, pc, oz)

### **Database Performance Specifications**
- **Storage**: 10GB minimum (50GB recommended for growth)
- **Memory**: 2GB RAM minimum for optimal performance
- **Connections**: Support 100 concurrent connections
- **Response Time**: <100ms query response time
- **Backup**: Local SQLite for offline operation (1GB allocation)

---

## 🔒 Security Requirements

### **Data Protection**
- HTTPS/TLS 1.3 encryption for all communications
- Password hashing with bcrypt
- Session management with secure cookies
- Role-based access control (Owner/Barista)

### **Network Security**
- Firewall configuration
- VPN access for remote management (optional)
- Regular security updates

---

## ⚡ Performance Requirements

### **System Performance**
- **Response Time**: <2 seconds for all operations
- **Uptime**: 99.9% availability target
- **Concurrent Users**: Support 3-5 simultaneous users
- **Transaction Volume**: 50+ orders per hour capacity

### **Offline Capability**
- Continue operations without internet for up to 4 hours
- Automatic sync when connection restored
- Local data storage for critical operations

---

## 🌐 Network Requirements

### **Internet Connectivity**
- **Minimum**: 10 Mbps shared connection
- **Recommended**: Dedicated 25 Mbps connection
- **Backup**: 4G/5G cellular with unlimited data plan
- **Latency**: <100ms to database server

### **Local Network**
- Wi-Fi 6 (802.11ax) router
- WPA3 security protocol
- Guest network separation (optional)

---

## 💰 Estimated Costs (Monthly)

### **Cloud Services**
- Database hosting: ₱1,500 - ₱3,000
- Internet connection: ₱2,000 - ₱4,000
- Cloud storage/backup: ₱500 - ₱1,000

### **One-time Hardware**
- iPad 10: ₱25,000 - ₱35,000
- Receipt printer: ₱8,000 - ₱15,000
- Cash drawer: ₱5,000 - ₱10,000
- Network equipment: ₱3,000 - ₱8,000

---

## ✅ Minimum vs Recommended

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Device** | iPad 9th Gen | iPad 10th Gen |
| **Storage** | 64GB | 128GB |
| **Internet** | 10 Mbps | 25 Mbps |
| **Database** | 10GB | 50GB |
| **Backup** | Daily | Real-time sync |

---

*Simple, reliable, and cost-effective for Philippine coffee shop operations! ☕*