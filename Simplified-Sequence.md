# Coffee Shop POS - Simplified Sequence Diagram

## Core Order Processing Flow

```mermaid
sequenceDiagram
    participant B as Barista
    participant UI as POS System
    participant DB as Database

    B->>UI: Login
    UI->>DB: Verify credentials
    DB-->>UI: User authenticated
    UI-->>B: Show dashboard

    B->>UI: Select product
    UI->>DB: Get product details
    DB-->>UI: Product info + ingredients
    UI-->>B: Add to cart

    B->>UI: Checkout
    UI->>UI: Calculate total
    UI-->>B: Show payment screen

    B->>UI: Process payment
    UI->>DB: Create order
    DB-->>UI: Order saved
    
    UI->>DB: Update inventory
    DB-->>UI: Stock updated
    UI-->>B: Show receipt
```

**Key Steps:**
1. **Login** - User authentication
2. **Select** - Choose products for order
3. **Payment** - Process customer payment
4. **Complete** - Save order and update inventory automatically