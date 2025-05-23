import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema';

// Create SQLite database
const sqlite = new Database('./local.db');

// Create Drizzle instance for SQLite
export const localDb = drizzle(sqlite, { schema });

// Export raw SQLite instance for direct queries
export { sqlite };

// Initialize local database with schema
export function initializeLocalDb() {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'barista',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        displayOrder INTEGER NOT NULL DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        category TEXT NOT NULL,
        size TEXT NOT NULL,
        imageUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        currentStock TEXT NOT NULL,
        minimumStock TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT 'pc',
        containerType TEXT NOT NULL DEFAULT 'Box',
        numberOfContainers INTEGER NOT NULL DEFAULT 1,
        quantityPerUnit TEXT NOT NULL DEFAULT '1',
        secondaryUnit TEXT NOT NULL DEFAULT 'piece',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        inventoryId INTEGER NOT NULL,
        quantityUsed TEXT NOT NULL,
        size TEXT NOT NULL DEFAULT 'M',
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (inventoryId) REFERENCES inventory(id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT NOT NULL,
        total TEXT NOT NULL,
        amountPaid TEXT NOT NULL,
        change TEXT NOT NULL,
        userId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        productId INTEGER,
        productName TEXT NOT NULL,
        size TEXT NOT NULL,
        price TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_sync DATETIME,
        is_online INTEGER DEFAULT 1
      );
    `);

    console.log('✅ Local SQLite database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing local database:', error);
    return false;
  }
}

// Sync queue functions
export function addToSyncQueue(tableName: string, operation: string, data: any) {
  try {
    const stmt = sqlite.prepare(`
      INSERT INTO sync_queue (table_name, operation, data)
      VALUES (?, ?, ?)
    `);
    stmt.run(tableName, operation, JSON.stringify(data));
    console.log(`📤 Added to sync queue: ${operation} on ${tableName}`);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

export function getSyncQueue() {
  try {
    const stmt = sqlite.prepare(`
      SELECT * FROM sync_queue WHERE sync_status = 'pending'
      ORDER BY created_at ASC
    `);
    return stmt.all();
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

export function markSynced(queueId: number) {
  try {
    const stmt = sqlite.prepare(`
      UPDATE sync_queue 
      SET sync_status = 'synced', synced_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(queueId);
  } catch (error) {
    console.error('Error marking as synced:', error);
  }
}

export function setOnlineStatus(isOnline: boolean) {
  try {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO sync_status (id, last_sync, is_online)
      VALUES (1, CURRENT_TIMESTAMP, ?)
    `);
    stmt.run(isOnline ? 1 : 0);
  } catch (error) {
    console.error('Error setting online status:', error);
  }
}

export function getOnlineStatus(): boolean {
  try {
    const stmt = sqlite.prepare(`
      SELECT is_online FROM sync_status WHERE id = 1
    `);
    const result = stmt.get() as { is_online: number } | undefined;
    return result ? result.is_online === 1 : true; // Default to online
  } catch (error) {
    console.error('Error getting online status:', error);
    return true;
  }
}