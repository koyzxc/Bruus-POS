# Coffee Shop POS System - Sequence Diagrams

## System Interactions Over Time

### 1. Order Processing Sequence

```mermaid
sequenceDiagram
    participant B as Barista
    participant UI as POS Interface
    participant API as Backend API
    participant DB as Database
    participant INV as Inventory System

    Note over B,INV: Complete Order Processing Flow

    B->>UI: Login with credentials
    UI->>API: POST /api/login
    API->>DB: Verify user credentials
    DB-->>API: Return user data
    API-->>UI: Authentication success
    UI-->>B: Display main dashboard

    B->>UI: Select product category
    UI->>API: GET /api/products?category=coffee
    API->>DB: Query products by category
    DB-->>API: Return product list
    API-->>UI: Product data with sizes
    UI-->>B: Display coffee products

    B->>UI: Add "Latte - Large" to cart
    UI->>API: GET /api/products/15/ingredients
    API->>DB: Query product ingredients
    DB-->>API: Return ingredient requirements
    API->>INV: Check stock availability
    INV-->>API: Stock status confirmed
    API-->>UI: Product added to cart
    UI-->>B: Update cart display

    B->>UI: Proceed to checkout
    UI->>UI: Calculate total amount
    UI-->>B: Display payment screen

    B->>UI: Enter payment amount
    UI->>UI: Calculate change
    UI-->>B: Show amount due & change

    B->>UI: Complete payment
    UI->>API: POST /api/orders
    API->>DB: Create order record
    DB-->>API: Return order ID (BRUUS-2025-0041)
    
    API->>INV: Deduct ingredients from stock
    INV->>DB: Update inventory quantities
    DB-->>INV: Confirm stock updates
    INV-->>API: Inventory updated successfully

    API->>INV: Check for low stock alerts
    INV->>DB: Query minimum stock levels
    DB-->>INV: Return stock status
    INV-->>API: Low stock alerts (if any)

    API-->>UI: Order completed successfully
    UI-->>B: Display receipt & order summary
    
    Note over B,INV: Order completed with automatic inventory deduction
```

### 2. Product Management Sequence

```mermaid
sequenceDiagram
    participant O as Owner
    participant UI as Admin Interface
    participant API as Backend API
    participant DB as Database
    participant UPLOAD as File Storage

    Note over O,UPLOAD: Adding New Product with Ingredients

    O->>UI: Access admin settings
    UI->>API: GET /api/user (verify owner role)
    API->>DB: Check user permissions
    DB-->>API: Confirm owner access
    API-->>UI: Admin access granted
    UI-->>O: Display admin panel

    O->>UI: Click "Add New Product"
    UI-->>O: Show product creation form

    O->>UI: Fill product details
    Note right of O: Name: "Cappuccino"<br/>Category: "Coffee"<br/>Sizes: M($4.50), L($5.50)
    
    O->>UI: Upload product image
    UI->>UPLOAD: POST /api/upload/image
    UPLOAD-->>UI: Return image URL
    UI-->>O: Image uploaded successfully

    O->>UI: Add ingredients
    UI->>API: GET /api/inventory (get available ingredients)
    API->>DB: Query inventory items
    DB-->>API: Return ingredient list
    API-->>UI: Available ingredients
    UI-->>O: Display ingredient selection

    O->>UI: Select ingredients & quantities
    Note right of O: Medium: Coffee beans (20g), Milk (150ml)<br/>Large: Coffee beans (30g), Milk (200ml)

    O->>UI: Save product
    UI->>API: POST /api/products
    API->>DB: Insert product record
    DB-->>API: Return product ID
    
    API->>DB: Insert product ingredients (Medium)
    DB-->>API: Medium ingredients saved
    
    API->>DB: Insert product ingredients (Large)
    DB-->>API: Large ingredients saved
    
    API-->>UI: Product created successfully
    UI-->>O: Show success message & updated product list

    Note over O,UPLOAD: Product ready for sale with ingredient tracking
```

### 3. Inventory Management Sequence

```mermaid
sequenceDiagram
    participant U as User (Owner/Barista)
    participant UI as Inventory Interface
    participant API as Backend API
    participant DB as Database
    participant ALERT as Alert System

    Note over U,ALERT: Inventory Restocking Process

    U->>UI: Access inventory page
    UI->>API: GET /api/inventory
    API->>DB: Query all inventory items
    DB-->>API: Return inventory with stock levels
    API-->>UI: Inventory data
    UI-->>U: Display inventory list

    UI->>API: GET /api/inventory/low-stock
    API->>DB: Query items below minimum
    DB-->>API: Return low stock items
    API-->>UI: Low stock alerts
    UI-->>U: Show red alerts for low items

    U->>UI: Click "Restock" on Milk
    UI-->>U: Show restock form

    U->>UI: Enter restock details
    Note right of U: Amount: 5 boxes<br/>Each box: 1000ml<br/>Total: 5000ml

    U->>UI: Submit restock
    UI->>API: PATCH /api/inventory/42
    API->>DB: Update inventory quantities
    Note right of API: Calculate new totals:<br/>Previous: 2698ml<br/>Added: 5000ml<br/>New total: 7698ml
    
    DB-->>API: Inventory updated
    API->>ALERT: Check if item above minimum
    ALERT->>DB: Compare with minimum threshold
    DB-->>ALERT: Above minimum - remove alert
    ALERT-->>API: Alert status updated
    
    API-->>UI: Restock successful
    UI-->>U: Show updated stock levels
    UI->>UI: Remove low stock alert for Milk

    Note over U,ALERT: Stock replenished and alerts updated
```

### 4. User Authentication Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Login Interface
    participant API as Auth API
    participant AUTH as Auth Service
    participant DB as Database
    participant SESSION as Session Store

    Note over U,SESSION: User Login Process

    U->>UI: Enter credentials
    Note right of U: Username: owner<br/>Password: ctbruus2025

    U->>UI: Click login
    UI->>API: POST /api/login
    API->>AUTH: Validate credentials
    AUTH->>DB: Query user by username
    DB-->>AUTH: Return user data
    AUTH->>AUTH: Compare password hash
    
    alt Password Valid
        AUTH-->>API: Authentication successful
        API->>SESSION: Create user session
        SESSION-->>API: Session ID created
        API-->>UI: Login success + user data
        UI-->>U: Redirect to dashboard
    else Password Invalid
        AUTH-->>API: Authentication failed
        API-->>UI: Login error
        UI-->>U: Show error message
    end

    Note over U,SESSION: User authenticated and session established
```

### 5. Sales Analytics Sequence

```mermaid
sequenceDiagram
    participant O as Owner
    participant UI as Analytics Interface
    participant API as Reports API
    participant DB as Database
    participant CALC as Calculation Engine

    Note over O,CALC: Generating Sales Reports

    O->>UI: Access sales analytics
    UI->>API: GET /api/user (verify owner access)
    API-->>UI: Owner access confirmed
    UI-->>O: Display analytics dashboard

    O->>UI: Select date range
    Note right of O: From: 2025-05-01<br/>To: 2025-05-23

    O->>UI: Generate report
    UI->>API: GET /api/sales?from=2025-05-01&to=2025-05-23
    API->>DB: Query orders in date range
    DB-->>API: Return order data with items
    
    API->>CALC: Process sales data
    CALC->>CALC: Calculate totals by product
    CALC->>CALC: Group by categories
    CALC->>CALC: Calculate performance metrics
    CALC-->>API: Processed analytics data
    
    API-->>UI: Sales report data
    UI->>UI: Render charts and tables
    UI-->>O: Display comprehensive sales report

    O->>UI: View non-selling products
    UI->>API: GET /api/sales/non-selling?from=2025-05-01&to=2025-05-23
    API->>DB: Query products with zero sales
    DB-->>API: Return non-selling products
    API-->>UI: Non-selling products list
    UI-->>O: Show products needing attention

    Note over O,CALC: Complete sales insights generated
```

## Key Sequence Characteristics

### **⏱️ Timing & Flow**
- **Synchronous Operations**: User interactions, API calls
- **Asynchronous Operations**: File uploads, alert checks
- **Parallel Processing**: Stock checks during order processing

### **🔄 Error Handling Patterns**
- **Authentication failures**: Graceful error messages
- **Stock unavailable**: Prevent order completion
- **Database errors**: Rollback transactions

### **🎯 Performance Optimizations**
- **Caching**: Frequent inventory queries
- **Batching**: Multiple ingredient updates
- **Lazy Loading**: Product images and details

These sequence diagrams show exactly how your coffee shop system processes requests step-by-step, ensuring smooth operations and proper data flow!