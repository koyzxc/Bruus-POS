import { storage as pgStorage, IStorage } from './storage';
import { localDb, sqlite, addToSyncQueue, getOnlineStatus } from '@db/local';
import { syncService } from './sync-service';
import { User, InsertUser } from '@shared/schema';
import session from 'express-session';

export class HybridStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = pgStorage.sessionStore;
  }

  private get isOnline(): boolean {
    return syncService.getOnlineStatus();
  }

  // Helper to try remote first, fallback to local
  private async tryRemoteFirst<T>(
    remoteOperation: () => Promise<T>,
    localOperation: () => T,
    tableName?: string,
    operation?: string,
    data?: any
  ): Promise<T> {
    if (this.isOnline) {
      try {
        const result = await remoteOperation();
        // If operation modifies data and we're online, also update local
        if (tableName && operation && data) {
          addToSyncQueue(tableName, operation, data);
        }
        return result;
      } catch (error) {
        console.log('Remote operation failed, using local fallback');
        return localOperation();
      }
    } else {
      // Queue operation for sync when online
      if (tableName && operation && data) {
        addToSyncQueue(tableName, operation, data);
      }
      return localOperation();
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.tryRemoteFirst(
      () => pgStorage.getUser(id),
      () => {
        const stmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id) as User | undefined;
      }
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.tryRemoteFirst(
      () => pgStorage.getUserByUsername(username),
      () => {
        const stmt = sqlite.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username) as User | undefined;
      }
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.tryRemoteFirst(
      () => pgStorage.createUser(userData),
      () => {
        const stmt = localDb.prepare(`
          INSERT INTO users (username, password, role)
          VALUES (?, ?, ?)
          RETURNING *
        `);
        return stmt.get(userData.username, userData.password, userData.role) as User;
      },
      'users',
      'INSERT',
      userData
    );
  }

  async getAllUsers(): Promise<User[]> {
    return this.tryRemoteFirst(
      () => pgStorage.getAllUsers(),
      () => {
        const stmt = localDb.prepare('SELECT * FROM users ORDER BY createdAt DESC');
        return stmt.all() as User[];
      }
    );
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    return this.tryRemoteFirst(
      () => pgStorage.updateUser(id, userData),
      () => {
        const updates = [];
        const values = [];
        
        if (userData.username) {
          updates.push('username = ?');
          values.push(userData.username);
        }
        if (userData.role) {
          updates.push('role = ?');
          values.push(userData.role);
        }
        if (userData.password) {
          updates.push('password = ?');
          values.push(userData.password);
        }
        
        values.push(id);
        
        const stmt = localDb.prepare(`
          UPDATE users SET ${updates.join(', ')}
          WHERE id = ?
          RETURNING *
        `);
        return stmt.get(...values) as User;
      },
      'users',
      'UPDATE',
      { id, ...userData }
    );
  }

  async deleteUser(id: number): Promise<void> {
    return this.tryRemoteFirst(
      () => pgStorage.deleteUser(id),
      () => {
        const stmt = localDb.prepare('DELETE FROM users WHERE id = ?');
        stmt.run(id);
      },
      'users',
      'DELETE',
      { id }
    );
  }

  // Product methods
  async getProductsByCategory(category: string): Promise<any[]> {
    return this.tryRemoteFirst(
      () => pgStorage.getProductsByCategory(category),
      () => {
        const stmt = localDb.prepare('SELECT * FROM products WHERE category = ? ORDER BY name');
        return stmt.all(category);
      }
    );
  }

  async getProductById(id: number): Promise<any | undefined> {
    return this.tryRemoteFirst(
      () => pgStorage.getProductById(id),
      () => {
        const stmt = localDb.prepare('SELECT * FROM products WHERE id = ?');
        return stmt.get(id);
      }
    );
  }

  async createProduct(productData: any): Promise<any> {
    return this.tryRemoteFirst(
      () => pgStorage.createProduct(productData),
      () => {
        const stmt = localDb.prepare(`
          INSERT INTO products (name, price, category, size, imageUrl)
          VALUES (?, ?, ?, ?, ?)
          RETURNING *
        `);
        return stmt.get(
          productData.name,
          productData.price,
          productData.category,
          productData.size,
          productData.imageUrl
        );
      },
      'products',
      'INSERT',
      productData
    );
  }

  async updateProduct(id: number, productData: any): Promise<any> {
    return this.tryRemoteFirst(
      () => pgStorage.updateProduct(id, productData),
      () => {
        const updates = [];
        const values = [];
        
        if (productData.name) {
          updates.push('name = ?');
          values.push(productData.name);
        }
        if (productData.price) {
          updates.push('price = ?');
          values.push(productData.price);
        }
        if (productData.category) {
          updates.push('category = ?');
          values.push(productData.category);
        }
        if (productData.size) {
          updates.push('size = ?');
          values.push(productData.size);
        }
        if (productData.imageUrl) {
          updates.push('imageUrl = ?');
          values.push(productData.imageUrl);
        }
        
        values.push(id);
        
        const stmt = localDb.prepare(`
          UPDATE products SET ${updates.join(', ')}
          WHERE id = ?
          RETURNING *
        `);
        return stmt.get(...values);
      },
      'products',
      'UPDATE',
      { id, ...productData }
    );
  }

  // Product Ingredients methods
  async getProductIngredients(productId: number): Promise<any[]> {
    return this.tryRemoteFirst(
      () => pgStorage.getProductIngredients(productId),
      () => {
        const stmt = localDb.prepare(`
          SELECT pi.*, i.name as inventoryName, i.unit
          FROM product_ingredients pi
          JOIN inventory i ON pi.inventoryId = i.id
          WHERE pi.productId = ?
        `);
        return stmt.all(productId);
      }
    );
  }

  async addProductIngredients(productId: number, ingredients: any[]): Promise<void> {
    return this.tryRemoteFirst(
      () => pgStorage.addProductIngredients(productId, ingredients),
      () => {
        const stmt = localDb.prepare(`
          INSERT INTO product_ingredients (productId, inventoryId, quantityUsed, size)
          VALUES (?, ?, ?, ?)
        `);
        
        for (const ingredient of ingredients) {
          stmt.run(productId, ingredient.inventoryId, ingredient.quantityUsed, ingredient.size);
        }
      },
      'product_ingredients',
      'INSERT',
      { productId, ingredients }
    );
  }

  async updateProductIngredients(productId: number, ingredients: any[]): Promise<void> {
    return this.tryRemoteFirst(
      () => pgStorage.updateProductIngredients(productId, ingredients),
      () => {
        // Delete existing ingredients
        const deleteStmt = localDb.prepare('DELETE FROM product_ingredients WHERE productId = ?');
        deleteStmt.run(productId);
        
        // Insert new ingredients
        const insertStmt = localDb.prepare(`
          INSERT INTO product_ingredients (productId, inventoryId, quantityUsed, size)
          VALUES (?, ?, ?, ?)
        `);
        
        for (const ingredient of ingredients) {
          insertStmt.run(productId, ingredient.inventoryId, ingredient.quantityUsed, ingredient.size);
        }
      },
      'product_ingredients',
      'UPDATE',
      { productId, ingredients }
    );
  }

  // Inventory methods
  async getAllInventoryItems(): Promise<any[]> {
    return this.tryRemoteFirst(
      () => pgStorage.getAllInventoryItems(),
      () => {
        const stmt = localDb.prepare('SELECT * FROM inventory ORDER BY name');
        return stmt.all();
      }
    );
  }

  async getLowStockItems(): Promise<any[]> {
    return this.tryRemoteFirst(
      () => pgStorage.getLowStockItems(),
      () => {
        const stmt = localDb.prepare(`
          SELECT * FROM inventory 
          WHERE CAST(currentStock as REAL) <= CAST(minimumStock as REAL)
          ORDER BY name
        `);
        return stmt.all();
      }
    );
  }

  async updateInventoryForOrder(productId: number, quantity: number): Promise<void> {
    return this.tryRemoteFirst(
      () => pgStorage.updateInventoryForOrder(productId, quantity),
      () => {
        // Get product ingredients
        const ingredientsStmt = localDb.prepare(`
          SELECT pi.*, i.name, i.currentStock, i.unit
          FROM product_ingredients pi
          JOIN inventory i ON pi.inventoryId = i.id
          WHERE pi.productId = ?
        `);
        const ingredients = ingredientsStmt.all(productId);
        
        // Update inventory for each ingredient
        const updateStmt = localDb.prepare(`
          UPDATE inventory 
          SET currentStock = CAST(currentStock as REAL) - ? 
          WHERE id = ?
        `);
        
        for (const ingredient of ingredients) {
          const usedQuantity = parseFloat(ingredient.quantityUsed) * quantity;
          updateStmt.run(usedQuantity, ingredient.inventoryId);
        }
      },
      'inventory',
      'UPDATE',
      { productId, quantity }
    );
  }

  // Order methods
  async createOrder(orderData: any, items: any[], userId: number): Promise<any> {
    return this.tryRemoteFirst(
      () => pgStorage.createOrder(orderData, items, userId),
      () => {
        // Generate order number
        const orderNumber = `BRUUS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        
        // Insert order
        const orderStmt = localDb.prepare(`
          INSERT INTO orders (orderNumber, total, amountPaid, change, userId)
          VALUES (?, ?, ?, ?, ?)
          RETURNING *
        `);
        const order = orderStmt.get(
          orderNumber,
          orderData.total,
          orderData.amountPaid,
          orderData.change,
          userId
        );
        
        // Insert order items
        const itemStmt = localDb.prepare(`
          INSERT INTO order_items (orderId, productId, productName, size, price, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const item of items) {
          itemStmt.run(
            order.id,
            item.productId,
            item.productName,
            item.size,
            item.price,
            item.quantity
          );
        }
        
        return order;
      },
      'orders',
      'INSERT',
      { orderData, items, userId }
    );
  }

  async getOrderDetails(orderId: number): Promise<any | undefined> {
    return this.tryRemoteFirst(
      () => pgStorage.getOrderDetails(orderId),
      () => {
        const orderStmt = localDb.prepare('SELECT * FROM orders WHERE id = ?');
        const order = orderStmt.get(orderId);
        
        if (!order) return undefined;
        
        const itemsStmt = localDb.prepare('SELECT * FROM order_items WHERE orderId = ?');
        const items = itemsStmt.all(orderId);
        
        return {
          order,
          items,
          amountPaid: parseFloat(order.amountPaid),
          change: parseFloat(order.change)
        };
      }
    );
  }

  // Sales methods
  async getSalesData(fromDate?: Date, toDate?: Date): Promise<any[]> {
    return this.tryRemoteFirst(
      () => pgStorage.getSalesData(fromDate, toDate),
      () => {
        let query = `
          SELECT oi.*, o.createdAt as orderDate, p.category as categoryName
          FROM order_items oi
          JOIN orders o ON oi.orderId = o.id
          LEFT JOIN products p ON oi.productId = p.id
        `;
        
        const params: any[] = [];
        
        if (fromDate || toDate) {
          query += ' WHERE ';
          const conditions = [];
          
          if (fromDate) {
            conditions.push('o.createdAt >= ?');
            params.push(fromDate.toISOString());
          }
          
          if (toDate) {
            conditions.push('o.createdAt <= ?');
            params.push(toDate.toISOString());
          }
          
          query += conditions.join(' AND ');
        }
        
        query += ' ORDER BY o.createdAt DESC';
        
        const stmt = localDb.prepare(query);
        return stmt.all(...params);
      }
    );
  }
}

// Export the hybrid storage instance
export const hybridStorage = new HybridStorage();