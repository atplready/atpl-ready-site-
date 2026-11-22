# ATPL Ready — Stripe backend (staging only)

This folder contains a server-side Stripe Checkout draft for the three proposed bundles: **€9 / €39 / €99**. The public presentation site has **no checkout integration** and cannot charge customers. **No PDF files are published here**.

## Safety defaults
- \`CHECKOUT_ENABLED\` defaults to false: the checkout endpoint returns HTTP 503.
- \`STRIPE_TEST_ONLY\` defaults to true: only \`sk_test_...\` keys can create sessions.
- Webhook signature is verified, but **fulfillment is intentionally not implemented**. The example logs an event ID only.
- No live payment should be accepted before secure fulfillment, customer support details, legal terms, refunds and tax treatment are confirmed.

## Future local development
\`\`\`sh
cd payments
npm install
npm test
STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... CHECKOUT_ENABLED=false npm start
\`\`\`

The endpoint accepts only \`{ "pack":"five", "subjects":["010","021","022","031","032"], "language":"fr" }\` with a valid unique selection and recalculates the cost on the server. Checkout price data are never read from the browser.

Required before production:
1. Connect an owned Stripe account through a secure authorization flow.
2. Confirm the legal seller, VAT/taxes and terms for digital content.
3. Make the private, quality-checked FR/EN PDFs available from secure storage.
4. Implement persistent orders, idempotent webhook processing, paid-session verification and short-lived download links.
5. Configure a verified transactional sender for \`atplready@gmail.com\` or a custom business domain.
6. Implement test-mode end-to-end fulfillment before enabling live Stripe keys.
7. Deploy the backend separately and link it with the static frontend; do not change checkout buttons until ready.
