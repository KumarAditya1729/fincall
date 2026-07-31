# Deployment Checklist

Work through this before each production release. Items marked **[auto]** are handled
by the hosting platform and need verification only.

## 1. Build and code health

- [ ] `tsgo --noEmit` passes with zero errors.
- [ ] Production build completes with no warnings about unresolved imports.
- [ ] No `console.log` left in mutation or authentication paths.
- [ ] Dependency scan reviewed; no critical advisories outstanding.

## 2. Database

- [ ] All migrations applied; schema matches `docs/PROJECT_CONSTITUTION.md` standards
      (uuid id, timestamps, `created_by`, `branch_id`, `deleted_at`).
- [ ] Every public table has RLS enabled **and** explicit GRANTs.
- [ ] Database linter reviewed; only the seven accepted self-authorising routines
      appear (see `KNOWN_LIMITATIONS.md`).
- [ ] Indexes present for every filter/sort used by the service layer.
- [ ] Automated backups enabled and a restore rehearsed at least once per quarter.

## 3. Authentication and access

- [ ] Email confirmation policy matches the lender's onboarding process.
- [ ] Anonymous sign-up disabled.
- [ ] Google sign-in provider configured with the production redirect URL.
- [ ] Password reset email template branded and tested end to end.
- [ ] First user promoted to Super Admin; verify at least two Super Admins exist so no
      one can be locked out.
- [ ] Test one account per role (Super Admin, Branch Manager, Recovery Executive) and
      confirm branch scoping in the recovery queue and audit log.

## 4. Master data seeding

- [ ] Branches created with correct codes and cities.
- [ ] Employees created and assigned to their branch.
- [ ] Call statuses, purposes and other master items populated.
- [ ] Working hours and holiday calendar configured per branch.
- [ ] Company settings (name, contact, compliance defaults) filled in.

## 5. Data migration

- [ ] Borrower import dry-run on a copy; review the error report before the real run.
- [ ] Loan import run **after** borrowers, so customer codes resolve.
- [ ] Row counts reconciled against the source system.
- [ ] Spot-check outstanding and overdue amounts on ten borrowers.

## 6. Security review

- [ ] Security scan run; no unresolved critical findings.
- [ ] Confirm no service-role key or database password is referenced in client code.
- [ ] Confirm search inputs still route through `sanitiseSearch`.
- [ ] Confirm audit and activity logs cannot be edited or deleted from the app.

## 7. Performance sanity

- [ ] Recovery queue loads in under two seconds against production data volume.
- [ ] Dashboard aggregates return in a single round trip.
- [ ] Import of a 2,000-row file completes without timing out.

## 8. Accessibility and responsiveness

- [ ] Keyboard-only pass through sign-in → recovery queue → log call → record payment.
- [ ] Mobile pass at 375 px on the recovery queue and borrower detail screens.
- [ ] Skip link and landmark structure verified with a screen reader.

## 9. Release

- [ ] `RELEASE_NOTES.md` updated.
- [ ] Publish the application. **[auto]** Backend changes go live immediately;
      frontend changes ship when the deployment completes.
- [ ] Verify the published URL serves the sign-in page and that a real sign-in works.
- [ ] Custom domain connected and TLS verified, if applicable.

## 10. Post-release

- [ ] Watch error reports for the first hour after release.
- [ ] Confirm the first production payment and first production call log appear in the
      audit trail.
- [ ] Communicate the change log to branch managers.
