import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db } from "@db";
import { products, insertProductSchema } from "@shared/schema";
import multer from "multer";
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
    
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can create products" });
    }
    
    try {
      const imageUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : null;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Product image is required" });
      }
      
      const productData = {
        ...req.body,
        price: parseFloat(req.body.price),
        imageUrl,
        categoryId: parseInt(req.body.categoryId)
      };
      
      // Validate product data
      const validationResult = insertProductSchema.safeParse(productData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validationResult.error.errors 
        });
      }
      
      const product = await storage.createProduct(productData);
      
      // Add ingredients if provided
      if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
        await storage.addProductIngredients(
          product.id, 
          req.body.ingredients.map((ing: any) => ({
            inventoryId: parseInt(ing.inventoryId),
            quantityUsed: parseFloat(ing.quantityUsed)
          }))
        );
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
    
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owners can update products" });
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
        categoryId: parseInt(req.body.categoryId)
      };
      
      const updatedProduct = await storage.updateProduct(productId, productData);
      
      // Update ingredients if provided
      if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
        await storage.updateProductIngredients(
          productId, 
          req.body.ingredients.map((ing: any) => ({
            inventoryId: parseInt(ing.inventoryId),
            quantityUsed: parseFloat(ing.quantityUsed)
          }))
        );
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update product" });
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
      const salesData = await storage.getSalesData();
      res.json(salesData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
