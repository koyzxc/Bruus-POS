import { db } from "./index";
import { sql } from "drizzle-orm";

async function addQuantityPerUnitColumn() {
  try {
    console.log("Starting database schema update...");
    
    // Check if column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory' 
      AND column_name = 'quantity_per_unit'
    `);
    
    const columnExists = checkResult.rows.length > 0;
    
    if (!columnExists) {
      console.log("Adding quantity_per_unit column to inventory table...");
      
      // Add quantity_per_unit column
      await db.execute(sql`
        ALTER TABLE inventory 
        ADD COLUMN quantity_per_unit decimal(10, 2)
      `);
      
      console.log("Column added successfully!");
    } else {
      console.log("Column already exists. No changes needed.");
    }
  } catch (error) {
    console.error("Error updating inventory schema:", error);
  }
}

addQuantityPerUnitColumn();
