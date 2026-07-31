# Pre-Deployment Checklist

This checklist guarantees that the Recovera platform is fully tested, secure, and ready for production deployment across 50 to 500+ B2B clients.

## 1. Security Review & Compliance
- [ ] **Row-Level Security (RLS)**: Verify all 20+ tables have RLS enabled and strictly enforce `branch_id` scoping.
- [ ] **Secrets Management**: Ensure API keys (Twilio, SMTP, Meta, etc.) are strictly read from environment variables or KMS, NOT the database.
- [ ] **Audit Logging**: Confirm `audit_logs` table triggers are active on all mutations (insert/update/delete) for sensitive tables (customers, loans, payments).
- [ ] **Authentication**: Verify Supabase Auth is strictly enforcing email validation and JWTs correctly carry RBAC roles (`Super Admin`, `Branch Manager`, `Recovery Executive`).

## 2. Infrastructure & Database Readiness
- [ ] **Migrations**: Run a fresh `supabase db reset` locally to verify that all migrations apply seamlessly without conflicts.
- [ ] **Indexes**: Verify that high-traffic lookup columns (e.g., `loan_number`, `branch_id`, `customer_id`) have B-Tree indexes.
- [ ] **Background Processing**: Confirm the `npm run worker` daemon boots successfully, connects to the database, and locks rows atomically via `FOR UPDATE SKIP LOCKED`.

## 3. Performance & Optimization
- [ ] **Frontend Build**: Verify `npm run build` passes with zero TypeScript and ESLint errors.
- [ ] **Pagination & Filtering**: Ensure all high-volume tables (Customers, Loans, Audit Logs) rely on server-side pagination instead of loading raw data into browser memory.
- [ ] **Bundle Size**: Verify Vite bundle chunks are properly split and optimized.

## 4. UI Polish & Cross-Browser Testing
- [ ] **Glassmorphism/Dark Mode**: Confirm the UI retains its premium dark-mode aesthetic across Chrome, Safari, and Edge.
- [ ] **Mobile Responsiveness**: Test critical workflows on mobile viewports.
  - Sidebar collapses to a hamburger menu.
  - Data tables scroll horizontally or stack vertically.
  - Modals and forms are fully usable on touch screens.
- [ ] **State Feedback**: Verify empty states, loading skeletons, and error toasts trigger correctly on network latency.

## 5. End-to-End Workflow Validation

### Workflow A: Super Admin
- [ ] Can create, edit, and deactivate Branches.
- [ ] Can view the global Audit Log.
- [ ] Can access the Background Jobs Dashboard.
- [ ] Can configure global Notification Templates and Providers.
- [ ] Can impersonate or view data across all branches without RLS blocks.

### Workflow B: Branch Manager
- [ ] Can only view Customers and Loans assigned to their specific `branch_id`.
- [ ] Can assign cases to Recovery Executives in their branch.
- [ ] Can initiate bulk Excel imports for their branch.
- [ ] Can approve/reject specific workflows if required.
- [ ] Cannot view or modify data belonging to other branches.

### Workflow C: Recovery Executive
- [ ] Can only view cases explicitly assigned to them.
- [ ] Can log follow-ups and update PTP (Promise to Pay) statuses.
- [ ] Cannot delete records (mutations are heavily restricted).
- [ ] Cannot access the Admin Dashboard or Background Workers.

## 6. Final Sign-Off
- [ ] All dummy/seed data removed from production databases.
- [ ] Production `.env` files generated and secured.
- [ ] Walkthrough and documentation handed over to DevOps.
