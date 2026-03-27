import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock MonCash/NatCash Payment Initiation
  app.post("/api/payments/initiate", (req, res) => {
    const { method, amount, phoneNumber } = req.body;
    console.log(`Initiating ${method} payment for ${amount} HTG to ${phoneNumber}`);
    
    // Simulate payment processing
    setTimeout(() => {
      res.json({
        success: true,
        transactionId: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        message: "Payment initiated successfully"
      });
    }, 1000);
  });

  // Mock Payout Initiation
  app.post("/api/payouts/initiate", (req, res) => {
    const { method, amount, phoneNumber } = req.body;
    console.log(`Initiating ${method} payout for ${amount} HTG to ${phoneNumber}`);
    
    setTimeout(() => {
      res.json({
        success: true,
        transactionId: `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        message: "Payout processed successfully"
      });
    }, 1000);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
