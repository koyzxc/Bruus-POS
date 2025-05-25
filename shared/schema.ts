import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["owner", "barista"] }).notNull().default("barista"),
  // Barista permissions (only applicable for barista role)
  canAddProducts: boolean("can_add_products").default(true),
  canManageInventory: boolean("can_manage_inventory").default(true),
  canViewSales: boolean("can_view_sales").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  canAddProducts: true,
  canManageInventory: true,
  canViewSales: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayOrder: integer("display_order").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories);
export type Category = typeof categories.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  size: text("size").default("M").notNull(), // M = medium, L = large
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products);
export type Product = typeof products.$inferSelect;

// Inventory table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull(),
  minimumThreshold: decimal("minimum_threshold", { precision: 10, scale: 2 }).notNull(),
  
  // Primary unit of measurement (Box, Pack, Bag, or direct units)
  containerType: text("container_type").notNull(),
  
  // Quantity of secondary units in this container (e.g., 10 pieces per box)
  containerQuantity: decimal("container_quantity", { precision: 10, scale: 2 }),
  
  // Number of containers (e.g., 2 boxes)
  numberOfContainers: decimal("number_of_containers", { precision: 10, scale: 2 }).default("1").notNull(),
  
  // Secondary unit of measurement (Piece, Pack, Bottle)
  secondaryUnit: text("secondary_unit"),
  
  // Quantity per secondary unit (e.g., 200ml per piece)
  quantityPerUnit: decimal("quantity_per_unit", { precision: 10, scale: 2 }),
  
  // The actual measurement unit (ml, oz, pc, kg, g)
  unit: text("unit").notNull(),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInventorySchema = createInsertSchema(inventory);
export type Inventory = typeof inventory.$inferSelect;

// Product Ingredients table (connects products to inventory items)
export const productIngredients = pgTable("product_ingredients", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  inventoryId: integer("inventory_id").references(() => inventory.id).notNull(),
  quantityUsed: decimal("quantity_used", { precision: 10, scale: 2 }).notNull(),
  size: text("size").default("M"), // M = medium (default), L = large
});

export const insertProductIngredientSchema = createInsertSchema(productIngredients);
export type ProductIngredient = typeof productIngredients.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  change: decimal("change", { precision: 10, scale: 2 }),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders);
export type Order = typeof orders.$inferSelect;

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // Store product details to preserve them even if product is deleted
  productName: text("product_name"),
  size: text("size"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems);
export type OrderItem = typeof orderItems.$inferSelect;

// Relations for products and categories
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  ingredients: many(productIngredients),
}));

// Relations for inventory and product ingredients
export const inventoryRelations = relations(inventory, ({ many }) => ({
  usedInProducts: many(productIngredients),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, { fields: [productIngredients.productId], references: [products.id] }),
  ingredient: one(inventory, { fields: [productIngredients.inventoryId], references: [inventory.id] }),
}));

// Relations for orders and order items
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// Sales Data (this is a type, not a table - used for the API)
export type SalesData = {
  id: number;
  productId: number;
  productName: string;
  size: string;
  price: number;
  volume: number;
  totalSales: number;
  categoryName?: string | null;
  createdAt?: Date | string;
};

// Order summary type for checkout process
export type OrderSummary = {
  order: Order;
  items: (OrderItem & { product: Product })[];
  amountPaid: number;
  change: number;
};
