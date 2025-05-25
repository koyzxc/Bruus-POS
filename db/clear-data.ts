import { db, pool } from './index';
import { products, productIngredients, orderItems, orders, inventory } from "@shared/schema";

async function clearAllData() {
  console.log("Starting database cleanup...");
  
  try {
    // Connect to the database directly for raw SQL operations
    const client = await pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // First, disable all foreign key constraints
      await client.query('SET CONSTRAINTS ALL DEFERRED');
      
      // Clear all tables in the correct order to avoid FK constraint issues
      console.log("Clearing order_items table...");
      await client.query('DELETE FROM order_items');
      
      console.log("Clearing orders table...");
      await client.query('DELETE FROM orders');
      
      console.log("Clearing product_ingredients table...");
      await client.query('DELETE FROM product_ingredients');
      
      console.log("Clearing products table...");
      await client.query('DELETE FROM products');
      
      console.log("Clearing inventory table...");
      await client.query('DELETE FROM inventory');
      
      // Keep users and categories tables intact
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log("Database cleanup completed successfully!");
    } catch (err) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      console.error("Transaction failed:", err);
      throw err;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Error during database cleanup:", error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
    console.log("Database connection closed");
  }
}

// Run the cleanup function
clearAllData();