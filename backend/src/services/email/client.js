const { Resend } = require('resend');
const { getFrontendUrl } = require('../../config/stripeClient');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PimSuea <onboarding@resend.dev>';

const isEmailConfigured = () => Boolean(resend);

/** App link with UTM so the analytics dashboard can measure email recovery. */
function appLink(path, campaign) {
  const url = new URL(path, getFrontendUrl());
  url.searchParams.set('utm_source', 'email');
  url.searchParams.set('utm_medium', 'lifecycle');
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}

async function deliver({ to, subject, html, text, headers }) {
  if (!resend) return { skipped: 'not_configured' };
  const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text, headers });
  if (error) throw new Error(error.message || 'Resend send failed');
  return { id: data?.id };
}

module.exports = { isEmailConfigured, appLink, deliver };
