const { supabaseAdmin } = require('../config/supabaseClient');
const { consentStamp } = require('../constants/legal');

exports.acceptTerms = async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Consent recording is unavailable' });
  }

  const stamp = consentStamp();
  const { error } = await supabaseAdmin
    .from('profiles')
    .update(stamp)
    .eq('id', req.user.id);

  if (error) {
    console.error('Error recording terms acceptance:', error);
    return res.status(500).json({ error: 'Failed to record terms acceptance' });
  }

  return res.json({ ok: true, ...stamp });
};
