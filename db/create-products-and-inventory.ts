import { db } from "./index";
import { categories, products, inventory, productIngredients } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createInventoryAndProducts() {
  console.log("Creating inventory ingredients and products...");

  // Clear existing data
  await db.delete(productIngredients);
  await db.delete(products);
  await db.delete(inventory);

  // Create inventory ingredients
  const inventoryItems = [
    // Coffee ingredients
    { name: "Coffee Beans", currentStock: "5000", minimumThreshold: "500", unit: "g", containerType: "bag", containerQuantity: "5", secondaryUnit: "piece", quantityPerUnit: "1000", numberOfContainers: "5" },
    { name: "Milk", currentStock: "10000", minimumThreshold: "1000", unit: "ml", containerType: "box", containerQuantity: "10", secondaryUnit: "piece", quantityPerUnit: "1000", numberOfContainers: "10" },
    { name: "Sugar", currentStock: "3000", minimumThreshold: "300", unit: "g", containerType: "pack", containerQuantity: "6", secondaryUnit: "piece", quantityPerUnit: "500", numberOfContainers: "6" },
    { name: "Vanilla Syrup", currentStock: "2000", minimumThreshold: "200", unit: "ml", containerType: "bottle", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "500", numberOfContainers: "4" },
    { name: "Caramel Syrup", currentStock: "1500", minimumThreshold: "150", unit: "ml", containerType: "bottle", containerQuantity: "3", secondaryUnit: "piece", quantityPerUnit: "500", numberOfContainers: "3" },
    { name: "Whipped Cream", currentStock: "1000", minimumThreshold: "100", unit: "ml", containerType: "can", containerQuantity: "5", secondaryUnit: "piece", quantityPerUnit: "200", numberOfContainers: "5" },

    // Pastry ingredients
    { name: "Flour", currentStock: "8000", minimumThreshold: "800", unit: "g", containerType: "bag", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "2000", numberOfContainers: "4" },
    { name: "Butter", currentStock: "2000", minimumThreshold: "200", unit: "g", containerType: "pack", containerQuantity: "8", secondaryUnit: "piece", quantityPerUnit: "250", numberOfContainers: "8" },
    { name: "Eggs", currentStock: "60", minimumThreshold: "12", unit: "pc", containerType: "tray", containerQuantity: "5", secondaryUnit: "piece", quantityPerUnit: "12", numberOfContainers: "5" },
    { name: "Chocolate Chips", currentStock: "1500", minimumThreshold: "150", unit: "g", containerType: "pack", containerQuantity: "6", secondaryUnit: "piece", quantityPerUnit: "250", numberOfContainers: "6" },
    { name: "Cream Cheese", currentStock: "1000", minimumThreshold: "100", unit: "g", containerType: "pack", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "250", numberOfContainers: "4" },

    // Sandwich ingredients
    { name: "Bread", currentStock: "40", minimumThreshold: "8", unit: "pc", containerType: "pack", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "10", numberOfContainers: "4" },
    { name: "Ham", currentStock: "2000", minimumThreshold: "200", unit: "g", containerType: "pack", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "500", numberOfContainers: "4" },
    { name: "Cheese Slices", currentStock: "80", minimumThreshold: "20", unit: "pc", containerType: "pack", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "20", numberOfContainers: "4" },
    { name: "Lettuce", currentStock: "15", minimumThreshold: "3", unit: "pc", containerType: "piece", containerQuantity: "15", secondaryUnit: "piece", quantityPerUnit: "1", numberOfContainers: "15" },
    { name: "Tomatoes", currentStock: "20", minimumThreshold: "5", unit: "pc", containerType: "piece", containerQuantity: "20", secondaryUnit: "piece", quantityPerUnit: "1", numberOfContainers: "20" },

    // Others ingredients
    { name: "Yakult Bottles", currentStock: "48", minimumThreshold: "12", unit: "pc", containerType: "pack", containerQuantity: "4", secondaryUnit: "piece", quantityPerUnit: "12", numberOfContainers: "4" },
    { name: "Coca Cola", currentStock: "24", minimumThreshold: "6", unit: "pc", containerType: "case", containerQuantity: "2", secondaryUnit: "bottle", quantityPerUnit: "12", numberOfContainers: "2" },
    { name: "San Miguel Beer", currentStock: "24", minimumThreshold: "6", unit: "pc", containerType: "case", containerQuantity: "2", secondaryUnit: "bottle", quantityPerUnit: "12", numberOfContainers: "2" }
  ];

  console.log("Creating inventory items...");
  const createdInventory = await db.insert(inventory).values(inventoryItems).returning();
  console.log(`Created ${createdInventory.length} inventory items`);

  // Get existing categories or create them
  let coffeeCategory = await db.query.categories.findFirst({
    where: eq(categories.name, "COFFEE")
  });
  let pastryCategory = await db.query.categories.findFirst({
    where: eq(categories.name, "PASTRY")
  });
  let sandwichCategory = await db.query.categories.findFirst({
    where: eq(categories.name, "SANDWICH")
  });
  let othersCategory = await db.query.categories.findFirst({
    where: eq(categories.name, "OTHERS")
  });

  // Create missing categories
  const categoriesToCreate = [];
  if (!coffeeCategory) categoriesToCreate.push({ name: "COFFEE", description: "Coffee beverages and drinks", displayOrder: 1 });
  if (!pastryCategory) categoriesToCreate.push({ name: "PASTRY", description: "Baked goods and pastries", displayOrder: 2 });
  if (!sandwichCategory) categoriesToCreate.push({ name: "SANDWICH", description: "Sandwiches and wraps", displayOrder: 3 });
  if (!othersCategory) categoriesToCreate.push({ name: "OTHERS", description: "Other beverages and snacks", displayOrder: 4 });

  if (categoriesToCreate.length > 0) {
    console.log("Creating missing categories...");
    const createdCategories = await db.insert(categories).values(categoriesToCreate).returning();
    if (!coffeeCategory) coffeeCategory = createdCategories.find(c => c.name === "COFFEE");
    if (!pastryCategory) pastryCategory = createdCategories.find(c => c.name === "PASTRY");
    if (!sandwichCategory) sandwichCategory = createdCategories.find(c => c.name === "SANDWICH");
    if (!othersCategory) othersCategory = createdCategories.find(c => c.name === "OTHERS");
  }

  // Create products
  const productsData = [
    // Coffee products
    { name: "Americano", description: "Classic black coffee", price: "120.00", categoryId: coffeeCategory!.id, imageUrl: "/svg/coffee-cup.svg", size: "M" },
    { name: "Americano", description: "Classic black coffee", price: "150.00", categoryId: coffeeCategory!.id, imageUrl: "/svg/coffee-cup.svg", size: "L" },
    { name: "Cappuccino", description: "Espresso with steamed milk foam", price: "140.00", categoryId: coffeeCategory!.id, imageUrl: "/svg/coffee-cup.svg", size: "M" },
    { name: "Cappuccino", description: "Espresso with steamed milk foam", price: "170.00", categoryId: coffeeCategory!.id, imageUrl: "/svg/coffee-cup.svg", size: "L" },
    { name: "Caramel Latte", description: "Smooth latte with caramel syrup", price: "160.00", categoryId: coffeeCategory!.id, imageUrl: "/svg/coffee-cup.svg", size: "M" },
    { name: "Caramel Latte", description: "Smooth latte with caramel syrup", price: "190.00", categoryId: coffeeCategory!.id, imageUrl: "/svg/coffee-cup.svg", size: "L" },

    // Pastry products
    { name: "Chocolate Croissant", description: "Buttery croissant with chocolate", price: "85.00", categoryId: pastryCategory!.id, imageUrl: "/svg/croissant.svg", size: "M" },
    { name: "Blueberry Muffin", description: "Fresh baked muffin with blueberries", price: "95.00", categoryId: pastryCategory!.id, imageUrl: "/svg/muffin.svg", size: "M" },
    { name: "Cheesecake Slice", description: "Creamy New York style cheesecake", price: "125.00", categoryId: pastryCategory!.id, imageUrl: "/svg/cake.svg", size: "M" },

    // Sandwich products
    { name: "Ham & Cheese", description: "Classic ham and cheese sandwich", price: "110.00", categoryId: sandwichCategory!.id, imageUrl: "/svg/sandwich.svg", size: "M" },
    { name: "Club Sandwich", description: "Triple layer club sandwich", price: "145.00", categoryId: sandwichCategory!.id, imageUrl: "/svg/sandwich.svg", size: "M" },
    { name: "Grilled Cheese", description: "Melted cheese on toasted bread", price: "95.00", categoryId: sandwichCategory!.id, imageUrl: "/svg/sandwich.svg", size: "M" },

    // Others products
    { name: "Yakult", description: "Probiotic drink", price: "25.00", categoryId: othersCategory!.id, imageUrl: "/svg/bottle.svg", size: "M" },
    { name: "Coca Cola", description: "Classic cola drink", price: "45.00", categoryId: othersCategory!.id, imageUrl: "/svg/soda.svg", size: "M" },
    { name: "San Miguel Beer", description: "Premium lager beer", price: "75.00", categoryId: othersCategory!.id, imageUrl: "/svg/beer.svg", size: "M" }
  ];

  console.log("Creating products...");
  const createdProducts = await db.insert(products).values(productsData).returning();
  console.log(`Created ${createdProducts.length} products`);

  // Create product ingredients
  const productIngredientsData = [];

  // Coffee ingredients
  const americanoM = createdProducts.find(p => p.name === "Americano" && p.size === "M");
  const americanoL = createdProducts.find(p => p.name === "Americano" && p.size === "L");
  const cappuccinoM = createdProducts.find(p => p.name === "Cappuccino" && p.size === "M");
  const cappuccinoL = createdProducts.find(p => p.name === "Cappuccino" && p.size === "L");
  const caramelLatteM = createdProducts.find(p => p.name === "Caramel Latte" && p.size === "M");
  const caramelLatteL = createdProducts.find(p => p.name === "Caramel Latte" && p.size === "L");

  const coffeeBeans = createdInventory.find(i => i.name === "Coffee Beans");
  const milk = createdInventory.find(i => i.name === "Milk");
  const sugar = createdInventory.find(i => i.name === "Sugar");
  const caramelSyrup = createdInventory.find(i => i.name === "Caramel Syrup");
  const whippedCream = createdInventory.find(i => i.name === "Whipped Cream");

  // Americano ingredients
  if (americanoM && coffeeBeans && sugar) {
    productIngredientsData.push(
      { productId: americanoM.id, inventoryId: coffeeBeans.id, quantityUsed: "15", size: "M" },
      { productId: americanoM.id, inventoryId: sugar.id, quantityUsed: "5", size: "M" }
    );
  }
  if (americanoL && coffeeBeans && sugar) {
    productIngredientsData.push(
      { productId: americanoL.id, inventoryId: coffeeBeans.id, quantityUsed: "20", size: "L" },
      { productId: americanoL.id, inventoryId: sugar.id, quantityUsed: "8", size: "L" }
    );
  }

  // Cappuccino ingredients
  if (cappuccinoM && coffeeBeans && milk && sugar) {
    productIngredientsData.push(
      { productId: cappuccinoM.id, inventoryId: coffeeBeans.id, quantityUsed: "12", size: "M" },
      { productId: cappuccinoM.id, inventoryId: milk.id, quantityUsed: "100", size: "M" },
      { productId: cappuccinoM.id, inventoryId: sugar.id, quantityUsed: "5", size: "M" }
    );
  }
  if (cappuccinoL && coffeeBeans && milk && sugar) {
    productIngredientsData.push(
      { productId: cappuccinoL.id, inventoryId: coffeeBeans.id, quantityUsed: "18", size: "L" },
      { productId: cappuccinoL.id, inventoryId: milk.id, quantityUsed: "150", size: "L" },
      { productId: cappuccinoL.id, inventoryId: sugar.id, quantityUsed: "8", size: "L" }
    );
  }

  // Caramel Latte ingredients
  if (caramelLatteM && coffeeBeans && milk && caramelSyrup && whippedCream) {
    productIngredientsData.push(
      { productId: caramelLatteM.id, inventoryId: coffeeBeans.id, quantityUsed: "12", size: "M" },
      { productId: caramelLatteM.id, inventoryId: milk.id, quantityUsed: "120", size: "M" },
      { productId: caramelLatteM.id, inventoryId: caramelSyrup.id, quantityUsed: "15", size: "M" },
      { productId: caramelLatteM.id, inventoryId: whippedCream.id, quantityUsed: "10", size: "M" }
    );
  }
  if (caramelLatteL && coffeeBeans && milk && caramelSyrup && whippedCream) {
    productIngredientsData.push(
      { productId: caramelLatteL.id, inventoryId: coffeeBeans.id, quantityUsed: "18", size: "L" },
      { productId: caramelLatteL.id, inventoryId: milk.id, quantityUsed: "180", size: "L" },
      { productId: caramelLatteL.id, inventoryId: caramelSyrup.id, quantityUsed: "25", size: "L" },
      { productId: caramelLatteL.id, inventoryId: whippedCream.id, quantityUsed: "15", size: "L" }
    );
  }

  // Pastry ingredients
  const croissant = createdProducts.find(p => p.name === "Chocolate Croissant");
  const muffin = createdProducts.find(p => p.name === "Blueberry Muffin");
  const cheesecake = createdProducts.find(p => p.name === "Cheesecake Slice");

  const flour = createdInventory.find(i => i.name === "Flour");
  const butter = createdInventory.find(i => i.name === "Butter");
  const eggs = createdInventory.find(i => i.name === "Eggs");
  const chocolateChips = createdInventory.find(i => i.name === "Chocolate Chips");
  const creamCheese = createdInventory.find(i => i.name === "Cream Cheese");

  if (croissant && flour && butter && chocolateChips) {
    productIngredientsData.push(
      { productId: croissant.id, inventoryId: flour.id, quantityUsed: "80", size: "M" },
      { productId: croissant.id, inventoryId: butter.id, quantityUsed: "25", size: "M" },
      { productId: croissant.id, inventoryId: chocolateChips.id, quantityUsed: "15", size: "M" }
    );
  }

  if (muffin && flour && eggs && butter) {
    productIngredientsData.push(
      { productId: muffin.id, inventoryId: flour.id, quantityUsed: "60", size: "M" },
      { productId: muffin.id, inventoryId: eggs.id, quantityUsed: "1", size: "M" },
      { productId: muffin.id, inventoryId: butter.id, quantityUsed: "20", size: "M" }
    );
  }

  if (cheesecake && creamCheese && eggs && flour) {
    productIngredientsData.push(
      { productId: cheesecake.id, inventoryId: creamCheese.id, quantityUsed: "100", size: "M" },
      { productId: cheesecake.id, inventoryId: eggs.id, quantityUsed: "1", size: "M" },
      { productId: cheesecake.id, inventoryId: flour.id, quantityUsed: "30", size: "M" }
    );
  }

  // Sandwich ingredients
  const hamCheese = createdProducts.find(p => p.name === "Ham & Cheese");
  const clubSandwich = createdProducts.find(p => p.name === "Club Sandwich");
  const grilledCheese = createdProducts.find(p => p.name === "Grilled Cheese");

  const bread = createdInventory.find(i => i.name === "Bread");
  const ham = createdInventory.find(i => i.name === "Ham");
  const cheeseSlices = createdInventory.find(i => i.name === "Cheese Slices");
  const lettuce = createdInventory.find(i => i.name === "Lettuce");
  const tomatoes = createdInventory.find(i => i.name === "Tomatoes");

  if (hamCheese && bread && ham && cheeseSlices) {
    productIngredientsData.push(
      { productId: hamCheese.id, inventoryId: bread.id, quantityUsed: "2", size: "M" },
      { productId: hamCheese.id, inventoryId: ham.id, quantityUsed: "50", size: "M" },
      { productId: hamCheese.id, inventoryId: cheeseSlices.id, quantityUsed: "1", size: "M" }
    );
  }

  if (clubSandwich && bread && ham && cheeseSlices && lettuce && tomatoes) {
    productIngredientsData.push(
      { productId: clubSandwich.id, inventoryId: bread.id, quantityUsed: "3", size: "M" },
      { productId: clubSandwich.id, inventoryId: ham.id, quantityUsed: "75", size: "M" },
      { productId: clubSandwich.id, inventoryId: cheeseSlices.id, quantityUsed: "2", size: "M" },
      { productId: clubSandwich.id, inventoryId: lettuce.id, quantityUsed: "1", size: "M" },
      { productId: clubSandwich.id, inventoryId: tomatoes.id, quantityUsed: "1", size: "M" }
    );
  }

  if (grilledCheese && bread && cheeseSlices && butter) {
    productIngredientsData.push(
      { productId: grilledCheese.id, inventoryId: bread.id, quantityUsed: "2", size: "M" },
      { productId: grilledCheese.id, inventoryId: cheeseSlices.id, quantityUsed: "2", size: "M" },
      { productId: grilledCheese.id, inventoryId: butter.id, quantityUsed: "10", size: "M" }
    );
  }

  // Others ingredients (ready-to-serve items)
  const yakult = createdProducts.find(p => p.name === "Yakult");
  const cola = createdProducts.find(p => p.name === "Coca Cola");
  const beer = createdProducts.find(p => p.name === "San Miguel Beer");

  const yakultBottles = createdInventory.find(i => i.name === "Yakult Bottles");
  const cocaCola = createdInventory.find(i => i.name === "Coca Cola");
  const sanMiguelBeer = createdInventory.find(i => i.name === "San Miguel Beer");

  if (yakult && yakultBottles) {
    productIngredientsData.push(
      { productId: yakult.id, inventoryId: yakultBottles.id, quantityUsed: "1", size: "M" }
    );
  }

  if (cola && cocaCola) {
    productIngredientsData.push(
      { productId: cola.id, inventoryId: cocaCola.id, quantityUsed: "1", size: "M" }
    );
  }

  if (beer && sanMiguelBeer) {
    productIngredientsData.push(
      { productId: beer.id, inventoryId: sanMiguelBeer.id, quantityUsed: "1", size: "M" }
    );
  }

  console.log("Creating product ingredients...");
  if (productIngredientsData.length > 0) {
    const createdProductIngredients = await db.insert(productIngredients).values(productIngredientsData).returning();
    console.log(`Created ${createdProductIngredients.length} product ingredient relationships`);
  }

  console.log("✅ All inventory and products created successfully!");
}

createInventoryAndProducts().catch(console.error);