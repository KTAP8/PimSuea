const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { createClaimToken, claimGuest } = require('../services/guestClaim');

const router = express.Router();

/** Anonymous (guest) users fetch this before signing up, so their work can follow them. */
router.post('/claim-token', requireAuth, (req, res) => {
  if (!req.user.is_anonymous) return res.status(400).json({ error: 'Not a guest session' });
  res.json({ token: createClaimToken(req.user.id) });
});

/** Called once by a permanent account right after login/signup. */
router.post('/claim', requireAuth, async (req, res) => {
  if (req.user.is_anonymous) return res.status(400).json({ error: 'Sign in to an account first' });
  try {
    const result = await claimGuest(req.body?.token, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('[guest/claim]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
