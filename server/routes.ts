import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db, pool } from "@db";
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
  
  // Admin user management routes (owner only)
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const { username, password, role } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password before creating user
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      const user = await storage.createUser({ username, password: hashedPassword, role });
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const { username, role, password } = req.body;
      
      // Check if username already exists (excluding current user)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Prepare update data
      let updateData: any = { username, role };
      
      // Hash password if provided
      if (password && password.trim() !== "") {
        const { scrypt, randomBytes } = await import("crypto");
        const { promisify } = await import("util");
        const scryptAsync = promisify(scrypt);
        
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        const hashedPassword = `${buf.toString("hex")}.${salt}`;
        
        updateData.password = hashedPassword;
      }
      
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deleting self
      if (userId === req.user?.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Update user permissions endpoint
  app.put("/api/admin/users/:id/permissions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const { canAddProducts, canManageInventory, canViewSales } = req.body;
      
      // Update user permissions
      const updatedUser = await storage.updateUserPermissions(userId, {
        canAddProducts,
        canManageInventory,
        canViewSales
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });
  
  // Serve static files from the 'public' directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use('/real_images', express.static(path.join(process.cwd(), 'public', 'real_images')));

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
            // Process ingredients - the new format includes size information
            const processedIngredients = ingredients.map((ing: any) => ({
              inventoryId: parseInt(ing.inventoryId),
              quantityUsed: parseFloat(ing.quantityUsed),
              // If the ingredient has a size property, use it; otherwise default to the product's size
              size: ing.size || productValidationData.size
            }));
            
            await storage.addProductIngredients(
              product.id, 
              processedIngredients
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
            // Process ingredients with size information
            const processedIngredients = ingredients.map((ing: any) => ({
              inventoryId: parseInt(ing.inventoryId),
              quantityUsed: parseFloat(ing.quantityUsed),
              // If the ingredient has a size property, use it; otherwise default to the product's size
              size: ing.size || productData.size
            }));
            
            await storage.updateProductIngredients(
              productId, 
              processedIngredients
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
        containerType: req.body.containerType || "direct",
        containerQuantity: req.body.containerQuantity || null,
        numberOfContainers: req.body.numberOfContainers || "1", // Add support for number of containers
        secondaryUnit: req.body.secondaryUnit || null,
        quantityPerUnit: req.body.quantityPerUnit || null,
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
  
  // Update inventory item (supports both PUT and PATCH)
  app.put("/api/inventory/:id", async (req: Request, res: Response) => {
    await handleInventoryUpdate(req, res);
  });
  
  app.patch("/api/inventory/:id", async (req: Request, res: Response) => {
    await handleInventoryUpdate(req, res);
  });
  
  // Handler function for inventory updates
  async function handleInventoryUpdate(req: Request, res: Response) {
    console.log("Received inventory update request:", JSON.stringify(req.body));
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
        containerType: req.body.containerType || "direct",
        containerQuantity: req.body.containerQuantity || null,
        numberOfContainers: req.body.numberOfContainers || "1", // Add support for number of containers
        secondaryUnit: req.body.secondaryUnit || null,
        quantityPerUnit: req.body.quantityPerUnit || null,
        unit: req.body.unit
      };
      
      console.log("Inventory update data:", JSON.stringify(inventoryData));
      
      // Handle container quantities calculation if needed
      if (inventoryData.containerType !== "direct" && 
          inventoryData.quantityPerUnit && 
          inventoryData.quantityPerUnit !== null) {
        
        const currentStock = parseFloat(inventoryData.currentStock);
        const quantityPerUnit = parseFloat(inventoryData.quantityPerUnit);
        
        if (!isNaN(currentStock) && !isNaN(quantityPerUnit) && quantityPerUnit > 0) {
          // Calculate how many secondary units based on current stock
          const calculatedSecondaryUnits = Math.floor(currentStock / quantityPerUnit);
          inventoryData.containerQuantity = calculatedSecondaryUnits.toString();
          
          console.log(`Calculated secondary units: ${calculatedSecondaryUnits} based on stock ${currentStock} and quantity per unit ${quantityPerUnit}`);
        }
      }
      
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
  }
  
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
      const usedInProducts = await db.query.productIngredients.findMany({
        where: (pi, { eq }) => eq(pi.inventoryId, inventoryId),
        with: {
          product: true
        }
      });
      
      if (usedInProducts.length > 0) {
        // Remove this ingredient from all products that use it
        await db.delete(productIngredients).where(eq(productIngredients.inventoryId, inventoryId));
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
      
      // Debug: Log the first few records to see if createdAt is included
      console.log("Sales data sample:", JSON.stringify(salesData.slice(0, 2), null, 2));
      
      // Force no cache on this response
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });
  
  // Get non-selling products API
  app.get("/api/sales/non-selling", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view sales data" });
    }

    try {
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      
      console.log(`Fetching non-selling products with date range: ${fromDate?.toISOString()} to ${toDate?.toISOString()}`);
      
      const nonSellingProducts = await storage.getNonSellingProducts(fromDate, toDate);
      res.json(nonSellingProducts);
    } catch (error) {
      console.error("Error fetching non-selling products:", error);
      res.status(500).json({ message: "Failed to fetch non-selling products" });
    }
  });

  // Special route to delete Coffee Matcha product and its sales history
  app.delete("/api/special/delete-coffee-matcha", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to delete products" });
    }
    
    // Only owners can delete products
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can delete products" });
    }
    
    try {
      // For this special case, we'll use raw SQL to bypass the foreign key constraints
      // since we need to forcefully delete a product that has order history
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Coffee Matcha products have IDs 38 and 40 based on our database
        const coffeeMatchaIds = [38, 40]; // IDs for both size variants
        
        // First identify and save the order_items referencing these products
        const { rows: orderItemsToUpdate } = await client.query(
          'SELECT id FROM order_items WHERE product_id = ANY($1)', 
          [coffeeMatchaIds]
        );
        
        if (orderItemsToUpdate.length > 0) {
          console.log(`Found ${orderItemsToUpdate.length} order items referencing Coffee Matcha products`);
          
          // Set the references to NULL directly in the database
          await client.query(
            'UPDATE order_items SET product_id = NULL WHERE product_id = ANY($1)',
            [coffeeMatchaIds]
          );
          
          console.log('Updated order_items to set product_id to NULL');
        }
        
        // Delete any product ingredients
        const { rowCount: deletedIngredients } = await client.query(
          'DELETE FROM product_ingredients WHERE product_id = ANY($1)',
          [coffeeMatchaIds]
        );
        
        console.log(`Deleted ${deletedIngredients} ingredient records for Coffee Matcha products`);
        
        // Finally delete the products
        const { rowCount: deletedProducts } = await client.query(
          'DELETE FROM products WHERE id = ANY($1)',
          [coffeeMatchaIds]
        );
        
        if (deletedProducts === 0) {
          throw new Error('No Coffee Matcha products found to delete');
        }
        
        console.log(`Successfully deleted ${deletedProducts} Coffee Matcha product variants`);
        
        await client.query('COMMIT');
        res.json({ 
          success: true, 
          message: `Coffee Matcha products and their sales history references have been removed (${deletedProducts} variants)` 
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error deleting Coffee Matcha product:", error);
      res.status(500).json({ message: "Failed to delete Coffee Matcha product" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
