# Coffee Shop POS - Simplified Object Diagram

## Real System Instances at Runtime

```mermaid
graph TD
    %% User Objects
    owner["👑 owner : User<br/>id = 3<br/>username = 'jec'<br/>role = 'owner'<br/>createdAt = '2025-01-22'"]
    
    barista["☕ barista : User<br/>id = 2<br/>username = 'barista'<br/>role = 'barista'<br/>createdAt = '2025-01-22'"]

    %% Product Objects
    latte_m["☕ latte_medium : Product<br/>id = 15<br/>name = 'Latte'<br/>price = 4.50<br/>category = 'COFFEE'<br/>size = 'M'"]
    
    latte_l["☕ latte_large : Product<br/>id = 16<br/>name = 'Latte'<br/>price = 5.50<br/>category = 'COFFEE'<br/>size = 'L'"]

    %% Inventory Objects
    milk["🥛 milk : Inventory<br/>id = 42<br/>name = 'Milk'<br/>currentStock = 2698<br/>minimumStock = 500<br/>unit = 'ml'"]
    
    coffee_beans["☕ coffee_beans : Inventory<br/>id = 41<br/>name = 'Coffee Beans'<br/>currentStock = 850<br/>minimumStock = 200<br/>unit = 'g'"]

    %% Order Object
    order["🧾 order_41 : Order<br/>id = 41<br/>orderNumber = 'BRUUS-2025-0041'<br/>total = 10.00<br/>amountPaid = 15.00<br/>change = 5.00<br/>userId = 2"]

    %% Order Items
    item1["📝 item1 : OrderItem<br/>id = 81<br/>orderId = 41<br/>productId = 15<br/>productName = 'Latte'<br/>size = 'M'<br/>price = 4.50<br/>quantity = 1"]
    
    item2["📝 item2 : OrderItem<br/>id = 82<br/>orderId = 41<br/>productId = 16<br/>productName = 'Latte'<br/>size = 'L'<br/>price = 5.50<br/>quantity = 1"]

    %% Ingredient Links
    ingredient1["🔗 link1 : ProductIngredient<br/>productId = 15<br/>inventoryId = 42<br/>quantityUsed = 150<br/>size = 'M'"]
    
    ingredient2["🔗 link2 : ProductIngredient<br/>productId = 15<br/>inventoryId = 41<br/>quantityUsed = 20<br/>size = 'M'"]

    %% Relationships
    barista -.-> order : "created by"
    order --> item1 : "contains"
    order --> item2 : "contains"
    
    item1 -.-> latte_m : "references"
    item2 -.-> latte_l : "references"
    
    latte_m --> ingredient1 : "requires"
    latte_m --> ingredient2 : "requires"
    
    ingredient1 -.-> milk : "uses"
    ingredient2 -.-> coffee_beans : "uses"

    %% Styling
    classDef user fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef product fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef inventory fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef order fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef item fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef link fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class owner,barista user
    class latte_m,latte_l product
    class milk,coffee_beans inventory
    class order order
    class item1,item2 item
    class ingredient1,ingredient2 link
```

## Object Instance Details

### **👥 Active Users**
- **Owner (jec)**: Full admin access, can manage everything
- **Barista**: Daily operations, processes customer orders

### **☕ Product Instances**
- **Latte Medium**: $4.50, requires 150ml milk + 20g coffee beans
- **Latte Large**: $5.50, uses more ingredients for larger size

### **📦 Current Inventory**
- **Milk**: 2698ml available (above 500ml minimum - no alert)
- **Coffee Beans**: 850g available (above 200g minimum - no alert)

### **🧾 Live Order Example**
- **Order BRUUS-2025-0041**: Created by barista
- **Items**: 1 Medium Latte + 1 Large Latte = $10.00 total
- **Payment**: Customer paid $15.00, received $5.00 change

### **🔄 Real-Time Connections**
- Order items link to specific product instances
- Products connect to inventory through ingredient requirements
- When order completes, inventory automatically decreases

This shows your coffee shop system in action - real users, actual products, current inventory levels, and a live order with all the connections between objects!