const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');
const { verifyUnsubscribe } = require('../services/email/unsubscribe');

const router = express.Router();

/** One-click unsubscribe from reminder emails (order emails are transactional and still sent). */
router.post('/unsubscribe', async (req, res) => {
  const { u, t } = req.body ?? {};
  if (!verifyUnsubscribe(u, t)) return res.status(400).json({ error: 'Invalid link' });
  const { error } = await supabaseAdmin.from('profiles').update({ email_opt_out: true }).eq('id', u);
  if (error) return res.status(500).json({ error: 'Could not update preferences' });
  res.json({ ok: true });
});

module.exports = router;
