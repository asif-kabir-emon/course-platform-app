# Production Readiness Roadmap

This roadmap tracks the work required to operate KnowVeria as a production
business. Items are ordered by risk and dependency.

## Completed Foundation

- [x] Upgrade the project to current supported Next.js and dependency versions.
- [x] Resolve active dependency CVEs reported by the package audit.
- [x] Add responsive shared layouts, consistent UI, skeleton loading, and
      top-right notifications.
- [x] Fix invalid table markup and hydration errors.
- [x] Add email OTP delivery to the signup flow.
- [x] Avoid calling the token verification API on every page refresh.
- [x] Add a shared Prisma client to prevent development connection churn.
- [x] Support both `admin` and `super_admin` in admin authorization checks.
- [x] Move JWT signing to `JWT_SECRET`, with temporary legacy environment
      fallback.
- [x] Make Stripe fulfillment idempotent by checkout session.
- [x] Make Stripe webhooks the only database writer for successful purchases.
- [x] Add Stripe webhook signature validation and payment-status checks.
- [x] Add idempotency keys to refund requests.
- [x] Correct refund entitlement checks to use only the purchaser's other
      active purchases.
- [x] Correct the dashboard's unrefunded purchase count.
- [x] Add CI validation for Prisma generation, TypeScript, lint, and builds.
- [x] Pin Prisma 6 for MongoDB compatibility until Prisma 7 officially
      supports MongoDB.
- [x] Replace destructive product deletion in the admin list with reversible
      archive, restore, publish, and unpublish actions.
- [x] Add server-side pagination to growing admin product, course, and sales
      datasets.
- [x] Add server-side product, course, customer, payment-status, and archive
      filters to growing admin tables.
- [x] Allow admins to preview all course content without purchases while
      keeping learner progress and assessment analytics isolated.
- [x] Restrict product archival/restoration and payment refunds to super
      administrators in both the UI and API.

## Phase 1: Security and Authentication

- [ ] Replace browser-readable access tokens with secure, `httpOnly`,
      `sameSite` cookies.
- [ ] Add CSRF protection for state-changing cookie-authenticated requests.
- [ ] Remove the legacy `NEXT_PUBLIC_JWT_SECRET` fallback after every
      environment has `JWT_SECRET`.
- [ ] Rotate JWT, SMTP, database, and Stripe secrets.
- [ ] Add rate limiting for signup, login, OTP, password reset, checkout, and
      refund endpoints.
- [ ] Add OTP attempt limits and server-enforced resend cooldowns.
- [ ] Add temporary account lockout after repeated failed login attempts.
- [ ] Return generic authentication errors to reduce account enumeration.
- [ ] Add security headers and a Stripe/YouTube-compatible Content Security
      Policy.
- [ ] Add an administrator audit log for content, access, and refund actions.

## Phase 2: Data and Payment Reliability

- [x] Store and deduplicate Stripe webhook event IDs.
- [x] Add explicit webhook processing states and retry visibility.
- [x] Add a purchase-pending page for delayed payment methods.
- [ ] Reconcile successful Stripe payments against local purchase records.
- [x] Remove the incorrect `CourseSections` to `Products` Prisma relationship.
- [ ] Choose one source of truth for product course membership instead of
      maintaining both `courseIds` and `CourseProducts`.
- [x] Add database indexes for common product, purchase, access, and lesson
      queries.
- [ ] Configure automated database backups and test restoration.

## Phase 3: Testing and Operations

- [ ] Add unit tests for authorization, pricing, progress, and refund rules.
- [ ] Add API integration tests against a disposable test database.
- [ ] Add Playwright tests for signup, OTP, purchase, course access, lesson
      completion, and refunds.
- [ ] Add error monitoring and source maps.
- [ ] Add structured logs with request and user correlation IDs.
- [ ] Add uptime, API latency, email failure, and webhook failure alerts.
- [ ] Add `/api/health` checks for application and database readiness.
- [ ] Create separate development, staging, and production environments.

## Phase 4: Business Essentials

- [x] Add coupons and limited-time promotions.
- [x] Add invoices, receipts, tax details, and business identity settings.
- [x] Add customer management and manual course-access controls.
- [x] Add revenue, conversion, refund, and course-completion analytics.
- [x] Add CSV exports for sales and customers.
- [x] Add transactional email templates and delivery tracking.
- [x] Add terms, privacy, refund, and cookie policies.
- [x] Add account deletion and user data export.

## Phase 5: Learning Product Growth

- [x] Add lesson quizzes with draft/published states, passing scores, answer
      explanations, learner attempts, scoring, and retakes.
- [x] Add quiz lesson types with attempt windows, time limits, and maximum
      attempt controls.
- [x] Add text lessons alongside video and quiz lessons.
- [ ] Add completion certificates with public verification URLs.
- [x] Save video playback position and resume lessons.
- [x] Remember the most recently studied lesson for every enrolled course.
- [x] Add private lesson notes and bookmarks.
- [x] Add learner-friendly view, edit, and remove states for saved notes.
- [ ] Add a dedicated Continue Learning dashboard.
- [ ] Add lesson resources and transcript search.
- [x] Add course reviews and ratings.
- [x] Let learners update and submit a course review again.
- [ ] Add announcements and drip-released curriculum.
- [ ] Add accessible captions and a full keyboard/screen-reader review.

## Later Expansion

These features should wait until the core business is stable:

- Subscription memberships
- Affiliate and referral programs
- Multiple instructors and revenue sharing
- Multi-currency and localized storefronts
- Team or organization purchases
