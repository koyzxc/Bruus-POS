import { db } from "./index";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updatePasswords() {
  try {
    // Update owner password to ctbruus2025
    const ownerHash = await hashPassword("ctbruus2025");
    await db.update(users)
      .set({ password: ownerHash })
      .where(eq(users.username, "owner"));
    console.log("Updated owner password successfully");
    
    // Update barista password to baristabruus2025
    const baristaHash = await hashPassword("baristabruus2025");
    await db.update(users)
      .set({ password: baristaHash })
      .where(eq(users.username, "barista"));
    console.log("Updated barista password successfully");
    
    console.log("All passwords updated successfully.");
  } catch (error) {
    console.error("Error updating passwords:", error);
  }
}

updatePasswords();
