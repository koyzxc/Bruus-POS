import { pool } from '@db/index';
import { localDb, addToSyncQueue, getSyncQueue, markSynced, setOnlineStatus, getOnlineStatus } from '@db/local';
import { storage as pgStorage } from './storage';

export class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor() {
    this.startHeartbeat();
  }

  // Check internet connectivity by pinging the PostgreSQL database
  async checkConnectivity(): Promise<boolean> {
    try {
      const result = await pool.query('SELECT 1');
      this.isOnline = true;
      setOnlineStatus(true);
      return true;
    } catch (error) {
      this.isOnline = false;
      setOnlineStatus(false);
      console.log('🔴 Offline mode: Database connection failed');
      return false;
    }
  }

  // Start connectivity heartbeat
  private startHeartbeat() {
    this.syncInterval = setInterval(async () => {
      const wasOnline = this.isOnline;
      const isOnlineNow = await this.checkConnectivity();
      
      if (!wasOnline && isOnlineNow) {
        console.log('🟢 Back online! Starting sync...');
        await this.syncPendingChanges();
        await this.downloadLatestData();
      }
    }, 10000); // Check every 10 seconds
  }

  // Sync pending changes from local to remote
  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline) return;

    const pendingItems = getSyncQueue() as any[];
    console.log(`📤 Syncing ${pendingItems.length} pending changes...`);

    for (const item of pendingItems) {
      try {
        const data = JSON.parse(item.data);
        
        switch (item.operation) {
          case 'INSERT':
            await this.syncInsert(item.table_name, data);
            break;
          case 'UPDATE':
            await this.syncUpdate(item.table_name, data);
            break;
          case 'DELETE':
            await this.syncDelete(item.table_name, data);
            break;
        }
        
        markSynced(item.id);
        console.log(`✅ Synced: ${item.operation} on ${item.table_name}`);
      } catch (error) {
        console.error(`❌ Sync failed for ${item.operation} on ${item.table_name}:`, error);
      }
    }
  }

  // Download latest data from remote to local
  async downloadLatestData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      console.log('📥 Downloading latest data...');
      
      // Sync inventory (main priority for POS)
      const inventory = await pgStorage.getAllInventoryItems();
      
      console.log('✅ Data download complete');
    } catch (error) {
      console.error('❌ Data download failed:', error);
    }
  }

  private async syncInsert(tableName: string, data: any): Promise<void> {
    switch (tableName) {
      case 'orders':
        await pgStorage.createOrder(data.orderData, data.items, data.userId);
        break;
      case 'products':
        await pgStorage.createProduct(data);
        break;
      case 'inventory':
        // Handle inventory updates
        break;
      // Add other tables as needed
    }
  }

  private async syncUpdate(tableName: string, data: any): Promise<void> {
    switch (tableName) {
      case 'inventory':
        // Handle inventory updates
        break;
      case 'products':
        await pgStorage.updateProduct(data.id, data);
        break;
      // Add other tables as needed
    }
  }

  private async syncDelete(tableName: string, data: any): Promise<void> {
    switch (tableName) {
      case 'products':
        // Handle product deletion
        break;
      // Add other tables as needed
    }
  }

  // Get current online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Stop the sync service
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();