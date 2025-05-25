# Coffee Shop POS - Simplified Flowchart

## Main Business Process Flow

```mermaid
flowchart TD
    A([Start: User Login]) --> B{Valid Login?}
    B -->|No| C[Show Error] --> B
    B -->|Yes| D{User Role?}
    
    D -->|Owner| E[Admin Dashboard]
    D -->|Barista| F[POS Dashboard]
    
    E --> G{Admin Action}
    G -->|Manage Products| H[Product Management]
    G -->|View Reports| I[Sales Analytics]
    G -->|Manage Users| J[User Management]
    G -->|Process Order| K[Order Flow]
    
    F --> K[Order Flow]
    F --> L[View Inventory]
    
    K --> M[Select Products]
    M --> N[Add to Cart]
    N --> O{More Items?}
    O -->|Yes| M
    O -->|No| P[Calculate Total]
    P --> Q[Process Payment]
    Q --> R{Payment OK?}
    R -->|No| S[Payment Error] --> Q
    R -->|Yes| T[Create Order]
    T --> U[Update Inventory]
    U --> V[Generate Receipt]
    V --> W([Order Complete])
    
    H --> X([Management Complete])
    I --> X
    J --> X
    L --> Y([Inventory Viewed])
```

**Key Decision Points:**
- **Login Check**: Verify user access
- **Role Check**: Owner gets admin features, Barista gets POS
- **Payment Validation**: Ensure sufficient payment before completing order
- **Auto Updates**: Inventory automatically updated after each sale