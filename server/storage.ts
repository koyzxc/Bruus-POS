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

// Define SizeOption type for product size variants
type SizeOption = {
  id: number;
  size: string;
  price: string;
};

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser: (id: number) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  createUser: (userData: InsertUser) => Promise<User>;
  getAllUsers: () => Promise<User[]>;
  updateUser: (id: number, userData: Partial<InsertUser>) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;
  
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

  async getAllUsers(): Promise<User[]> {
    return await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.username)]
    });
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
  
  // Products methods
  async getProductsByCategory(category: string): Promise<any[]> {
    const categoryRecord = await db.select().from(categories).where(eq(categories.name, category));
    
    if (!categoryRecord[0]) return [];
    
    // Get all products in the category
    const allProducts = await db.select().from(products).where(eq(products.categoryId, categoryRecord[0].id));
    
    // Group products by name to combine M and L sizes
    const productMap = new Map();
    
    allProducts.forEach(product => {
      const key = product.name;
      
      if (!productMap.has(key)) {
        // Create a new product group with sizes array
        productMap.set(key, {
          ...product,
          sizeOptions: [{
            id: product.id,
            size: product.size,
            price: product.price
          }]
        });
      } else {
        // Add size option to existing product
        const existingProduct = productMap.get(key);
        existingProduct.sizeOptions.push({
          id: product.id,
          size: product.size,
          price: product.price
        });
        
        // Sort size options (M first, then L)
        existingProduct.sizeOptions.sort((a: SizeOption, b: SizeOption) => {
          if (a.size === "M") return -1;
          if (b.size === "M") return 1;
          return 0;
        });
      }
    });
    
    // Convert map to array
    return Array.from(productMap.values());
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
      unit: inventory.unit,
      size: productIngredients.size
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
        quantityUsed: ingredient.quantityUsed,
        size: ingredient.size || "M" // Include size information
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
      
      // Get product details to determine size
      const product = await this.getProductById(productId);
      const productSize = product?.size || "M";
      console.log(`Processing product with size: ${productSize}`);
      
      // Get the product ingredients - filter by size if present
      const allIngredients = await this.getProductIngredients(productId);
      // Filter ingredients by size if they have size info
      const ingredients = allIngredients.filter(ing => 
        !ing.size || ing.size === productSize
      );
      
      console.log(`Found ${ingredients.length} ingredients for product ID ${productId} with size ${productSize}`);
      
      // If no ingredients defined, use default fallback behavior
      if (ingredients.length === 0) {
        console.log("No ingredients defined, using default fallback behavior");
        
        // Default fallback: reduce cups (one cup per order)
        const cupsInventory = await db.select().from(inventory).where(eq(inventory.name, "CUPS"));
        
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
          console.log(`Reducing ${ingredient.inventoryName} from ${currentStock} to ${newStock} (used ${totalQuantityUsed} ${inventoryItem[0].unit})`);
          
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
        // Get product details to store in order items (for sales history)
        const product = await this.getProductById(item.productId);
        
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          // Store product details for data preservation
          productName: product?.name || item.name || 'Unknown Product',
          size: product?.size || item.size || 'M'
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
      // Using LEFT JOIN to handle deleted products
      const orderItemsResult = await db.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: orderItems.productName,
        productSize: orderItems.size,
        product: {
          id: products.id,
          name: sql`COALESCE(${products.name}, ${orderItems.productName}, 'Deleted Product')`,
          price: sql`COALESCE(${products.price}, ${orderItems.price})`,
          imageUrl: products.imageUrl || '/placeholder.png',
          categoryId: products.categoryId,
          createdAt: products.createdAt || new Date(),
          size: sql`COALESCE(${products.size}, ${orderItems.size}, 'M')`
        }
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
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
      // Using left join on products for sales history
      // When products are deleted, show NULL values as specified
      const query = db.select({
        productId: orderItems.productId,
        // Show product name from products table only if product exists, otherwise NULL
        productName: sql`CASE 
          WHEN ${products.id} IS NULL THEN NULL 
          ELSE ${products.name} 
        END`,
        // Price should be preserved from order_items for accurate sales history
        price: orderItems.price,
        // Size from products table only if product exists, otherwise NULL
        size: sql`CASE 
          WHEN ${products.id} IS NULL THEN NULL 
          ELSE ${products.size} 
        END`,
        // Include the category name for proper categorization
        categoryName: sql`CASE 
          WHEN ${products.id} IS NULL THEN NULL
          ELSE (SELECT ${categories.name} FROM ${categories} WHERE ${categories.id} = ${products.categoryId})
        END`,
        quantity: orderItems.quantity,
        createdAt: orders.createdAt
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
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
  
  async getNonSellingProducts(fromDate?: Date, toDate?: Date): Promise<any[]> {
    try {
      // First, get all products with their category information
      const allProducts = await db.select({
        id: products.id,
        name: products.name,
        price: products.price,
        size: products.size,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        categoryName: categories.name,
        createdAt: products.createdAt
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
      
      // Then get the products that have sales in the given date range
      const conditions = [];
      
      if (fromDate) {
        conditions.push(gte(orders.createdAt, fromDate));
      }
      
      if (toDate) {
        conditions.push(lte(orders.createdAt, toDate));
      }
      
      const query = db.select({
        productId: orderItems.productId,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id));
      
      // Apply conditions if any
      const soldProductsResult = conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;
      
      // Extract unique product IDs that have been sold
      const soldProductIds = new Set(
        soldProductsResult.map(record => record.productId)
      );
      
      // Filter out products that have been sold
      const nonSellingProducts = allProducts.filter(product => 
        !soldProductIds.has(product.id)
      ).map(product => ({
        ...product,
        price: Number(product.price),
        lastSold: null, // We might want to add this feature later
        daysWithoutSales: null // We might want to add this feature later
      }));
      
      return nonSellingProducts;
    } catch (error) {
      console.error("Error getting non-selling products:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
