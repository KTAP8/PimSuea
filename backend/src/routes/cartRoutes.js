const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const cart = require('../controllers/cartController');

router.get('/', requireAuth, cart.getCart);
router.post('/items', requireAuth, cart.upsertItem);
router.put('/items/:id', requireAuth, cart.updateItem);
router.delete('/items/:id', requireAuth, cart.removeItem);
router.delete('/', requireAuth, cart.clearCart);

module.exports = router;
