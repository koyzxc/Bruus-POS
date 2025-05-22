import { db } from "./index";
import { orders, orderItems, products, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function generateSalesData() {
  console.log("Generating 30 days of sales data...");

  // Clear existing orders and order items
  await db.delete(orderItems);
  await db.delete(orders);

  // Get all products and users
  const allProducts = await db.query.products.findMany();
  const allUsers = await db.query.users.findMany();

  if (allProducts.length === 0 || allUsers.length === 0) {
    console.log("No products or users found. Please create them first.");
    return;
  }

  const baristaUser = allUsers.find(u => u.role === "barista") || allUsers[0];

  // Generate sales for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  let orderCounter = 1;

  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Generate 5-15 orders per day (more on weekends)
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const ordersPerDay = Math.floor(Math.random() * (isWeekend ? 10 : 8)) + (isWeekend ? 8 : 5);

    for (let orderNum = 0; orderNum < ordersPerDay; orderNum++) {
      // Generate random time during business hours (7 AM - 9 PM)
      const hour = Math.floor(Math.random() * 14) + 7; // 7-21
      const minute = Math.floor(Math.random() * 60);
      const orderDate = new Date(currentDate);
      orderDate.setHours(hour, minute, 0, 0);

      // Generate order ID in format BRUUS-2025-XXXX
      const orderIdNumber = String(orderCounter).padStart(4, '0');
      const orderId = `BRUUS-2025-${orderIdNumber}`;
      orderCounter++;

      // Calculate total amount first to determine payment method
      let totalAmount = 0;
      const orderItemsData = [];

      // Generate 1-4 items per order
      const itemsInOrder = Math.floor(Math.random() * 4) + 1;
      const usedProducts = new Set();

      for (let i = 0; i < itemsInOrder; i++) {
        let randomProduct;
        let attempts = 0;
        
        // Try to get a unique product (avoid duplicates in same order)
        do {
          randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
          attempts++;
        } while (usedProducts.has(`${randomProduct.name}-${randomProduct.size}`) && attempts < 10);
        
        usedProducts.add(`${randomProduct.name}-${randomProduct.size}`);

        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const itemTotal = parseFloat(randomProduct.price) * quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: randomProduct.id,
          quantity,
          price: randomProduct.price,
          total: itemTotal.toFixed(2)
        });
      }

      // Determine payment method and calculate change
      const paymentMethods = ["cash", "card", "gcash"];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      let amountPaid = totalAmount;
      let change = 0;

      if (paymentMethod === "cash") {
        // For cash payments, sometimes customer pays more than exact amount
        const extraAmounts = [0, 5, 10, 20, 50, 100];
        const extraAmount = extraAmounts[Math.floor(Math.random() * extraAmounts.length)];
        amountPaid = totalAmount + extraAmount;
        change = amountPaid - totalAmount;
      }

      // Create order
      const [createdOrder] = await db.insert(orders).values({
        id: orderId,
        totalAmount: totalAmount.toFixed(2),
        paymentMethod,
        amountPaid: amountPaid.toFixed(2),
        change: change.toFixed(2),
        status: "completed",
        createdAt: orderDate,
        userId: baristaUser.id
      }).returning();

      // Create order items
      const orderItemsWithOrderId = orderItemsData.map(item => ({
        ...item,
        orderId: createdOrder.id
      }));

      await db.insert(orderItems).values(orderItemsWithOrderId);
    }

    console.log(`Generated ${ordersPerDay} orders for ${currentDate.toDateString()}`);
  }

  // Get final counts
  const totalOrders = await db.select().from(orders);
  const totalOrderItems = await db.select().from(orderItems);
  
  console.log(`✅ Generated ${totalOrders.length} orders with ${totalOrderItems.length} order items over 30 days`);
  
  // Show summary by category
  const salesSummary = await db.execute(`
    SELECT 
      c.name as category,
      COUNT(oi.id) as items_sold,
      SUM(oi.total::decimal) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    ORDER BY total_revenue DESC
  `);
  
  console.log("\n📊 Sales Summary by Category:");
  salesSummary.rows.forEach((row: any) => {
    console.log(`${row.category}: ${row.items_sold} items sold, ₱${parseFloat(row.total_revenue).toFixed(2)} revenue`);
  });
}

generateSalesData().catch(console.error);