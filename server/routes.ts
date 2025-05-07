import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db } from "@db";
import { products, insertProductSchema, inventory, insertInventorySchema, productIngredients, orderItems } from "@shared/schema";
import multer from "multer";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import express from "express";

// Set up file upload for product images
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.') as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Serve static files from the 'public' directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await db.query.categories.findMany({
        orderBy: (categories, { asc }) => [asc(categories.displayOrder)]
      });
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products API
  app.get("/api/products/:category?", async (req, res) => {
    try {
      const category = req.params.category || "COFFEE";
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Product CRUD operations (owner only)
  app.post("/api/products", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a product" });
    }
    
    // Allow both owners and baristas to create products
    if (req.user.role !== "owner" && req.user.role !== "barista") {
      return res.status(403).json({ message: "You don't have permission to create products" });
    }
    
    try {
      const imageUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : null;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Product image is required" });
      }
      
      const productData = {
        name: req.body.name,
        price: req.body.price, // Keep as string for validation
        imageUrl,
        categoryId: parseInt(req.body.categoryId),
        size: req.body.size || "M" // M = medium (default), L = large
      };
      
      // Log the data for debugging
      console.log("Product data before validation:", JSON.stringify(productData));
      
      // Make sure price and categoryId are in the correct format
      const productValidationData = {
        name: productData.name,
        price: String(productData.price),  // Ensure it's a string as per schema
        imageUrl: productData.imageUrl,
        categoryId: parseInt(String(productData.categoryId)),
        size: productData.size || "M"
      };
      
      console.log("Product validation data:", JSON.stringify(productValidationData));
      
      // Validate product data
      const validationResult = insertProductSchema.safeParse(productValidationData);
      if (!validationResult.success) {
        console.error("Product validation error:", JSON.stringify(validationResult.error.errors));
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Use the validated data for DB insertion
      const product = await storage.createProduct(productValidationData);
      
      // Add ingredients if provided
      if (req.body.ingredients) {
        try {
          // Parse ingredients if it's a JSON string
          const ingredients = typeof req.body.ingredients === 'string' 
            ? JSON.parse(req.body.ingredients) 
            : req.body.ingredients;

          if (Array.isArray(ingredients)) {
            await storage.addProductIngredients(
              product.id, 
              ingredients.map((ing: any) => ({
                inventoryId: parseInt(ing.inventoryId),
                quantityUsed: parseFloat(ing.quantityUsed)
              }))
            );
          }
        } catch (error) {
          console.error("Error processing ingredients:", error);
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  app.put("/api/products/:id", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update a product" });
    }
    
    // Allow both owners and baristas to update products
    if (req.user.role !== "owner" && req.user.role !== "barista") {
      return res.status(403).json({ message: "You don't have permission to update products" });
    }
    
    try {
      const productId = parseInt(req.params.id);
      const existingProduct = await storage.getProductById(productId);
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // If a new image was uploaded, use it; otherwise keep the existing one
      const imageUrl = req.file 
        ? `/uploads/${path.basename(req.file.path)}` 
        : req.body.imageUrl || existingProduct.imageUrl;
      
      const productData = {
        ...req.body,
        price: parseFloat(req.body.price),
        imageUrl,
        categoryId: parseInt(req.body.categoryId),
        size: req.body.size || existingProduct.size || "M"
      };
      
      const updatedProduct = await storage.updateProduct(productId, productData);
      
      // Update ingredients if provided
      if (req.body.ingredients) {
        try {
          // Parse ingredients if it's a JSON string
          const ingredients = typeof req.body.ingredients === 'string' 
            ? JSON.parse(req.body.ingredients) 
            : req.body.ingredients;
            
          if (Array.isArray(ingredients)) {
            await storage.updateProductIngredients(
              productId, 
              ingredients.map((ing: any) => ({
                inventoryId: parseInt(ing.inventoryId),
                quantityUsed: parseFloat(ing.quantityUsed)
              }))
            );
          }
        } catch (error) {
          console.error("Error processing ingredients:", error);
        }
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // Delete product endpoint - allows deletion even with sales history
  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to delete a product" });
    }
    
    // Only owners can delete products
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can delete products" });
    }
    
    try {
      const productId = parseInt(req.params.id);
      
      // Check if product exists
      const existingProduct = await storage.getProductById(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Even if the product has sales history, we'll allow deletion
      // The sales history will remain intact with null values for product details
      
      // First delete product ingredients to avoid foreign key constraints
      await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
      
      // Then delete the product
      await db.delete(products).where(eq(products.id, productId));
      
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Inventory API
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });
  
  // Create inventory item
  app.post("/api/inventory", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to add inventory items" });
    }
    
    // Allow both owners and baristas to manage inventory
    if (req.user.role !== "owner" && req.user.role !== "barista") {
      return res.status(403).json({ message: "You don't have permission to manage inventory" });
    }
    
    try {
      // Format the data properly for insertion
      const inventoryData = {
        name: req.body.name,
        currentStock: req.body.currentStock,
        minimumThreshold: req.body.minimumThreshold,
        unit: req.body.unit
      };
      
      console.log("Inventory data received:", JSON.stringify(inventoryData));
      
      // Validate inventory data
      const validationResult = insertInventorySchema.safeParse(inventoryData);
      if (!validationResult.success) {
        console.error("Inventory validation error:", JSON.stringify(validationResult.error.errors));
        return res.status(400).json({
          message: "Invalid inventory data",
          errors: validationResult.error.errors
        });
      }
      
      const newItem = await db.insert(inventory).values(validationResult.data).returning();
      res.status(201).json(newItem[0]);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });
  
  // Update inventory item
  app.put("/api/inventory/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update inventory items" });
    }
    
    // Allow both owners and baristas to manage inventory
    if (req.user.role !== "owner" && req.user.role !== "barista") {
      return res.status(403).json({ message: "You don't have permission to manage inventory" });
    }
    
    try {
      const inventoryId = parseInt(req.params.id);
      
      // Check if inventory item exists
      const existingItem = await db.query.inventory.findFirst({
        where: (inv, { eq }) => eq(inv.id, inventoryId)
      });
      
      if (!existingItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Format the data properly for update
      const inventoryData = {
        name: req.body.name,
        currentStock: req.body.currentStock,
        minimumThreshold: req.body.minimumThreshold,
        unit: req.body.unit
      };
      
      console.log("Inventory update data:", JSON.stringify(inventoryData));
      
      // Validate inventory data
      const validationResult = insertInventorySchema.safeParse(inventoryData);
      if (!validationResult.success) {
        console.error("Inventory validation error:", JSON.stringify(validationResult.error.errors));
        return res.status(400).json({
          message: "Invalid inventory data",
          errors: validationResult.error.errors
        });
      }
      
      // Update the inventory item
      const updatedItem = await db.update(inventory)
        .set(validationResult.data)
        .where(eq(inventory.id, inventoryId))
        .returning();
      
      res.json(updatedItem[0]);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });
  
  // Delete inventory item
  app.delete("/api/inventory/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to delete inventory items" });
    }
    
    // Only owners can delete inventory items
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can delete inventory items" });
    }
    
    try {
      const inventoryId = parseInt(req.params.id);
      
      // Check if inventory item exists
      const existingItem = await db.query.inventory.findFirst({
        where: (inv, { eq }) => eq(inv.id, inventoryId)
      });
      
      if (!existingItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Check if this inventory item is used in any product ingredients
      const usedInProduct = await db.query.productIngredients.findFirst({
        where: (pi, { eq }) => eq(pi.inventoryId, inventoryId)
      });
      
      if (usedInProduct) {
        return res.status(400).json({ 
          message: "Cannot delete inventory item as it is used in one or more products. Remove it from products first." 
        });
      }
      
      // Delete the inventory item
      await db.delete(inventory).where(eq(inventory.id, inventoryId));
      
      res.status(200).json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });
  
  // Get product ingredients
  app.get("/api/products/:id/ingredients", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const ingredients = await storage.getProductIngredients(productId);
      res.json(ingredients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch product ingredients" });
    }
  });

  // Orders API
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create an order" });
    }

    try {
      const { items, total, amountPaid } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain at least one item" });
      }
      
      if (!amountPaid || parseFloat(amountPaid) < parseFloat(total)) {
        return res.status(400).json({ message: "Amount paid must be at least equal to the total" });
      }
      
      const change = parseFloat(amountPaid) - parseFloat(total);
      
      const order = await storage.createOrder({ 
        total, 
        amountPaid: parseFloat(amountPaid),
        change
      }, items, req.user.id);
      
      // Get detailed order information for the response
      const orderSummary = await storage.getOrderDetails(order.id);
      res.status(201).json(orderSummary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  // Get order details
  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view order details" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const orderDetails = await storage.getOrderDetails(orderId);
      
      if (!orderDetails) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(orderDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  // Sales API
  app.get("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view sales data" });
    }

    try {
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      
      console.log(`Fetching sales data with date range: ${fromDate?.toISOString()} to ${toDate?.toISOString()}`);
      
      const salesData = await storage.getSalesData(fromDate, toDate);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
