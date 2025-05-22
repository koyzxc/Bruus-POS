import { db } from "./index";
import { sql } from "drizzle-orm";

async function updateInventorySchema() {
  try {
    console.log("Starting inventory schema update...");
    
    // Check if columns exist
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory' 
      AND column_name = 'container_type'
    `);
    
    const columnExists = checkResult.rows.length > 0;
    
    if (!columnExists) {
      console.log("Adding new columns to inventory table...");
      
      // Add container_type with default value 'direct'
      await db.execute(sql`
        ALTER TABLE inventory 
        ADD COLUMN container_type text NOT NULL DEFAULT 'direct'
      `);
      
      // Add containerQuantity
      await db.execute(sql`
        ALTER TABLE inventory 
        ADD COLUMN container_quantity decimal(10, 2)
      `);
      
      // Add secondaryUnit
      await db.execute(sql`
        ALTER TABLE inventory 
        ADD COLUMN secondary_unit text
      `);
      
      console.log("Schema update completed successfully!");
    } else {
      console.log("Columns already exist. No changes needed.");
    }
  } catch (error) {
    console.error("Error updating inventory schema:", error);
  }
}

updateInventorySchema();
