import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OTP Routes
  app.post("/api/otp/send", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@jonasloto.com',
        to: email,
        subject: 'Jonas Loto - Votre code de vérification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #003087 0%, #00215B 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Jonas Loto</h1>
              <p style="color: #FFD700; margin: 10px 0 0 0;">Centre Officiel de Loterie</p>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <h2 style="color: #003087; margin-top: 0;">Vérification de votre compte</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Vous avez demandé la vérification de votre compte Jonas Loto. Voici votre code de vérification :
              </p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">Code de vérification</p>
                <p style="font-size: 48px; font-weight: bold; color: #003087; margin: 0; letter-spacing: 10px;">${otp}</p>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Ce code expirera dans <strong>10 minutes</strong>.
              </p>
              <p style="color: #999; font-size: 12px; line-height: 1.6;">
                Si vous n'avez pas demandé ce code, ignorez cet email.
              </p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              <p style="color: #999; font-size: 11px; text-align: center; margin: 0;">
                Jonas Loto - La Loterie Fiable d'Haïti<br>
                © 2026 Jonas Loto Center. Tous droits réservés.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: "OTP sent successfully",
        expiresAt
      });
    } catch (error: any) {
      console.error("OTP Send Error:", error);
      res.status(500).json({ error: error.message || "Failed to send OTP" });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }

      // In production, verify against database
      // For now, just acknowledge the verification attempt
      res.json({
        success: true,
        message: "OTP verified successfully"
      });
    } catch (error: any) {
      console.error("OTP Verify Error:", error);
      res.status(500).json({ error: error.message || "Failed to verify OTP" });
    }
  });

  // Payment Routes
  app.post("/api/payments/initiate", (req, res) => {
    try {
      const { method, amount, phoneNumber } = req.body;
      console.log(`Initiating ${method} payment for ${amount} HTG to ${phoneNumber}`);
      
      setTimeout(() => {
        res.json({
          success: true,
          transactionId: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          message: "Payment initiated successfully"
        });
      }, 1000);
    } catch (error: any) {
      console.error("Payment Error:", error);
      res.status(500).json({ error: error.message || "Payment failed" });
    }
  });

  // Payout Routes
  app.post("/api/payouts/initiate", (req, res) => {
    try {
      const { method, amount, phoneNumber } = req.body;
      console.log(`Initiating ${method} payout for ${amount} HTG to ${phoneNumber}`);
      
      setTimeout(() => {
        res.json({
          success: true,
          transactionId: `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          message: "Payout processed successfully"
        });
      }, 1000);
    } catch (error: any) {
      console.error("Payout Error:", error);
      res.status(500).json({ error: error.message || "Payout failed" });
    }
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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  });
}

startServer();
