# ATPL Ready — Commercial launch checklist

Current state: bilingual presentation website live; no payment, no PDF downloads.

## Confirm source products
- DONE: Received original Pack_13_Fiches_ATPL_EASA_PPL_QCM.zip from the owner on 22 November 2026. Verified 13 PDFs (34 pages total) plus the reading guide. Source catalog is stored in catalog/source-manifest.json; the paid PDFs are not in this public repository.
- Inspect PDF contents and establish exact subject-to-PDF mapping, versioning, corrections, and commercial quality review.
- Translate each PDF into English and have aviation terminology and EASA references checked before claiming English PDFs are available.

## Checkout & delivery
- Connect the owner's Stripe account with explicit authorization.
- Implement secure server-side checkout for 9 EUR (one subject), 39 EUR (five distinct subjects), and 99 EUR (13 subjects).
- Store product ID/subject selection in Stripe metadata or server-side order database; validate quantity and amount server-side.
- Verify Stripe payment with a signed webhook, not browser-only checkout state.
- Issue time-limited download links; do not expose paid PDFs in the public directory.
- Configure an authorized email-sending provider/account (Gmail currently connected to personal address, not atplready@gmail.com).
- Test delivery, failed payment, duplicate webhook, refunds, and email bounce handling.

## Legal & launch
- Provide seller legal identity, contact, T&C/CGV, privacy/cookies as applicable, consumer information for digital products, and appropriate tax treatment.
- Review marketing claims: educational introductions, not exhaustive courses or official EASA materials.
- Activate live checkout only after all checks pass.
