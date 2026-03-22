const router = require('express').Router();
const { getDeliveryFee } = require('../utils/pricing');

// GET /api/delivery-fee?qty=N
// Public endpoint — no auth required
router.get('/', async (req, res) => {
  const qty = parseInt(req.query.qty, 10);
  if (!qty || qty < 1) return res.status(400).json({ error: 'qty required' });
  try {
    const result = await getDeliveryFee(qty);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
