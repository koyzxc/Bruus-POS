# Coffee Shop POS System - Process Flowcharts

## System Process Flow with Decision Points

### 1. User Authentication & Access Control Flow

```mermaid
flowchart TD
    A([🔐 Start: User Login]) --> B[Enter Username & Password]
    B --> C{Valid Credentials?}
    
    C -->|❌ No| D[❌ Display Error Message]
    D --> B
    
    C -->|✅ Yes| E{Check User Role}
    
    E -->|👑 Owner| F[🎯 Full Admin Access]
    E -->|☕ Barista| G[📱 Operational Access]
    
    F --> H[Dashboard with Admin Controls]
    G --> I[Dashboard with Basic Controls]
    
    H --> J{Select Action}
    I --> K{Select Action}
    
    J -->|👥 User Management| L[Manage User Accounts]
    J -->|📊 Sales Analytics| M[View Detailed Reports]
    J -->|🗑️ Delete Items| N[Delete Products/Inventory]
    J -->|🛒 Process Orders| O[Standard Order Flow]
    
    K -->|🛒 Process Orders| O[Standard Order Flow]
    K -->|📦 View Inventory| P[View Inventory Status]
    K -->|🚨 Low Stock Alerts| Q[Check Alert Notifications]
    
    L --> R[✅ Account Management Complete]
    M --> S[✅ Analytics Generated]
    N --> T[✅ Items Deleted]
    O --> U[Continue to Order Process]
    P --> V[✅ Inventory Reviewed]
    Q --> W[✅ Alerts Acknowledged]
    
    R --> X([🔚 End Process])
    S --> X
    T --> X
    V --> X
    W --> X
    
    U --> Y[📋 Go to Order Processing Flow]
```

### 2. Order Processing & Payment Flow

```mermaid
flowchart TD
    A([🛒 Start: Order Processing]) --> B[Select Product Category]
    B --> C[Display Available Products]
    C --> D[Select Product & Size]
    
    D --> E{Check Stock Availability}
    E -->|❌ Insufficient Stock| F[⚠️ Show Stock Alert]
    F --> G[Suggest Alternative Products]
    G --> D
    
    E -->|✅ Stock Available| H[Add Product to Cart]
    H --> I{Add More Items?}
    
    I -->|Yes| D
    I -->|No| J[📊 Calculate Total Amount]
    
    J --> K[Display Cart Summary]
    K --> L{Proceed to Payment?}
    
    L -->|❌ No - Edit Cart| M[Remove/Modify Items]
    M --> I
    
    L -->|✅ Yes| N[💰 Enter Payment Amount]
    N --> O{Payment >= Total?}
    
    O -->|❌ Insufficient| P[❌ Display Insufficient Funds]
    P --> N
    
    O -->|✅ Sufficient| Q[Calculate Change]
    Q --> R[Process Payment]
    R --> S[🎫 Generate Order Number]
    
    S --> T[📋 Create Order Record]
    T --> U[⚡ Update Inventory Automatically]
    U --> V{Check Low Stock Levels}
    
    V -->|🚨 Below Minimum| W[🔔 Trigger Low Stock Alert]
    V -->|✅ Stock OK| X[Continue Process]
    
    W --> X
    X --> Y[🧾 Generate Receipt]
    Y --> Z[📱 Display Order Summary]
    Z --> AA([✅ Order Complete])
```

### 3. Inventory Management & Restocking Flow

```mermaid
flowchart TD
    A([📦 Start: Inventory Management]) --> B{User Role Check}
    
    B -->|👑 Owner| C[Full Inventory Access]
    B -->|☕ Barista| D[View-Only Access]
    
    C --> E[View All Inventory Items]
    D --> F[View Current Stock Levels]
    
    E --> G{Select Action}
    F --> H[📊 Monitor Stock Status]
    
    G -->|➕ Add New Item| I[Create New Inventory Item]
    G -->|📈 Restock Item| J[Select Item to Restock]
    G -->|✏️ Edit Item| K[Modify Item Details]
    G -->|🗑️ Delete Item| L{Confirm Deletion}
    
    I --> M[Enter Item Details]
    M --> N[Set Container Type & Units]
    N --> O[Set Minimum Stock Level]
    O --> P[💾 Save New Item]
    
    J --> Q[Enter Restock Quantity]
    Q --> R[Specify Container Amount]
    R --> S[🧮 Calculate Total Stock]
    S --> T[Update Stock Levels]
    
    K --> U[Modify Existing Details]
    U --> V[💾 Update Item Information]
    
    L -->|❌ Cancel| G
    L -->|✅ Confirm| W[🗑️ Remove Item from System]
    
    P --> X[✅ Item Added Successfully]
    T --> Y{Stock Above Minimum?}
    V --> Z[✅ Item Updated]
    W --> AA[✅ Item Deleted]
    
    Y -->|✅ Yes| BB[🔕 Remove Low Stock Alert]
    Y -->|❌ No| CC[🚨 Maintain Alert Status]
    
    BB --> DD[📊 Update Inventory Display]
    CC --> DD
    
    H --> EE{Low Stock Detected?}
    EE -->|🚨 Yes| FF[🔔 Display Alert Notifications]
    EE -->|✅ No| GG[Continue Monitoring]
    
    FF --> HH[📋 Review Items Needing Restock]
    
    X --> II([🔚 End Process])
    Z --> II
    AA --> II
    DD --> II
    GG --> II
    HH --> II
```

### 4. Product Management Flow

```mermaid
flowchart TD
    A([🍕 Start: Product Management]) --> B{Owner Access Check}
    
    B -->|❌ Not Owner| C[❌ Access Denied]
    C --> D([🔚 End: Unauthorized])
    
    B -->|✅ Owner| E{Select Action}
    
    E -->|➕ Add Product| F[Enter Product Details]
    E -->|✏️ Edit Product| G[Select Existing Product]
    E -->|🗑️ Delete Product| H[Select Product to Delete]
    
    F --> I[Set Product Name & Category]
    I --> J[Set Pricing for Sizes]
    J --> K[Upload Product Image]
    K --> L[⚙️ Configure Ingredients]
    
    L --> M{Add Ingredients?}
    M -->|✅ Yes| N[Select Inventory Items]
    N --> O[Set Quantity per Size]
    O --> P{Add More Ingredients?}
    
    P -->|Yes| N
    P -->|No| Q[💾 Save Product]
    
    M -->|❌ No| Q
    
    G --> R[Load Current Product Data]
    R --> S[Modify Product Details]
    S --> T{Update Ingredients?}
    
    T -->|✅ Yes| U[⚙️ Modify Ingredient List]
    U --> V[💾 Update Product]
    
    T -->|❌ No| V
    
    H --> W{Confirm Product Deletion?}
    W -->|❌ Cancel| E
    W -->|✅ Confirm| X[🗑️ Remove Product]
    
    X --> Y{Product in Active Orders?}
    Y -->|✅ Yes| Z[⚠️ Mark as Deleted - Keep History]
    Y -->|❌ No| AA[🗑️ Permanently Delete]
    
    Q --> BB[✅ Product Created]
    V --> CC[✅ Product Updated]
    Z --> DD[✅ Product Archived]
    AA --> EE[✅ Product Removed]
    
    BB --> FF[📊 Update Product Catalog]
    CC --> FF
    DD --> FF
    EE --> FF
    
    FF --> GG([🔚 End Process])
```

### 5. Sales Analytics & Reporting Flow

```mermaid
flowchart TD
    A([📈 Start: Sales Analytics]) --> B{Owner Access Check}
    
    B -->|❌ Not Owner| C[❌ Access Denied]
    C --> D([🔚 End: Unauthorized])
    
    B -->|✅ Owner| E[📊 Access Analytics Dashboard]
    E --> F{Select Report Type}
    
    F -->|📅 Daily Sales| G[Select Specific Date]
    F -->|📆 Monthly Sales| H[Select Month & Year]
    F -->|🎯 Product Performance| I[Choose Date Range]
    F -->|❌ Non-Selling Items| J[Set Analysis Period]
    
    G --> K[🔍 Query Daily Order Data]
    H --> L[🔍 Query Monthly Data]
    I --> M[🔍 Query Product Sales]
    J --> N[🔍 Query Zero-Sale Products]
    
    K --> O{Data Found?}
    L --> P{Data Found?}
    M --> Q{Data Found?}
    N --> R{Data Found?}
    
    O -->|❌ No| S[📋 Display "No Sales" Message]
    P -->|❌ No| S
    Q -->|❌ No| S
    R -->|❌ No| T[📋 Display "All Products Selling"]
    
    O -->|✅ Yes| U[🧮 Calculate Daily Totals]
    P -->|✅ Yes| V[🧮 Calculate Monthly Summary]
    Q -->|✅ Yes| W[🧮 Analyze Product Performance]
    R -->|✅ Yes| X[📝 List Non-Selling Products]
    
    U --> Y[📊 Generate Daily Charts]
    V --> Z[📊 Generate Monthly Charts]
    W --> AA[📊 Create Performance Graphs]
    X --> BB[📋 Create Action Recommendations]
    
    Y --> CC[📱 Display Daily Report]
    Z --> DD[📱 Display Monthly Report]
    AA --> EE[📱 Display Performance Analysis]
    BB --> FF[📱 Display Improvement Suggestions]
    
    S --> GG{Generate Different Report?}
    T --> GG
    CC --> GG
    DD --> GG
    EE --> GG
    FF --> GG
    
    GG -->|✅ Yes| F
    GG -->|❌ No| HH([📊 Analytics Complete])
```

## Process Symbols Legend

| Symbol | Meaning | Usage |
|--------|---------|-------|
| 🔐 | **Start/End Point** | Beginning or completion of process |
| ⬜ | **Process** | Action or operation step |
| ◊ | **Decision** | Yes/No or multiple choice point |
| 📄 | **Input/Output** | Data entry or display |
| 🔗 | **Connector** | Link between process flows |

## Key Decision Points

### **🎯 Critical Business Rules**
1. **Role-Based Access**: Owner vs Barista permissions
2. **Stock Validation**: Prevent overselling inventory
3. **Payment Verification**: Ensure sufficient payment
4. **Data Integrity**: Maintain order history even after deletions

### **⚡ Automated Processes**
1. **Inventory Deduction**: Automatic after order completion
2. **Low Stock Alerts**: Real-time monitoring
3. **Order Numbering**: Professional format generation
4. **Change Calculation**: Precise payment processing

These flowcharts map out every decision point and process step in your coffee shop system, ensuring smooth operations and proper business logic flow!