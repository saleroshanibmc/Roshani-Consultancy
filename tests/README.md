# Form regression checks

Run the submission helper tests with Node 24:

```powershell
node --test tests/enquiry.test.mjs
npx tsc --noEmit
npm run build
```

With the dev server running, open a page with `agent-browser` and evaluate the
browser check in that page:

```powershell
npx --yes agent-browser open http://127.0.0.1:8080/contact
Get-Content tests/public-forms.browser.js -Raw | npx --yes agent-browser eval --stdin
```

Public routes covered: `/contact`, `/company-registration`,
`/services/trademark-registration`, `/partner-with-us`, `/gst-taxation`, and `/`
(the consultation popup). For the popup, clear session storage before opening
the home page in the same browser session. The check waits for the popup timer.

The public check covers empty input, invalid phone, service selection, pending
state, duplicate submission protection, failure retaining input, successful
retry, and route-specific payload fields.

For admin forms, open `/admin/clients` at the login screen and evaluate
`tests/admin-forms.browser.js` in the same way. It covers login, client creation,
service creation, settings, CSV import, and clearing stale import data after
an invalid file selection.

All submission requests in these checks use mocked responses. They do not
send email or change actual admin data. Email delivery and the recipient linked
to the Web3Forms access key require a separate live check. Persistent admin
operations require the Cloudflare D1/R2 bindings and authentication secrets
described in `CLIENT_PORTFOLIO_SETUP.md`; those are not configured locally.
