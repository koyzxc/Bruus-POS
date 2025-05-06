import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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

  // Orders API
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create an order" });
    }

    try {
      const { items, total } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain at least one item" });
      }

      const order = await storage.createOrder({ total }, items, req.user.id);
      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create order" });
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
