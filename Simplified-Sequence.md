# Coffee Shop POS - Simplified Sequence Diagram

## Core System Interactions

### Order Processing Flow
```mermaid
sequenceDiagram
    participant U as User (Owner/Barista)
    participant UI as POS System
    participant DB as Database

    U->>UI: Login
    UI->>DB: Verify credentials
    DB-->>UI: User authenticated
    UI-->>U: Show dashboard

    U->>UI: Select product
    UI->>DB: Get product details
    DB-->>UI: Product info + ingredients
    UI-->>U: Add to cart

    U->>UI: Checkout
    UI->>UI: Calculate total
    UI-->>U: Show payment screen

    U->>UI: Process payment
    UI->>DB: Create order
    DB-->>UI: Order saved
    
    UI->>DB: Update inventory
    DB-->>UI: Stock updated
    UI-->>U: Show receipt
```

### Owner Management Flow
```mermaid
sequenceDiagram
    participant O as Owner
    participant UI as Admin System
    participant DB as Database

    O->>UI: Access admin settings
    UI->>DB: Verify owner role
    DB-->>UI: Admin access granted
    UI-->>O: Show admin panel

    O->>UI: Add new product
    UI->>DB: Save product details
    DB-->>UI: Product created
    UI-->>O: Show success message

    O->>UI: View sales report
    UI->>DB: Query sales data
    DB-->>UI: Sales analytics
    UI-->>O: Display reports
```

**Key Functions:**
- **Both Users**: Can process orders and handle payments
- **Owner Only**: Admin features like product management and sales reports
- **Auto Updates**: Inventory changes automatically after each order