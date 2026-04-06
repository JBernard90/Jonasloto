import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API Routes
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Jonas Loto Center: Email credentials not configured');
    return res.status(500).json({ error: 'Configuration e-mail manquante sur le serveur' });
  }

  const mailOptions = {
    from: `"Jonas Loto Center" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Votre code de vérification - Jonas Loto Center',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #003087; text-align: center;">Jonas Loto Center</h2>
        <p>Bonjour,</p>
        <p>Voici votre code de vérification pour vous connecter à votre compte :</p>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #003087;">${code}</span>
        </div>
        <p>Ce code est valable pendant 10 minutes. Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2026 Jonas Loto Center. Tous droits réservés.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Jonas Loto Center: Failed to start server:', err);
});
