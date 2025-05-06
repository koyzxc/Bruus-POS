import { db } from "@db";
import { users, categories, products, inventory, orders, orderItems } from "@shared/schema";
import { User, InsertUser } from "@shared/schema";
import { eq, and, gt, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser: (id: number) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  createUser: (userData: InsertUser) => Promise<User>;
  
  // Products methods
  getProductsByCategory: (category: string) => Promise<typeof products.$inferSelect[]>;
  
  // Inventory methods
  getAllInventoryItems: () => Promise<typeof inventory.$inferSelect[]>;
  getLowStockItems: () => Promise<typeof inventory.$inferSelect[]>;
  updateInventoryForOrder: (productId: number, quantity: number) => Promise<void>;
  
  // Order methods
  createOrder: (orderId: object, items: any[], userId: number) => Promise<typeof orders.$inferSelect>;
  
  // Sales methods
  getSalesData: () => Promise<any[]>;
  
  // Session store
  sessionStore: session.Store;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  // Products methods
  async getProductsByCategory(category: string): Promise<typeof products.$inferSelect[]> {
    const categoryRecord = await db.select().from(categories).where(eq(categories.name, category));
    
    if (!categoryRecord[0]) return [];
    
    return db.select().from(products).where(eq(products.categoryId, categoryRecord[0].id));
  }
  
  // Inventory methods
  async getAllInventoryItems(): Promise<typeof inventory.$inferSelect[]> {
    return db.select().from(inventory);
  }
  
  async getLowStockItems(): Promise<typeof inventory.$inferSelect[]> {
    return db.select().from(inventory).where(
      lte(inventory.currentStock, inventory.minimumThreshold)
    );
  }
  
  async updateInventoryForOrder(productId: number, quantity: number): Promise<void> {
    // This would require a more complex implementation in a real system
    // For now, we'll just show how to decrease inventory when an order is placed
    const productRecord = await db.select().from(products).where(eq(products.id, productId));
    
    if (!productRecord[0]) return;
    
    // Get related inventory items for this product
    // For simplicity, we'll just decrease coffee beans and cups
    const coffeeBeansInventory = await db.select().from(inventory).where(eq(inventory.name, "COFFEE BEANS"));
    const cupsInventory = await db.select().from(inventory).where(eq(inventory.name, "CUPS"));
    
    if (coffeeBeansInventory[0]) {
      await db.update(inventory)
        .set({
          currentStock: Number(coffeeBeansInventory[0].currentStock) - (0.05 * quantity),
          updatedAt: new Date()
        })
        .where(eq(inventory.id, coffeeBeansInventory[0].id));
    }
    
    if (cupsInventory[0]) {
      await db.update(inventory)
        .set({
          currentStock: Number(cupsInventory[0].currentStock) - quantity,
          updatedAt: new Date()
        })
        .where(eq(inventory.id, cupsInventory[0].id));
    }
  }
  
  // Order methods
  async createOrder(orderData: any, items: any[], userId: number): Promise<typeof orders.$inferSelect> {
    // Start a transaction
    // Insert the order
    const [order] = await db.insert(orders).values({
      total: orderData.total,
      userId: userId
    }).returning();
    
    // Insert order items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
      
      // Update inventory
      await this.updateInventoryForOrder(item.productId, item.quantity);
    }
    
    return order;
  }
  
  // Sales methods
  async getSalesData(): Promise<any[]> {
    // This would typically be a more complex query involving joins and aggregations
    // For simplicity, we'll return a mocked result based on order items
    
    // First, get all order items joined with products
    const orderRecords = await db.select({
      productId: products.id,
      productName: products.name,
      price: products.price,
      quantity: orderItems.quantity
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id));
    
    // Aggregate by product
    const salesMap = new Map();
    
    for (const record of orderRecords) {
      const key = record.productId;
      if (!salesMap.has(key)) {
        salesMap.set(key, {
          id: record.productId,
          productId: record.productId,
          productName: record.productName,
          price: Number(record.price),
          volume: 0,
          totalSales: 0
        });
      }
      
      const item = salesMap.get(key);
      item.volume += record.quantity;
      item.totalSales += Number(record.price) * record.quantity;
    }
    
    return Array.from(salesMap.values());
  }
}

export const storage = new DatabaseStorage();
