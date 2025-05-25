# Coffee Shop POS - Simplified Class Diagram

## Essential System Classes

```mermaid
classDiagram
    %% Core Business Classes
    class User {
        +int id
        +string username
        +string role
        +login() boolean
        +hasPermission() boolean
    }

    class Product {
        +int id
        +string name
        +decimal price
        +string size
        +getIngredients() Ingredient[]
        +calculatePrice() decimal
    }

    class Inventory {
        +int id
        +string name
        +decimal currentStock
        +decimal minimumStock
        +isLowStock() boolean
        +deductStock() void
    }

    class Order {
        +int id
        +string orderNumber
        +decimal total
        +int userId
        +addItem() void
        +calculateTotal() decimal
        +processPayment() boolean
    }

    class OrderItem {
        +int orderId
        +int productId
        +string size
        +decimal price
        +int quantity
    }

    %% Key Services
    class OrderService {
        +createOrder() Order
        +processPayment() boolean
        +updateInventory() void
    }

    class InventoryService {
        +checkLowStock() Inventory[]
        +restockItem() void
        +getLowStockAlerts() Inventory[]
    }

    %% Core Relationships
    User ||--o{ Order : creates
    Order ||--o{ OrderItem : contains
    Product ||--o{ OrderItem : sold_as
    Product ||--o{ Inventory : uses
    
    OrderService --> Order : manages
    InventoryService --> Inventory : manages
```

**Key Components:**
- **Business Objects**: User, Product, Inventory, Order
- **Services**: Handle business logic and operations
- **Simple Relationships**: Clear connections between main entities