# Coffee Shop POS - Simplified ERD

## Core Database Structure

```mermaid
erDiagram
    USERS {
        int id PK
        string username
        string password
        string role
    }
    
    PRODUCTS {
        int id PK
        string name
        decimal price
        string category
        string size
        string imageUrl
    }
    
    INVENTORY {
        int id PK
        string name
        decimal currentStock
        decimal minimumStock
        string unit
    }
    
    ORDERS {
        int id PK
        string orderNumber
        decimal total
        decimal amountPaid
        int userId FK
    }
    
    ORDER_ITEMS {
        int id PK
        int orderId FK
        int productId FK
        string size
        decimal price
        int quantity
    }
    
    PRODUCT_INGREDIENTS {
        int id PK
        int productId FK
        int inventoryId FK
        decimal quantityUsed
        string size
    }

    %% Key Relationships
    USERS ||--o{ ORDERS : creates
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : sold_as
    PRODUCTS ||--o{ PRODUCT_INGREDIENTS : requires
    INVENTORY ||--o{ PRODUCT_INGREDIENTS : supplies
```

**Key Points:**
- 6 main tables handle all coffee shop operations
- Users create orders containing multiple items
- Products link to inventory ingredients for stock tracking
- Order completion automatically updates inventory levels