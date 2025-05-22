import { db } from "./index";
import { 
  users, 
  categories, 
  inventory, 
  products, 
  productIngredients, 
  orders, 
  orderItems 
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function deleteAllOrderData() {
  console.log("Deleting all order items...");
  await db.delete(orderItems);
  
  console.log("Deleting all orders...");
  await db.delete(orders);
  
  console.log("All order data deleted");
}

async function deleteAllProductData() {
  console.log("Deleting all product ingredients...");
  await db.delete(productIngredients);
  
  console.log("Deleting all products...");
  await db.delete(products);
  
  console.log("All product data deleted");
}

async function deleteAllInventory() {
  console.log("Deleting all inventory items...");
  await db.delete(inventory);
  console.log("All inventory items deleted");
}

async function createInventoryItems() {
  console.log("Creating inventory items...");
  
  // Coffee ingredients
  await db.insert(inventory).values([
    { name: "Coffee Beans", currentStock: "2000.00", minimumThreshold: "500.00", unit: "g", containerType: "Box", containerQuantity: "4.00", secondaryUnit: "piece", quantityPerUnit: "500.00", numberOfContainers: "4.00" },
    { name: "Milk", currentStock: "5000.00", minimumThreshold: "1000.00", unit: "ml", containerType: "Case", containerQuantity: "10.00", secondaryUnit: "Bottle", quantityPerUnit: "500.00", numberOfContainers: "10.00" },
    { name: "Sugar", currentStock: "3000.00", minimumThreshold: "500.00", unit: "g", containerType: "Pack", containerQuantity: "6.00", secondaryUnit: "piece", quantityPerUnit: "500.00", numberOfContainers: "6.00" },
    { name: "Cups", currentStock: "100.00", minimumThreshold: "20.00", unit: "pc", containerType: "Pack", containerQuantity: "10.00", secondaryUnit: "piece", quantityPerUnit: "10.00", numberOfContainers: "10.00" },
    { name: "Water", currentStock: "10000.00", minimumThreshold: "2000.00", unit: "ml", containerType: "Case", containerQuantity: "20.00", secondaryUnit: "Bottle", quantityPerUnit: "500.00", numberOfContainers: "20.00" }
  ]);
  
  // Coffee flavorings
  await db.insert(inventory).values([
    { name: "Chocolate Syrup", currentStock: "1000.00", minimumThreshold: "200.00", unit: "ml" },
    { name: "Caramel Syrup", currentStock: "1000.00", minimumThreshold: "200.00", unit: "ml" },
    { name: "Vanilla Syrup", currentStock: "1000.00", minimumThreshold: "200.00", unit: "ml" },
    { name: "Whipped Cream", currentStock: "1000.00", minimumThreshold: "200.00", unit: "g" }
  ]);
  
  // Shake ingredients
  await db.insert(inventory).values([
    { name: "Ice", currentStock: "5000.00", minimumThreshold: "1000.00", unit: "g" },
    { name: "Chocolate Powder", currentStock: "1000.00", minimumThreshold: "200.00", unit: "g" },
    { name: "Strawberry Syrup", currentStock: "1000.00", minimumThreshold: "200.00", unit: "ml" },
    { name: "Banana", currentStock: "30", minimumThreshold: "10", unit: "pcs" },
    { name: "Matcha Powder", currentStock: "500.00", minimumThreshold: "100.00", unit: "g" }
  ]);
  
  // Food ingredients
  await db.insert(inventory).values([
    { name: "Bread", currentStock: "20", minimumThreshold: "5", unit: "pcs" },
    { name: "Butter", currentStock: "500.00", minimumThreshold: "100.00", unit: "g" },
    { name: "Chicken", currentStock: "2000.00", minimumThreshold: "500.00", unit: "g" },
    { name: "Lettuce", currentStock: "500.00", minimumThreshold: "100.00", unit: "g" },
    { name: "Tomato", currentStock: "10", minimumThreshold: "3", unit: "pcs" },
    { name: "Cheese", currentStock: "500.00", minimumThreshold: "100.00", unit: "g" },
    { name: "Eggs", currentStock: "24", minimumThreshold: "6", unit: "pcs" }
  ]);
  
  // Others
  await db.insert(inventory).values([
    { name: "Yakult", currentStock: "24", minimumThreshold: "6", unit: "pcs" },
    { name: "Bottled Water", currentStock: "36", minimumThreshold: "12", unit: "pcs" },
    { name: "Juice Concentrate", currentStock: "2000.00", minimumThreshold: "500.00", unit: "ml" }
  ]);
  
  console.log("Inventory items created");
}

async function createProductsWithIngredients() {
  console.log("Creating products with ingredients...");
  
  // Get category IDs
  const categoryResults = await db.select().from(categories);
  const categoryIdMap = new Map();
  categoryResults.forEach(cat => {
    categoryIdMap.set(cat.name, cat.id);
  });
  
  // Get inventory item IDs
  const inventoryResults = await db.select().from(inventory);
  const inventoryIdMap = new Map();
  inventoryResults.forEach(item => {
    inventoryIdMap.set(item.name, item.id);
  });
  
  // Helper function to create a product with ingredients
  async function createProduct(name: string, price: string, category: string, size: string, imageUrl: string, ingredients: Array<{name: string, quantity: string}>) {
    const [product] = await db.insert(products).values({
      name: name,
      price: price,
      categoryId: categoryIdMap.get(category),
      size: size,
      imageUrl: imageUrl
    }).returning();
    
    // Add ingredients
    for (const ingredient of ingredients) {
      const inventoryId = inventoryIdMap.get(ingredient.name);
      if (inventoryId) {
        await db.insert(productIngredients).values({
          productId: product.id,
          inventoryId: inventoryId,
          quantityUsed: ingredient.quantity
        });
      } else {
        console.warn(`Ingredient ${ingredient.name} not found in inventory`);
      }
    }
    
    return product;
  }
  
  // Coffee products
  console.log("Creating coffee products...");
  
  // Americano
  await createProduct(
    "Americano", "120", "COFFEE", "M",
    "/uploads/image-1746290296174-253574841.webp",
    [
      { name: "Coffee Beans", quantity: "20" },
      { name: "Water", quantity: "200" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Americano", "150", "COFFEE", "L",
    "/uploads/image-1746290296174-253574841.webp",
    [
      { name: "Coffee Beans", quantity: "30" },
      { name: "Water", quantity: "300" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Latte
  await createProduct(
    "Latte", "140", "COFFEE", "M",
    "/uploads/image-1746290312323-935963628.webp",
    [
      { name: "Coffee Beans", quantity: "20" },
      { name: "Milk", quantity: "150" },
      { name: "Water", quantity: "50" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Latte", "170", "COFFEE", "L",
    "/uploads/image-1746290312323-935963628.webp",
    [
      { name: "Coffee Beans", quantity: "30" },
      { name: "Milk", quantity: "200" },
      { name: "Water", quantity: "100" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Cappuccino
  await createProduct(
    "Cappuccino", "140", "COFFEE", "M",
    "/uploads/image-1746290358432-583255790.webp",
    [
      { name: "Coffee Beans", quantity: "20" },
      { name: "Milk", quantity: "100" },
      { name: "Water", quantity: "100" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Cappuccino", "170", "COFFEE", "L",
    "/uploads/image-1746290358432-583255790.webp",
    [
      { name: "Coffee Beans", quantity: "30" },
      { name: "Milk", quantity: "150" },
      { name: "Water", quantity: "150" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Mocha
  await createProduct(
    "Mocha", "150", "COFFEE", "M",
    "/uploads/image-1746290378903-793498495.webp",
    [
      { name: "Coffee Beans", quantity: "20" },
      { name: "Milk", quantity: "100" },
      { name: "Chocolate Syrup", quantity: "30" },
      { name: "Water", quantity: "50" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Mocha", "180", "COFFEE", "L",
    "/uploads/image-1746290378903-793498495.webp",
    [
      { name: "Coffee Beans", quantity: "30" },
      { name: "Milk", quantity: "150" },
      { name: "Chocolate Syrup", quantity: "45" },
      { name: "Water", quantity: "75" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Shake products
  console.log("Creating shake products...");
  
  // Chocolate Shake
  await createProduct(
    "Chocolate Shake", "150", "SHAKE", "M",
    "/uploads/image-1746290340862-967622625.webp",
    [
      { name: "Chocolate Powder", quantity: "30" },
      { name: "Milk", quantity: "200" },
      { name: "Ice", quantity: "100" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Chocolate Shake", "180", "SHAKE", "L",
    "/uploads/image-1746290340862-967622625.webp",
    [
      { name: "Chocolate Powder", quantity: "45" },
      { name: "Milk", quantity: "300" },
      { name: "Ice", quantity: "150" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Matcha Shake
  await createProduct(
    "Matcha Shake", "160", "SHAKE", "M",
    "/uploads/image-1746290423442-680398075.webp",
    [
      { name: "Matcha Powder", quantity: "30" },
      { name: "Milk", quantity: "200" },
      { name: "Ice", quantity: "100" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Matcha Shake", "190", "SHAKE", "L",
    "/uploads/image-1746290423442-680398075.webp",
    [
      { name: "Matcha Powder", quantity: "45" },
      { name: "Milk", quantity: "300" },
      { name: "Ice", quantity: "150" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Strawberry Shake
  await createProduct(
    "Strawberry Shake", "150", "SHAKE", "M",
    "/uploads/image-1746290440722-238593064.webp",
    [
      { name: "Strawberry Syrup", quantity: "30" },
      { name: "Milk", quantity: "200" },
      { name: "Ice", quantity: "100" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  await createProduct(
    "Strawberry Shake", "180", "SHAKE", "L",
    "/uploads/image-1746290440722-238593064.webp",
    [
      { name: "Strawberry Syrup", quantity: "45" },
      { name: "Milk", quantity: "300" },
      { name: "Ice", quantity: "150" },
      { name: "Cups", quantity: "1" }
    ]
  );
  
  // Food products
  console.log("Creating food products...");
  
  // Sandwich
  await createProduct(
    "Chicken Sandwich", "150", "FOOD", "M",
    "/uploads/image-1746290456052-764177293.webp",
    [
      { name: "Bread", quantity: "2" },
      { name: "Chicken", quantity: "100" },
      { name: "Lettuce", quantity: "20" },
      { name: "Tomato", quantity: "0.5" },
      { name: "Cheese", quantity: "30" }
    ]
  );
  
  // Omelette
  await createProduct(
    "Cheese Omelette", "130", "FOOD", "M",
    "/uploads/image-1746290478913-435559022.webp",
    [
      { name: "Eggs", quantity: "3" },
      { name: "Cheese", quantity: "50" },
      { name: "Butter", quantity: "10" }
    ]
  );
  
  // Others products
  console.log("Creating other products...");
  
  // Yakult
  await createProduct(
    "Yakult", "40", "OTHERS", "M",
    "/uploads/image-1746290499653-553397050.webp",
    [
      { name: "Yakult", quantity: "1" }
    ]
  );
  
  // Bottled Water
  await createProduct(
    "Bottled Water", "25", "OTHERS", "M",
    "/uploads/image-1746290520042-918835649.webp",
    [
      { name: "Bottled Water", quantity: "1" }
    ]
  );
  
  console.log("All products created with ingredients");
}

async function seed() {
  console.log("Starting database seed...");

  try {
    // Categories
    console.log("Seeding categories...");
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        { name: "COFFEE", displayOrder: 1 },
        { name: "SHAKE", displayOrder: 2 },
        { name: "FOOD", displayOrder: 3 },
        { name: "OTHERS", displayOrder: 4 }
      ]);
      console.log("Categories seeded successfully");
    } else {
      console.log("Categories already exist, skipping");
    }
    
    // Users
    console.log("Seeding users...");
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      await db.insert(users).values([
        { 
          username: "owner", 
          password: await hashPassword("password"), 
          role: "owner" 
        },
        { 
          username: "barista", 
          password: await hashPassword("password123"), 
          role: "barista" 
        }
      ]);
      console.log("Users seeded successfully");
    } else {
      console.log("Users already exist, skipping");
    }
    
    // Delete existing data for fresh start
    await deleteAllOrderData();
    await deleteAllProductData();
    await deleteAllInventory();
    
    // Create new inventory and products
    await createInventoryItems();
    await createProductsWithIngredients();
    
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
