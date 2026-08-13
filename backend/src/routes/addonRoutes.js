const router = require('express').Router();
const { listActiveAddons } = require('../utils/pricing');

// GET /api/addons — active add-on catalog (public, no auth)
router.get('/', async (_req, res) => {
  try {
    const addons = await listActiveAddons();
    res.json(addons);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch add-ons' });
  }
});

module.exports = router;
