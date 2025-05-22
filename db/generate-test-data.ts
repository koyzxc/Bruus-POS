import { db } from "@db";
import { categories, products, inventory, productIngredients, orders, orderItems } from "@shared/schema";
import { hashPassword } from "../server/auth";

async function generateTestData() {
  console.log("🚀 Starting test data generation...");

  try {
    // Clear existing data
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(productIngredients);
    await db.delete(products);
    await db.delete(inventory);
    
    console.log("✅ Cleared existing data");

    // Generate ingredients for inventory
    const ingredientData = [
      // Coffee ingredients
      { name: "Espresso Beans", unit: "kg", currentStock: "45.00", minimumThreshold: "10.00", containerType: "Box", containerQuantity: "3.00", secondaryUnit: "piece", quantityPerUnit: "15.00", numberOfContainers: "3.00" },
      { name: "Arabica Coffee Beans", unit: "kg", currentStock: "35.00", minimumThreshold: "8.00", containerType: "Box", containerQuantity: "2.00", secondaryUnit: "piece", quantityPerUnit: "17.50", numberOfContainers: "2.00" },
      { name: "Whole Milk", unit: "L", currentStock: 25, minThreshold: 5, containerType: "Case", containerQuantity: 5, secondaryUnit: "Bottle", quantityPerUnit: 5, numberOfContainers: 5 },
      { name: "Oat Milk", unit: "L", currentStock: 15, minThreshold: 3, containerType: "Case", containerQuantity: 3, secondaryUnit: "Bottle", quantityPerUnit: 5, numberOfContainers: 3 },
      { name: "Vanilla Syrup", unit: "ml", currentStock: 2000, minThreshold: 500, containerType: "Pack", containerQuantity: 4, secondaryUnit: "piece", quantityPerUnit: 500, numberOfContainers: 4 },
      { name: "Caramel Syrup", unit: "ml", currentStock: 1800, minThreshold: 400, containerType: "Pack", containerQuantity: 3, secondaryUnit: "piece", quantityPerUnit: 600, numberOfContainers: 3 },
      { name: "Chocolate Syrup", unit: "ml", currentStock: 1500, minThreshold: 300, containerType: "Pack", containerQuantity: 3, secondaryUnit: "piece", quantityPerUnit: 500, numberOfContainers: 3 },
      
      // Smoothie/Shake ingredients
      { name: "Frozen Strawberries", unit: "kg", currentStock: 12, minThreshold: 3, containerType: "Box", containerQuantity: 4, secondaryUnit: "piece", quantityPerUnit: 3, numberOfContainers: 4 },
      { name: "Frozen Mango", unit: "kg", currentStock: 10, minThreshold: 2, containerType: "Box", containerQuantity: 2, secondaryUnit: "piece", quantityPerUnit: 5, numberOfContainers: 2 },
      { name: "Banana", unit: "pc", currentStock: 50, minThreshold: 10, containerType: "Box", containerQuantity: 2, secondaryUnit: "piece", quantityPerUnit: 25, numberOfContainers: 2 },
      { name: "Greek Yogurt", unit: "kg", currentStock: 8, minThreshold: 2, containerType: "Case", containerQuantity: 4, secondaryUnit: "Bottle", quantityPerUnit: 2, numberOfContainers: 4 },
      { name: "Protein Powder", unit: "kg", currentStock: 6, minThreshold: 1, containerType: "Pack", containerQuantity: 2, secondaryUnit: "piece", quantityPerUnit: 3, numberOfContainers: 2 },
      
      // Food ingredients
      { name: "Bread Slices", unit: "pc", currentStock: 80, minThreshold: 20, containerType: "Pack", containerQuantity: 4, secondaryUnit: "piece", quantityPerUnit: 20, numberOfContainers: 4 },
      { name: "Cheese Slices", unit: "pc", currentStock: 60, minThreshold: 15, containerType: "Pack", containerQuantity: 3, secondaryUnit: "piece", quantityPerUnit: 20, numberOfContainers: 3 },
      { name: "Ham Slices", unit: "pc", currentStock: 40, minThreshold: 10, containerType: "Pack", containerQuantity: 2, secondaryUnit: "piece", quantityPerUnit: 20, numberOfContainers: 2 },
      { name: "Butter", unit: "kg", currentStock: 3, minThreshold: 1, containerType: "Pack", containerQuantity: 3, secondaryUnit: "piece", quantityPerUnit: 1, numberOfContainers: 3 },
      { name: "Lettuce", unit: "pc", currentStock: 20, minThreshold: 5, containerType: "Box", containerQuantity: 2, secondaryUnit: "piece", quantityPerUnit: 10, numberOfContainers: 2 },
      { name: "Tomatoes", unit: "kg", currentStock: 5, minThreshold: 1, containerType: "Box", containerQuantity: 1, secondaryUnit: "piece", quantityPerUnit: 5, numberOfContainers: 1 },
      
      // Pastry ingredients
      { name: "All-Purpose Flour", unit: "kg", currentStock: 20, minThreshold: 5, containerType: "Box", containerQuantity: 4, secondaryUnit: "piece", quantityPerUnit: 5, numberOfContainers: 4 },
      { name: "Sugar", unit: "kg", currentStock: 15, minThreshold: 3, containerType: "Box", containerQuantity: 3, secondaryUnit: "piece", quantityPerUnit: 5, numberOfContainers: 3 },
      { name: "Eggs", unit: "pc", currentStock: 120, minThreshold: 30, containerType: "Box", containerQuantity: 10, secondaryUnit: "piece", quantityPerUnit: 12, numberOfContainers: 10 },
      { name: "Heavy Cream", unit: "L", currentStock: 8, minThreshold: 2, containerType: "Case", containerQuantity: 4, secondaryUnit: "Bottle", quantityPerUnit: 2, numberOfContainers: 4 }
    ];

    const insertedInventory = await db.insert(inventory).values(ingredientData).returning();
    console.log(`✅ Generated ${insertedInventory.length} inventory items`);

    // Get categories
    const coffeeCategory = await db.query.categories.findFirst({ where: (categories, { eq }) => eq(categories.name, "COFFEE") });
    const shakeCategory = await db.query.categories.findFirst({ where: (categories, { eq }) => eq(categories.name, "SHAKE") });
    const foodCategory = await db.query.categories.findFirst({ where: (categories, { eq }) => eq(categories.name, "FOOD") });
    const pastryCategory = await db.query.categories.findFirst({ where: (categories, { eq }) => eq(categories.name, "PASTRY") });

    if (!coffeeCategory || !shakeCategory || !foodCategory || !pastryCategory) {
      throw new Error("Categories not found. Please run seed first.");
    }

    // Generate products
    const productData = [
      // Coffee products
      { name: "Classic Espresso", description: "Rich and bold espresso shot", price: "150.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "M", imageUrl: null },
      { name: "Classic Espresso", description: "Rich and bold espresso shot", price: "180.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "L", imageUrl: null },
      { name: "Vanilla Latte", description: "Smooth espresso with vanilla syrup", price: "180.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "M", imageUrl: null },
      { name: "Vanilla Latte", description: "Smooth espresso with vanilla syrup", price: "220.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "L", imageUrl: null },
      { name: "Caramel Macchiato", description: "Espresso with caramel syrup", price: "200.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "M", imageUrl: null },
      { name: "Caramel Macchiato", description: "Espresso with caramel syrup", price: "240.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "L", imageUrl: null },
      { name: "Mocha Frappé", description: "Iced coffee with chocolate", price: "220.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "M", imageUrl: null },
      { name: "Mocha Frappé", description: "Iced coffee with chocolate", price: "260.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "L", imageUrl: null },
      { name: "Americano", description: "Classic black coffee", price: "130.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "M", imageUrl: null },
      { name: "Americano", description: "Classic black coffee", price: "160.00", category: coffeeCategory.name, categoryId: coffeeCategory.id, size: "L", imageUrl: null },

      // Shake products
      { name: "Strawberry Smoothie", description: "Fresh strawberry blend", price: "160.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "M", imageUrl: null },
      { name: "Strawberry Smoothie", description: "Fresh strawberry blend", price: "200.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "L", imageUrl: null },
      { name: "Mango Shake", description: "Tropical mango flavor", price: "170.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "M", imageUrl: null },
      { name: "Mango Shake", description: "Tropical mango flavor", price: "210.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "L", imageUrl: null },
      { name: "Banana Protein Shake", description: "High-protein banana shake", price: "190.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "M", imageUrl: null },
      { name: "Banana Protein Shake", description: "High-protein banana shake", price: "230.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "L", imageUrl: null },
      { name: "Mixed Berry Smoothie", description: "Blend of berries and yogurt", price: "180.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "M", imageUrl: null },
      { name: "Mixed Berry Smoothie", description: "Blend of berries and yogurt", price: "220.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "L", imageUrl: null },
      { name: "Green Smoothie", description: "Healthy green vegetable blend", price: "200.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "M", imageUrl: null },
      { name: "Green Smoothie", description: "Healthy green vegetable blend", price: "240.00", category: shakeCategory.name, categoryId: shakeCategory.id, size: "L", imageUrl: null },

      // Food products
      { name: "Ham & Cheese Sandwich", description: "Classic ham and cheese", price: "120.00", category: foodCategory.name, categoryId: foodCategory.id, size: "M", imageUrl: null },
      { name: "Ham & Cheese Sandwich", description: "Classic ham and cheese", price: "150.00", category: foodCategory.name, categoryId: foodCategory.id, size: "L", imageUrl: null },
      { name: "Club Sandwich", description: "Triple layer club sandwich", price: "180.00", category: foodCategory.name, categoryId: foodCategory.id, size: "M", imageUrl: null },
      { name: "Club Sandwich", description: "Triple layer club sandwich", price: "220.00", category: foodCategory.name, categoryId: foodCategory.id, size: "L", imageUrl: null },
      { name: "Grilled Panini", description: "Pressed Italian sandwich", price: "160.00", category: foodCategory.name, categoryId: foodCategory.id, size: "M", imageUrl: null },
      { name: "Grilled Panini", description: "Pressed Italian sandwich", price: "200.00", category: foodCategory.name, categoryId: foodCategory.id, size: "L", imageUrl: null },
      { name: "Caesar Salad", description: "Fresh Caesar salad", price: "140.00", category: foodCategory.name, categoryId: foodCategory.id, size: "M", imageUrl: null },
      { name: "Caesar Salad", description: "Fresh Caesar salad", price: "180.00", category: foodCategory.name, categoryId: foodCategory.id, size: "L", imageUrl: null },
      { name: "Chicken Wrap", description: "Grilled chicken wrap", price: "170.00", category: foodCategory.name, categoryId: foodCategory.id, size: "M", imageUrl: null },
      { name: "Chicken Wrap", description: "Grilled chicken wrap", price: "210.00", category: foodCategory.name, categoryId: foodCategory.id, size: "L", imageUrl: null },

      // Pastry products
      { name: "Chocolate Croissant", description: "Buttery croissant with chocolate", price: "80.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "M", imageUrl: null },
      { name: "Chocolate Croissant", description: "Buttery croissant with chocolate", price: "100.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "L", imageUrl: null },
      { name: "Blueberry Muffin", description: "Fresh blueberry muffin", price: "90.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "M", imageUrl: null },
      { name: "Blueberry Muffin", description: "Fresh blueberry muffin", price: "110.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "L", imageUrl: null },
      { name: "Danish Pastry", description: "Flaky Danish pastry", price: "85.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "M", imageUrl: null },
      { name: "Danish Pastry", description: "Flaky Danish pastry", price: "105.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "L", imageUrl: null },
      { name: "Cinnamon Roll", description: "Sweet cinnamon roll", price: "95.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "M", imageUrl: null },
      { name: "Cinnamon Roll", description: "Sweet cinnamon roll", price: "115.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "L", imageUrl: null },
      { name: "Cheesecake Slice", description: "Creamy cheesecake", price: "120.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "M", imageUrl: null },
      { name: "Cheesecake Slice", description: "Creamy cheesecake", price: "140.00", category: pastryCategory.name, categoryId: pastryCategory.id, size: "L", imageUrl: null }
    ];

    const insertedProducts = await db.insert(products).values(productData).returning();
    console.log(`✅ Generated ${insertedProducts.length} products`);

    // Generate product ingredients (mapping products to ingredients)
    const productIngredientsData = [];
    
    // Map ingredients for each product type
    for (const product of insertedProducts) {
      if (product.category === "COFFEE") {
        productIngredientsData.push(
          { productId: product.id, inventoryId: insertedInventory[0].id, quantity: "20g", size: product.size }, // Espresso Beans
          { productId: product.id, inventoryId: insertedInventory[2].id, quantity: "150ml", size: product.size } // Whole Milk
        );
        
        if (product.name.includes("Vanilla")) {
          productIngredientsData.push({ productId: product.id, inventoryId: insertedInventory[4].id, quantity: "15ml", size: product.size }); // Vanilla Syrup
        }
        if (product.name.includes("Caramel")) {
          productIngredientsData.push({ productId: product.id, inventoryId: insertedInventory[5].id, quantity: "15ml", size: product.size }); // Caramel Syrup
        }
        if (product.name.includes("Mocha")) {
          productIngredientsData.push({ productId: product.id, inventoryId: insertedInventory[6].id, quantity: "15ml", size: product.size }); // Chocolate Syrup
        }
      }
      
      if (product.category === "SHAKE") {
        productIngredientsData.push(
          { productId: product.id, inventoryId: insertedInventory[10].id, quantity: "100g", size: product.size } // Greek Yogurt
        );
        
        if (product.name.includes("Strawberry")) {
          productIngredientsData.push({ productId: product.id, inventoryId: insertedInventory[7].id, quantity: "80g", size: product.size }); // Frozen Strawberries
        }
        if (product.name.includes("Mango")) {
          productIngredientsData.push({ productId: product.id, inventoryId: insertedInventory[8].id, quantity: "100g", size: product.size }); // Frozen Mango
        }
        if (product.name.includes("Banana")) {
          productIngredientsData.push(
            { productId: product.id, inventoryId: insertedInventory[9].id, quantity: "1pc", size: product.size }, // Banana
            { productId: product.id, inventoryId: insertedInventory[11].id, quantity: "20g", size: product.size } // Protein Powder
          );
        }
      }
      
      if (product.category === "FOOD") {
        productIngredientsData.push(
          { productId: product.id, inventoryId: insertedInventory[12].id, quantity: "2pc", size: product.size }, // Bread Slices
          { productId: product.id, inventoryId: insertedInventory[15].id, quantity: "5g", size: product.size } // Butter
        );
        
        if (product.name.includes("Ham")) {
          productIngredientsData.push(
            { productId: product.id, inventoryId: insertedInventory[14].id, quantity: "2pc", size: product.size }, // Ham Slices
            { productId: product.id, inventoryId: insertedInventory[13].id, quantity: "2pc", size: product.size } // Cheese Slices
          );
        }
        if (product.name.includes("Salad")) {
          productIngredientsData.push(
            { productId: product.id, inventoryId: insertedInventory[16].id, quantity: "1pc", size: product.size }, // Lettuce
            { productId: product.id, inventoryId: insertedInventory[17].id, quantity: "50g", size: product.size } // Tomatoes
          );
        }
      }
      
      if (product.category === "PASTRY") {
        productIngredientsData.push(
          { productId: product.id, inventoryId: insertedInventory[18].id, quantity: "100g", size: product.size }, // All-Purpose Flour
          { productId: product.id, inventoryId: insertedInventory[19].id, quantity: "30g", size: product.size }, // Sugar
          { productId: product.id, inventoryId: insertedInventory[20].id, quantity: "1pc", size: product.size } // Eggs
        );
        
        if (product.name.includes("Cheesecake")) {
          productIngredientsData.push({ productId: product.id, inventoryId: insertedInventory[21].id, quantity: "50ml", size: product.size }); // Heavy Cream
        }
      }
    }

    await db.insert(productIngredients).values(productIngredientsData);
    console.log(`✅ Generated ${productIngredientsData.length} product ingredient mappings`);

    // Generate 30 days of sales data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log("🔄 Generating 30 days of sales data...");
    
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // Generate 3-8 orders per day
      const ordersPerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let order = 0; order < ordersPerDay; order++) {
        // Random time during the day
        const orderTime = new Date(currentDate);
        orderTime.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
        orderTime.setMinutes(Math.floor(Math.random() * 60));
        
        // Create order
        const orderData = {
          totalAmount: "0.00", // Will calculate after items
          amountPaid: "0.00",
          change: "0.00",
          userId: 1, // owner user
          createdAt: orderTime
        };
        
        const [newOrder] = await db.insert(orders).values(orderData).returning();
        
        // Add 1-4 items per order
        const itemsPerOrder = Math.floor(Math.random() * 4) + 1;
        let totalOrderAmount = 0;
        
        const orderItemsData = [];
        
        for (let item = 0; item < itemsPerOrder; item++) {
          const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const price = parseFloat(randomProduct.price);
          const totalPrice = price * quantity;
          
          orderItemsData.push({
            orderId: newOrder.id,
            productId: randomProduct.id,
            quantity,
            price: randomProduct.price,
            totalPrice: totalPrice.toFixed(2)
          });
          
          totalOrderAmount += totalPrice;
        }
        
        await db.insert(orderItems).values(orderItemsData);
        
        // Update order with total amount
        const amountPaid = totalOrderAmount + (Math.floor(Math.random() * 50)); // Add some change
        const change = amountPaid - totalOrderAmount;
        
        await db.update(orders)
          .set({
            totalAmount: totalOrderAmount.toFixed(2),
            amountPaid: amountPaid.toFixed(2),
            change: change.toFixed(2)
          })
          .where({ id: newOrder.id });
      }
    }
    
    console.log("✅ Generated 30 days of sales data");
    console.log("🎉 Test data generation completed successfully!");
    
  } catch (error) {
    console.error("❌ Error generating test data:", error);
    throw error;
  }
}

generateTestData()
  .then(() => {
    console.log("✅ Test data generation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test data generation failed:", error);
    process.exit(1);
  });