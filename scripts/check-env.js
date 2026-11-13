const required = ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','SITE_URL','SUPABASE_URL','SUPABASE_SERVICE_KEY','RESEND_API_KEY','RESEND_FROM'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn('[check-env] Em falta:', missing.join(', '));
} else {
  console.log('[check-env] OK — todas as variáveis obrigatórias estão definidas.');
}
