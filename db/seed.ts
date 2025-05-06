import { db } from "./index";
import { users, categories, products, inventory } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if we already have users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      // Create default users (owner and barista)
      await db.insert(users).values([
        {
          username: "owner",
          password: await hashPassword("password123"),
          role: "owner",
        },
        {
          username: "barista",
          password: await hashPassword("password123"),
          role: "barista",
        },
      ]);
    }

    // Check if we already have categories
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log("Seeding categories...");
      // Create product categories
      await db.insert(categories).values([
        { name: "COFFEE", displayOrder: 1 },
        { name: "SHAKE", displayOrder: 2 },
        { name: "FOOD", displayOrder: 3 },
        { name: "OTHERS", displayOrder: 4 },
      ]);
    }

    // Get category IDs
    const categoryRows = await db.select().from(categories);
    const categoryMap = categoryRows.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {} as Record<string, number>);

    // Check if we already have products
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0 && Object.keys(categoryMap).length > 0) {
      console.log("Seeding products...");
      
      // Coffee products
      await db.insert(products).values([
        {
          name: "AMERICANO",
          price: 115,
          imageUrl: "https://images.unsplash.com/photo-1521302080334-4bebac2763a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["COFFEE"],
        },
        {
          name: "CAPPUCCINO",
          price: 130,
          imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["COFFEE"],
        },
        {
          name: "LATTE",
          price: 80,
          imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["COFFEE"],
        },
        {
          name: "FLAT WHITE",
          price: 120,
          imageUrl: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["COFFEE"],
        },
        {
          name: "CAFE AU LAIT",
          price: 160,
          imageUrl: "https://pixabay.com/get/g687e08a35dce1ef090c4a9014a2cecefe1a0cbf0703889dbd243eacd26a307f0b91c1991dfb4b458c20cbf2c60a58659bb7abf84fa2a16bf9a2e606af0c26658_1280.jpg",
          categoryId: categoryMap["COFFEE"],
        },
        {
          name: "ESPRESSO",
          price: 200,
          imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["COFFEE"],
        },
      ]);
      
      // Shake products
      await db.insert(products).values([
        {
          name: "CHOCOLATE",
          price: 150,
          imageUrl: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["SHAKE"],
        },
        {
          name: "VANILLA BISCOFF",
          price: 160,
          imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["SHAKE"],
        },
        {
          name: "BLACK FOREST",
          price: 170,
          imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["SHAKE"],
        },
        {
          name: "FLAT WHITE",
          price: 155,
          imageUrl: "https://images.unsplash.com/photo-1638176052533-5654d38deces?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["SHAKE"],
        },
        {
          name: "CAFE MOCHA",
          price: 165,
          imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["SHAKE"],
        },
        {
          name: "JAVA CHIP",
          price: 180,
          imageUrl: "https://images.unsplash.com/photo-1578314675249-a6910f80cc39?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["SHAKE"],
        },
      ]);
      
      // Food products
      await db.insert(products).values([
        {
          name: "BAVARIAN",
          price: 95,
          imageUrl: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["FOOD"],
        },
        {
          name: "WHITE CHOCO",
          price: 105,
          imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["FOOD"],
        },
        {
          name: "MATCHA",
          price: 115,
          imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["FOOD"],
        },
        {
          name: "BUTTER BLONDIE",
          price: 100,
          imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["FOOD"],
        },
        {
          name: "STRAWBERRY",
          price: 110,
          imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["FOOD"],
        },
        {
          name: "CHARCOAL",
          price: 120,
          imageUrl: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
          categoryId: categoryMap["FOOD"],
        },
      ]);
    }

    // Check if we already have inventory items
    const existingInventoryItems = await db.select().from(inventory);
    if (existingInventoryItems.length === 0) {
      console.log("Seeding inventory...");
      // Create inventory items
      await db.insert(inventory).values([
        {
          name: "MILK",
          currentStock: 3,
          minimumThreshold: 2,
          unit: "BOX",
        },
        {
          name: "JAVA CHIP",
          currentStock: 1,
          minimumThreshold: 1,
          unit: "KL",
        },
        {
          name: "WHIP CREAM",
          currentStock: 3,
          minimumThreshold: 1,
          unit: "BOX",
        },
        {
          name: "SUGAR",
          currentStock: 2,
          minimumThreshold: 1,
          unit: "KL",
        },
        {
          name: "COFFEE BEANS",
          currentStock: 1,
          minimumThreshold: 2,
          unit: "KL",
        },
        {
          name: "CUPS",
          currentStock: 100,
          minimumThreshold: 50,
          unit: "PCS",
        },
      ]);
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error during database seed:", error);
  }
}

seed();
