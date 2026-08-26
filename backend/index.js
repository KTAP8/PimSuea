
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generalLimiter, strictLimiter } = require('./src/middleware/rateLimiter');
const { startCheckoutDraftMaintenanceJob } = require('./src/jobs/checkoutDraftMaintenance');

const dashboardRoutes = require('./src/routes/dashboardRoutes');
const catalogRoutes = require('./src/routes/catalogRoutes');
const designRoutes = require('./src/routes/designRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const articleRoutes = require('./src/routes/articleRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const stripeWebhookRoutes = require('./src/routes/stripeWebhookRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://pimsuea.com',
  'https://www.pimsuea.com',
  'https://app.pimsuea.com',
  'https://www.app.pimsuea.com',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({
  origin: "*"
}));

// Stripe webhook must receive raw body — register before express.json().
// Canonical path is /api/webhooks/stripe. Also accept POST / because the
// live Stripe Dashboard endpoint was registered as the Render service root.
app.use('/api/webhooks/stripe', stripeWebhookRoutes);
app.use('/', stripeWebhookRoutes);

app.use(express.json({
    verify: (req, _res, buf) => { req.rawBody = buf; }
}));
app.use(generalLimiter);               // global rate limit — all routes
app.use('/api/waitlist', strictLimiter); // stricter limit — public endpoint

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/uploads', require('./src/routes/uploadRoutes'));
app.use('/api/pricing', require('./src/routes/pricingRoutes'));
app.use('/api/waitlist', require('./src/routes/waitlistRoutes'));
app.use('/api/delivery-fee', require('./src/routes/deliveryFeeRoutes'));
app.use('/api/addons', require('./src/routes/addonRoutes'));
app.use('/api/coupons', require('./src/routes/couponRoutes'));
app.use('/api/terms', require('./src/routes/termsRoutes'));

// Health check
app.get('/', (req, res) => {
  res.send('PimSuea Backend API is running!');
});

startCheckoutDraftMaintenanceJob();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
