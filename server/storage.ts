import { db } from "@db";
import { 
  users, categories, products, inventory, orders, orderItems, 
  productIngredients, OrderSummary, Product 
} from "@shared/schema";
import { User, InsertUser } from "@shared/schema";
import { eq, and, gt, gte, lte, inArray, sql } from "drizzle-orm";
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
  getProductById: (id: number) => Promise<typeof products.$inferSelect | undefined>;
  createProduct: (productData: any) => Promise<typeof products.$inferSelect>;
  updateProduct: (id: number, productData: any) => Promise<typeof products.$inferSelect>;
  
  // Product Ingredients methods
  getProductIngredients: (productId: number) => Promise<any[]>;
  addProductIngredients: (productId: number, ingredients: any[]) => Promise<void>;
  updateProductIngredients: (productId: number, ingredients: any[]) => Promise<void>;
  
  // Inventory methods
  getAllInventoryItems: () => Promise<typeof inventory.$inferSelect[]>;
  getLowStockItems: () => Promise<typeof inventory.$inferSelect[]>;
  updateInventoryForOrder: (productId: number, quantity: number) => Promise<void>;
  
  // Order methods
  createOrder: (orderData: any, items: any[], userId: number) => Promise<typeof orders.$inferSelect>;
  getOrderDetails: (orderId: number) => Promise<OrderSummary | undefined>;
  
  // Sales methods
  getSalesData: (fromDate?: Date, toDate?: Date) => Promise<any[]>;
  
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
  
  async getProductById(id: number): Promise<typeof products.$inferSelect | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }
  
  async createProduct(productData: any): Promise<typeof products.$inferSelect> {
    const [product] = await db.insert(products).values({
      name: productData.name,
      price: productData.price,
      imageUrl: productData.imageUrl,
      categoryId: productData.categoryId,
      size: productData.size || "M"
    }).returning();
    
    return product;
  }
  
  async updateProduct(id: number, productData: any): Promise<typeof products.$inferSelect> {
    const [updatedProduct] = await db.update(products)
      .set({
        name: productData.name,
        price: productData.price,
        imageUrl: productData.imageUrl,
        categoryId: productData.categoryId,
        size: productData.size || "M"
      })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  // Product Ingredients methods
  async getProductIngredients(productId: number): Promise<any[]> {
    const ingredientsData = await db.select({
      id: productIngredients.id,
      productId: productIngredients.productId,
      inventoryId: productIngredients.inventoryId,
      inventoryName: inventory.name,
      quantityUsed: productIngredients.quantityUsed,
      unit: inventory.unit
    })
    .from(productIngredients)
    .innerJoin(inventory, eq(productIngredients.inventoryId, inventory.id))
    .where(eq(productIngredients.productId, productId));
    
    return ingredientsData;
  }
  
  async addProductIngredients(productId: number, ingredients: any[]): Promise<void> {
    for (const ingredient of ingredients) {
      await db.insert(productIngredients).values({
        productId,
        inventoryId: ingredient.inventoryId,
        quantityUsed: ingredient.quantityUsed
      });
    }
  }
  
  async updateProductIngredients(productId: number, ingredients: any[]): Promise<void> {
    // First, delete existing ingredients
    await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
    
    // Then, add the new ones
    await this.addProductIngredients(productId, ingredients);
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
    try {
      console.log(`Updating inventory for product ID ${productId}, quantity ${quantity}`);
      
      // Get the product ingredients
      const ingredients = await this.getProductIngredients(productId);
      console.log(`Found ${ingredients.length} ingredients for product ID ${productId}`);
      
      // If no ingredients defined, use default fallback behavior
      if (ingredients.length === 0) {
        console.log("No ingredients defined, using default fallback behavior");
        
        // Default fallback: reduce coffee beans and cups
        const coffeeBeansInventory = await db.select().from(inventory).where(eq(inventory.name, "COFFEE BEANS"));
        const cupsInventory = await db.select().from(inventory).where(eq(inventory.name, "CUPS"));
        
        if (coffeeBeansInventory[0]) {
          const currentStock = Number(coffeeBeansInventory[0].currentStock);
          const newStock = (currentStock - (0.05 * quantity)).toFixed(2);
          console.log(`Reducing COFFEE BEANS from ${currentStock} to ${newStock}`);
          
          await db.update(inventory)
            .set({
              currentStock: String(newStock),
              updatedAt: new Date()
            })
            .where(eq(inventory.id, coffeeBeansInventory[0].id));
        }
        
        if (cupsInventory[0]) {
          const currentStock = Number(cupsInventory[0].currentStock);
          const newStock = (currentStock - quantity).toFixed(2);
          console.log(`Reducing CUPS from ${currentStock} to ${newStock}`);
          
          await db.update(inventory)
            .set({
              currentStock: String(newStock),
              updatedAt: new Date()
            })
            .where(eq(inventory.id, cupsInventory[0].id));
        }
        return;
      }
      
      // Update inventory based on ingredients
      for (const ingredient of ingredients) {
        const totalQuantityUsed = Number(ingredient.quantityUsed) * quantity;
        const inventoryItem = await db.select().from(inventory).where(eq(inventory.id, ingredient.inventoryId));
        
        if (inventoryItem[0]) {
          const currentStock = Number(inventoryItem[0].currentStock);
          const newStock = (currentStock - totalQuantityUsed).toFixed(2);
          console.log(`Reducing ${ingredient.inventoryName} from ${currentStock} to ${newStock}`);
          
          await db.update(inventory)
            .set({
              currentStock: String(newStock),
              updatedAt: new Date()
            })
            .where(eq(inventory.id, ingredient.inventoryId));
        }
      }
    } catch (error) {
      console.error("Error updating inventory for order:", error);
      throw error;
    }
  }
  
  // Order methods
  async createOrder(orderData: any, items: any[], userId: number): Promise<typeof orders.$inferSelect> {
    try {
      // Insert the order with payment details
      const [order] = await db.insert(orders).values({
        total: orderData.total,
        amountPaid: orderData.amountPaid,
        change: orderData.change,
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
        
        // Update inventory based on product ingredients
        await this.updateInventoryForOrder(item.productId, item.quantity);
      }
      
      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }
  
  async getOrderDetails(orderId: number): Promise<OrderSummary | undefined> {
    try {
      // Get the order
      const orderResult = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!orderResult[0]) return undefined;
      
      const order = orderResult[0];
      
      // Get the order items with product details
      const orderItemsResult = await db.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          createdAt: products.createdAt,
          size: products.size
        }
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
      
      return {
        order,
        items: orderItemsResult as any, // Type casting to resolve type mismatch
        amountPaid: Number(order.amountPaid || 0),
        change: Number(order.change || 0)
      };
    } catch (error) {
      console.error("Error getting order details:", error);
      throw error;
    }
  }
  
  // Sales methods
  async getSalesData(fromDate?: Date, toDate?: Date): Promise<any[]> {
    try {
      // Build query conditions
      const conditions = [];
      
      if (fromDate) {
        conditions.push(gte(orders.createdAt, fromDate));
      }
      
      if (toDate) {
        conditions.push(lte(orders.createdAt, toDate));
      }
      
      // Build the query with date filters
      const query = db.select({
        productId: products.id,
        productName: products.name,
        price: products.price,
        size: products.size,
        quantity: orderItems.quantity,
        createdAt: orders.createdAt
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id));
      
      // Apply conditions if any
      const orderRecords = conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;
      
      // Aggregate by product
      const salesMap = new Map();
      
      for (const record of orderRecords) {
        // Create a unique key from product ID and size
        const key = `${record.productId}-${record.size || "M"}`;
        if (!salesMap.has(key)) {
          salesMap.set(key, {
            id: record.productId,
            productId: record.productId,
            productName: record.productName,
            price: Number(record.price),
            size: record.size || "M",
            volume: 0,
            totalSales: 0
          });
        }
        
        const item = salesMap.get(key);
        item.volume += record.quantity;
        item.totalSales += Number(record.price) * record.quantity;
      }
      
      return Array.from(salesMap.values());
    } catch (error) {
      console.error("Error getting sales data:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
