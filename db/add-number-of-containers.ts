import { db } from './index';
import { sql } from 'drizzle-orm';

async function addNumberOfContainersColumn() {
  try {
    console.log('Adding number_of_containers column to inventory table...');
    
    // Add the number_of_containers column
    await db.execute(sql`
      ALTER TABLE inventory
      ADD COLUMN IF NOT EXISTS number_of_containers DECIMAL(10,2) DEFAULT 1.0 NOT NULL
    `);
    
    console.log('Successfully added number_of_containers column');
  } catch (error) {
    console.error('Error adding number_of_containers column:', error);
    throw error;
  }
}

// Run the migration
addNumberOfContainersColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });