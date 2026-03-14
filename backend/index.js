
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generalLimiter, strictLimiter } = require('./src/middleware/rateLimiter');

const dashboardRoutes = require('./src/routes/dashboardRoutes');
const catalogRoutes = require('./src/routes/catalogRoutes');
const designRoutes = require('./src/routes/designRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const articleRoutes = require('./src/routes/articleRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(generalLimiter);               // global rate limit — all routes
app.use('/api/waitlist', strictLimiter); // stricter limit — public endpoint

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/uploads', require('./src/routes/uploadRoutes'));
app.use('/api/pricing', require('./src/routes/pricingRoutes'));
app.use('/api/waitlist', require('./src/routes/waitlistRoutes'));

// Health check
app.get('/', (req, res) => {
  res.send('PimSuea Backend API is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
