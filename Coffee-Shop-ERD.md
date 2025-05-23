# Coffee Shop POS System - Mermaid ERD

## Interactive Database Schema Diagram

```mermaid
erDiagram
    USERS {
        int id PK "Primary Key"
        string username UK "Unique Username"
        string password "Encrypted Password"
        string role "owner/barista"
        datetime createdAt "Account Creation"
    }
    
    CATEGORIES {
        int id PK "Primary Key"
        string name "Category Name"
        int displayOrder "Display Priority"
        datetime createdAt "Creation Date"
    }
    
    PRODUCTS {
        int id PK "Primary Key"
        string name "Product Name"
        decimal price "Product Price"
        string category FK "Category Reference"
        string size "M/L Size"
        string imageUrl "Product Image"
        datetime createdAt "Creation Date"
    }
    
    INVENTORY {
        int id PK "Primary Key"
        string name "Ingredient Name"
        decimal currentStock "Current Amount"
        decimal minimumStock "Alert Threshold"
        string unit "pc/g/kg/ml/L"
        string containerType "Box/Pack/Case"
        int numberOfContainers "Container Count"
        decimal quantityPerUnit "Unit Amount"
        string secondaryUnit "Secondary Unit"
        datetime createdAt "Creation Date"
    }
    
    PRODUCT_INGREDIENTS {
        int id PK "Primary Key"
        int productId FK "Product Reference"
        int inventoryId FK "Inventory Reference"
        decimal quantityUsed "Amount Used"
        string size "M/L Size"
    }
    
    ORDERS {
        int id PK "Primary Key"
        string orderNumber UK "BRUUS-YYYY-XXXX"
        decimal total "Order Total"
        decimal amountPaid "Amount Paid"
        decimal change "Change Given"
        int userId FK "User Reference"
        datetime createdAt "Order Time"
    }
    
    ORDER_ITEMS {
        int id PK "Primary Key"
        int orderId FK "Order Reference"
        int productId FK "Product Reference"
        string productName "Product Name"
        string size "M/L Size"
        decimal price "Item Price"
        int quantity "Item Quantity"
    }

    %% Core Business Relationships
    USERS ||--o{ ORDERS : "creates_orders"
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    
    %% Inventory Management
    PRODUCTS ||--o{ PRODUCT_INGREDIENTS : "requires_ingredients"
    INVENTORY ||--o{ PRODUCT_INGREDIENTS : "supplies_to_products"
    
    %% Order Processing
    ORDERS ||--o{ ORDER_ITEMS : "contains_items"
    PRODUCTS ||--o{ ORDER_ITEMS : "sold_as_items"
```

## System Workflow

```mermaid
flowchart TD
    A[User Login] --> B{Role Check}
    B -->|Owner| C[Full Access]
    B -->|Barista| D[Limited Access]
    
    C --> E[Product Management]
    C --> F[Inventory Management]
    C --> G[Sales Analytics]
    C --> H[User Management]
    
    D --> I[Order Processing]
    D --> J[Basic Inventory View]
    
    E --> K[Add/Edit Products]
    K --> L[Set Ingredients]
    L --> M[Link to Inventory]
    
    F --> N[Stock Monitoring]
    N --> O{Stock Low?}
    O -->|Yes| P[Low Stock Alert]
    O -->|No| Q[Continue Operations]
    
    I --> R[Select Products]
    R --> S[Calculate Total]
    S --> T[Process Payment]
    T --> U[Update Inventory]
    U --> V[Generate Receipt]
```

## Data Flow Process

```mermaid
sequenceDiagram
    participant U as User
    participant P as POS System
    participant I as Inventory
    participant DB as Database
    
    U->>P: Select Product (Size M/L)
    P->>DB: Get Product Details
    DB-->>P: Product + Ingredients
    P->>I: Check Stock Availability
    I-->>P: Stock Status
    P->>U: Display Price & Availability
    
    U->>P: Add to Cart
    P->>P: Calculate Total
    U->>P: Process Payment
    P->>DB: Create Order Record
    P->>I: Deduct Ingredients
    I->>DB: Update Stock Levels
    DB-->>P: Confirm Transaction
    P->>U: Generate Receipt
    
    Note over I: Auto-check for low stock
    I->>P: Send Low Stock Alert (if needed)
```

## Key Features Visualization

```mermaid
mindmap
  root((Coffee Shop POS))
    User Management
      Role Based Access
      Owner Privileges
      Barista Operations
      Admin Settings
    
    Product System
      Categories
      Size Variants
      Image Support
      Ingredient Tracking
    
    Inventory Control
      Multi Unit System
      Container Management
      Low Stock Alerts
      Automatic Deduction
    
    Order Processing
      Professional Numbering
      Payment Tracking
      Receipt Generation
      Sales History
    
    Analytics
      Sales Reports
      Date Filtering
      Performance Metrics
      Non Selling Products
```

This Mermaid diagram can be viewed in any Mermaid-compatible viewer or platform that supports the syntax!