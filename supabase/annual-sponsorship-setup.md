# Annual sponsorship setup

These changes are local only. Apply the database update before using the new
sponsorship checkout against a hosted backend.

1. Apply `supabase/sponsorship-annual-funding.sql` after the existing project
   schema and `supabase/migrations.sql`. It adds the contribution ledger, public
   funding totals, and a service-role-only payment allocation function.
2. Deploy the updated `verify-paystack-transaction`, `paystack-webhook`, and
   `sync-paystack-transactions` functions together, including their `_shared`
   dependencies. Keep their existing authentication, webhook, secret, and
   gateway settings.
3. Use Paystack test mode to confirm a multiple-child payment and repeated
   delivery of the same reference before using these changes in production.

No changes were made to card entry, the Paystack payment popup, login, or the
webhook signature verification. Monthly support retains the existing payment
flow: donors complete a $25 contribution through checkout each month. This
update does not create an automatic billing subscription or send emails.

The annual target is $300 per child per UTC calendar year, across all donors.
Only allocations from verified, completed payments count. A target reached
notice appears in the donor account, sponsorship page, and checkout for monthly
sponsors. The next contribution prompts the donor to choose another child.
Checkout refreshes totals immediately before opening the existing payment
popup. Simultaneous completed payments are recorded in full, even if their
combined amount passes the target; funds are never silently omitted or moved.

Legacy sponsorships retain their reserved status and credit workflow. Their
historical amounts are not assumed to be payments toward a new annual target.
New annual contributions remain attached to their original child when a donor
ends the relationship; they cannot be reused as legacy sponsorship credit.

The funding totals are read from the public `get_child_annual_funding(p_year)`
RPC defined in `supabase/sponsorship-annual-funding.sql`. A missing migration,
RPC permission error or temporary service failure previously blocked checkout
with “Annual funding could not be loaded.” Checkout now falls back to the
public `children` table to confirm current availability. Unknown totals remain
unknown; cached balances and known pending/reserved/full restrictions are
preserved. If child availability cannot be checked either, checkout asks for a
retry. General donation checkout remains independent.

A read-only check on September 29, 2026 confirmed HTTP 404 / `PGRST202`
for `get_child_annual_funding(p_year)` on the configured backend: the function
was absent from its schema cache. The public children endpoint returned HTTP
200. Apply the SQL above and deploy the shared payment functions before
publishing this frontend; the local update does not change the hosted database.

One-time child support defaults to $50 and accepts custom amounts of at least
$25, to two decimal places. The named annual plans and $25 monthly contribution
keep their fixed prices. Known remaining annual funding still limits the next
payment. The database allocation function and shared payment validation must
both be updated to accept these custom amounts.

The annual recording migration is still required to allocate real payments;
missing display metadata never changes a payment into a legacy sponsorship.
If the recording RPC is absent, the verified donation is retained, the backend
reports the missing setup, and its original reference can be retried after
the migration is applied. Browser verification, webhook retries and admin
transaction sync use the same idempotent annual allocation path.

Local checks:

```sh
node --test tests/*.test.js
npm run build
```

The recording tests mock the database boundary. They verify allocation retries
and payment-reference reuse; they do not replace applying and testing the SQL
against a local or staging Supabase database. Funding-source tests cover missing
RPCs, network/timeouts, malformed metadata, status fallback, and preserved
restrictions without querying a hosted database.
