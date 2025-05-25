# Coffee Shop POS System - Professional Entity Relationship Diagram

## Academic Standard ERD for Relational Database

### Complete Entity Relationship Model

```mermaid
erDiagram
    %% Entity Definitions with Complete Attributes
    
    USERS {
        int user_id PK "Primary Key - Auto Increment"
        varchar username UK "Unique Username - NOT NULL"
        varchar password_hash "Encrypted Password - NOT NULL"
        enum user_role "owner, barista - NOT NULL"
        timestamp created_at "Account Creation Time - DEFAULT NOW"
        timestamp updated_at "Last Profile Update"
        boolean is_active "Account Status - DEFAULT TRUE"
    }

    CATEGORIES {
        int category_id PK "Primary Key - Auto Increment"
        varchar category_name UK "Category Name - NOT NULL"
        int display_order "Sort Order - DEFAULT 0"
        text description "Category Description"
        timestamp created_at "Creation Time - DEFAULT NOW"
        timestamp updated_at "Last Modification Time"
        boolean is_active "Category Status - DEFAULT TRUE"
    }

    PRODUCTS {
        int product_id PK "Primary Key - Auto Increment"
        varchar product_name "Product Name - NOT NULL"
        decimal base_price "Base Price - DECIMAL(10,2) NOT NULL"
        varchar category FK "References categories.category_name"
        enum product_size "M, L - NOT NULL"
        varchar image_url "Product Image Path"
        text description "Product Description"
        timestamp created_at "Creation Time - DEFAULT NOW"
        timestamp updated_at "Last Modification Time"
        boolean is_available "Product Status - DEFAULT TRUE"
        boolean is_deleted "Soft Delete Flag - DEFAULT FALSE"
    }

    INVENTORY {
        int inventory_id PK "Primary Key - Auto Increment"
        varchar ingredient_name UK "Ingredient Name - NOT NULL"
        decimal current_stock "Current Amount - DECIMAL(10,3) NOT NULL"
        decimal minimum_stock "Alert Threshold - DECIMAL(10,3) NOT NULL"
        enum primary_unit "pc, g, kg, ml, L - NOT NULL"
        enum container_type "Box, Pack, Case - NOT NULL"
        int number_of_containers "Container Count - DEFAULT 0"
        decimal quantity_per_unit "Amount per Container - DECIMAL(10,3)"
        enum secondary_unit "piece, g, kg, ml, L"
        decimal unit_cost "Cost per Unit - DECIMAL(8,2)"
        varchar supplier_name "Supplier Information"
        timestamp created_at "Creation Time - DEFAULT NOW"
        timestamp updated_at "Last Stock Update"
        timestamp last_restocked "Last Restock Date"
        boolean is_active "Ingredient Status - DEFAULT TRUE"
    }

    PRODUCT_INGREDIENTS {
        int ingredient_link_id PK "Primary Key - Auto Increment"
        int product_id FK "References products.product_id - NOT NULL"
        int inventory_id FK "References inventory.inventory_id - NOT NULL"
        decimal quantity_required "Amount Needed - DECIMAL(10,3) NOT NULL"
        enum product_size "M, L - NOT NULL"
        enum unit_of_measure "Measurement Unit - NOT NULL"
        decimal cost_per_serving "Cost per Use - DECIMAL(8,4)"
        timestamp created_at "Link Creation Time - DEFAULT NOW"
        timestamp updated_at "Last Modification Time"
        boolean is_active "Link Status - DEFAULT TRUE"
    }

    ORDERS {
        int order_id PK "Primary Key - Auto Increment"
        varchar order_number UK "Format: BRUUS-YYYY-NNNN - NOT NULL"
        decimal subtotal "Items Total - DECIMAL(10,2) NOT NULL"
        decimal tax_amount "Tax Applied - DECIMAL(8,2) DEFAULT 0"
        decimal total_amount "Final Total - DECIMAL(10,2) NOT NULL"
        decimal amount_paid "Customer Payment - DECIMAL(10,2) NOT NULL"
        decimal change_given "Change Amount - DECIMAL(10,2) DEFAULT 0"
        int cashier_id FK "References users.user_id - NOT NULL"
        enum order_status "pending, completed, cancelled - DEFAULT pending"
        enum payment_method "cash, card, digital - DEFAULT cash"
        timestamp order_time "Order Creation - DEFAULT NOW"
        timestamp completed_time "Order Completion Time"
        text order_notes "Special Instructions"
        boolean is_refunded "Refund Status - DEFAULT FALSE"
    }

    ORDER_ITEMS {
        int order_item_id PK "Primary Key - Auto Increment"
        int order_id FK "References orders.order_id - NOT NULL"
        int product_id FK "References products.product_id - NOT NULL"
        varchar product_name "Product Name at Sale - NOT NULL"
        enum item_size "M, L - NOT NULL"
        decimal unit_price "Price per Item - DECIMAL(8,2) NOT NULL"
        int quantity "Item Quantity - NOT NULL DEFAULT 1"
        decimal line_total "Line Amount - DECIMAL(10,2) NOT NULL"
        text item_notes "Special Requests"
        timestamp added_at "Item Added Time - DEFAULT NOW"
        boolean is_cancelled "Item Cancellation - DEFAULT FALSE"
    }

    INVENTORY_TRANSACTIONS {
        int transaction_id PK "Primary Key - Auto Increment"
        int inventory_id FK "References inventory.inventory_id - NOT NULL"
        enum transaction_type "restock, sale, adjustment, waste"
        decimal quantity_change "Amount Changed - DECIMAL(10,3)"
        decimal previous_stock "Stock Before - DECIMAL(10,3)"
        decimal new_stock "Stock After - DECIMAL(10,3)"
        int order_id FK "References orders.order_id (if sale)"
        int user_id FK "References users.user_id - NOT NULL"
        text transaction_notes "Transaction Details"
        timestamp transaction_time "Transaction Time - DEFAULT NOW"
        decimal unit_cost "Cost per Unit - DECIMAL(8,2)"
    }

    %% Relationship Definitions with Cardinality

    %% User Management Relationships
    USERS ||--o{ ORDERS : "cashier_creates"
    USERS ||--o{ INVENTORY_TRANSACTIONS : "user_performs"

    %% Product Catalog Relationships  
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCTS ||--o{ PRODUCT_INGREDIENTS : "requires_ingredients"
    
    %% Inventory Management Relationships
    INVENTORY ||--o{ PRODUCT_INGREDIENTS : "supplies_to_products"
    INVENTORY ||--o{ INVENTORY_TRANSACTIONS : "tracks_changes"
    
    %% Order Processing Relationships
    ORDERS ||--o{ ORDER_ITEMS : "contains_items"
    PRODUCTS ||--o{ ORDER_ITEMS : "sold_as_items"
    ORDERS ||--o{ INVENTORY_TRANSACTIONS : "triggers_stock_updates"

    %% Business Rule Constraints (Conceptual)
    %% Note: These are enforced in application logic and database constraints
```

## Entity Descriptions and Business Rules

### **👥 USERS Entity**
**Purpose**: Manages system access and user roles
- **Primary Key**: `user_id` (Auto-incrementing integer)
- **Unique Constraints**: `username` must be unique across system
- **Business Rules**:
  - Only 'owner' role can delete products/inventory
  - 'barista' role limited to operational functions
  - Password must be hashed using secure algorithms
  - Account creation timestamp for audit trail

### **📂 CATEGORIES Entity**  
**Purpose**: Organizes products into logical groups
- **Primary Key**: `category_id` (Auto-incrementing integer)
- **Unique Constraints**: `category_name` must be unique
- **Business Rules**:
  - Display order determines menu arrangement
  - Soft delete preserves data integrity
  - Categories can be deactivated without deletion

### **🍕 PRODUCTS Entity**
**Purpose**: Defines menu items with pricing and specifications
- **Primary Key**: `product_id` (Auto-incrementing integer)  
- **Foreign Key**: `category` references `CATEGORIES.category_name`
- **Business Rules**:
  - Each size (M/L) requires separate record for pricing
  - Soft delete maintains order history integrity
  - Image URLs point to uploaded product photos
  - Price stored as DECIMAL for currency precision

### **📦 INVENTORY Entity**
**Purpose**: Tracks ingredient stock levels and container management
- **Primary Key**: `inventory_id` (Auto-incrementing integer)
- **Unique Constraints**: `ingredient_name` must be unique
- **Business Rules**:
  - Current stock auto-calculated from container quantities
  - Low stock alerts triggered when below minimum threshold
  - Multi-unit support (primary and secondary units)
  - Cost tracking for profit margin analysis

### **🔗 PRODUCT_INGREDIENTS Entity**
**Purpose**: Links products to required inventory ingredients
- **Primary Key**: `ingredient_link_id` (Auto-incrementing integer)
- **Foreign Keys**: 
  - `product_id` references `PRODUCTS.product_id`
  - `inventory_id` references `INVENTORY.inventory_id`
- **Business Rules**:
  - Different quantities for Medium vs Large sizes
  - Quantity deducted automatically on order completion
  - Cost per serving calculated for pricing analysis

### **🛒 ORDERS Entity**
**Purpose**: Records customer transactions and payment details
- **Primary Key**: `order_id` (Auto-incrementing integer)
- **Unique Constraints**: `order_number` follows format BRUUS-YYYY-NNNN
- **Foreign Key**: `cashier_id` references `USERS.user_id`
- **Business Rules**:
  - Professional order numbering system
  - Change calculation automated
  - Order completion triggers inventory updates
  - Payment method tracking for reporting

### **📝 ORDER_ITEMS Entity**
**Purpose**: Details individual products within each order
- **Primary Key**: `order_item_id` (Auto-incrementing integer)
- **Foreign Keys**:
  - `order_id` references `ORDERS.order_id`
  - `product_id` references `PRODUCTS.product_id`
- **Business Rules**:
  - Product name stored at sale time (historical accuracy)
  - Line total calculated from unit price × quantity
  - Individual item cancellation support

### **📊 INVENTORY_TRANSACTIONS Entity**
**Purpose**: Audit trail for all inventory movements
- **Primary Key**: `transaction_id` (Auto-incrementing integer)
- **Foreign Keys**:
  - `inventory_id` references `INVENTORY.inventory_id`
  - `order_id` references `ORDERS.order_id` (for sales)
  - `user_id` references `USERS.user_id`
- **Business Rules**:
  - Complete audit trail for stock changes
  - Before/after stock levels recorded
  - Transaction type categorization
  - Cost tracking for financial analysis

## Database Constraints and Indexes

### **Primary Key Constraints**
- All entities have auto-incrementing integer primary keys
- Ensures unique record identification across system

### **Foreign Key Constraints**
```sql
-- User-Order Relationship
ALTER TABLE orders ADD CONSTRAINT fk_orders_cashier 
FOREIGN KEY (cashier_id) REFERENCES users(user_id);

-- Product-Category Relationship  
ALTER TABLE products ADD CONSTRAINT fk_products_category
FOREIGN KEY (category) REFERENCES categories(category_name);

-- Product-Ingredient Relationships
ALTER TABLE product_ingredients ADD CONSTRAINT fk_ingredients_product
FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE product_ingredients ADD CONSTRAINT fk_ingredients_inventory  
FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id);
```

### **Unique Constraints**
```sql
-- Prevent duplicate usernames
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);

-- Prevent duplicate order numbers
ALTER TABLE orders ADD CONSTRAINT uk_orders_number UNIQUE (order_number);

-- Prevent duplicate ingredient names
ALTER TABLE inventory ADD CONSTRAINT uk_inventory_name UNIQUE (ingredient_name);
```

### **Check Constraints**
```sql
-- Ensure positive quantities and prices
ALTER TABLE products ADD CONSTRAINT chk_products_price 
CHECK (base_price > 0);

ALTER TABLE inventory ADD CONSTRAINT chk_inventory_stock
CHECK (current_stock >= 0 AND minimum_stock >= 0);

ALTER TABLE orders ADD CONSTRAINT chk_orders_amounts
CHECK (total_amount > 0 AND amount_paid >= total_amount);
```

## Data Integrity and Normalization

### **First Normal Form (1NF)**
✅ All attributes contain atomic values
✅ No repeating groups or arrays
✅ Each record uniquely identifiable

### **Second Normal Form (2NF)**  
✅ All non-key attributes fully dependent on primary key
✅ No partial dependencies identified
✅ Separate entities for distinct concepts

### **Third Normal Form (3NF)**
✅ No transitive dependencies
✅ All non-key attributes depend only on primary key
✅ Calculated fields handled in application layer

This ERD represents a fully normalized, academically sound database design that supports all business requirements while maintaining data integrity and operational efficiency.