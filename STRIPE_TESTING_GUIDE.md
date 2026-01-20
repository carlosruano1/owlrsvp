# Stripe Subscription Testing Guide

This guide will help you test the complete Stripe subscription flow end-to-end, including payments and cancellations, without using real credit cards.

## Prerequisites

1. **Stripe Test Mode**: Make sure you're using Stripe test mode keys
   - Test keys start with `sk_test_` and `pk_test_`
   - Toggle "Test mode" in Stripe Dashboard (top right corner)

### Finding Your Stripe Test Keys

1. **Go to Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Make sure you're in Test mode**: Toggle in the top right (should say "Test mode")
3. **Get your API keys**:
   - Click **"Developers"** in the left sidebar
   - Click **"API keys"**
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`) - This is your `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it. This is your `STRIPE_SECRET_KEY`
4. **Get your Price IDs** (if you haven't created test products yet):
   - Click **"Products"** in the left sidebar
   - Click on each plan (Basic, Pro, Enterprise)
   - Copy the **Price ID** (starts with `price_...`) for each plan
   - These go in: `NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`

### Adding Keys to Environment Variables

#### For Local Development (.env.local)

1. **Create or edit `.env.local` file** in your project root (same folder as `package.json`)
   - If the file doesn't exist, create it
   - If it exists, open it

2. **Add your Stripe keys** (use the format from `env.example`):
   ```env
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_...your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret_here
   
   # Stripe Price IDs
   NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...your_basic_price_id
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...your_pro_price_id
   NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_...your_enterprise_price_id
   ```

3. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

#### For Production/Staging (Vercel)

1. **Go to Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add each variable**:
   - Click "Add New"
   - Enter the variable name (e.g., `STRIPE_SECRET_KEY`)
   - Enter the value (your test key)
   - Select environments (Production, Preview, Development)
   - Click "Save"
5. **Redeploy** your application for changes to take effect

**Note**: For testing, you can use test keys in all environments. For production, you'll need to switch to live keys (`sk_live_...` and `pk_live_...`) later.

2. **Webhook Testing Setup**: You need to test webhooks locally or use Stripe CLI

3. **Verify Billing Portal Settings** (Optional but recommended):
   - Go to Stripe Dashboard → Settings → Billing → Customer portal
   - Under "Cancellation" section, verify:
     - ✅ "Allow cancellations" is enabled (default: ON)
     - Choose cancellation timing: "At period end" or "Immediately"
     - Cancellation reasons can be enabled/disabled as needed

## Step 1: Set Up Local Webhook Testing

### Option A: Stripe CLI (Recommended for Local Testing)

1. **Install Stripe CLI**: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
   This will output a webhook signing secret like `whsec_...`. **Copy this!**

4. **Update your `.env.local`**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_... (the secret from step 3)
   ```

5. **Keep the CLI running** while testing - it forwards webhook events to your local server

### Option B: Use Stripe Dashboard Webhooks (For Production/Staging Testing)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to your environment variables

## Step 2: Test Subscription Creation

### Test Card Numbers (Stripe Test Mode)

Use these test card numbers - they work in test mode only:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

Use any:
- **Expiry**: Future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Testing Flow

1. **Start your local server**:
   ```bash
   npm run dev
   ```

2. **Start Stripe CLI** (if using local webhooks):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Create a test account** in your app (or use existing)

4. **Navigate to upgrade/subscribe page** (usually `/admin/settings`)

5. **Select a plan** (Basic, Pro, or Enterprise)

6. **Complete checkout** with test card `4242 4242 4242 4242`

7. **Verify in Stripe Dashboard**:
   - Go to Stripe Dashboard → Customers
   - Find your test customer
   - Check that subscription is created
   - Status should be `active`

8. **Verify in your database**:
   ```sql
   SELECT id, email, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id
   FROM admin_users
   WHERE email = 'your-test-email@example.com';
   ```
   
   Should show:
   - `subscription_tier`: `basic`, `pro`, or `enterprise`
   - `subscription_status`: `active`
   - `stripe_customer_id`: `cus_...`
   - `stripe_subscription_id`: `sub_...`

9. **Check webhook logs**:
   - If using Stripe CLI, you'll see events in the terminal
   - In Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Recent events
   - Look for `checkout.session.completed` event

## Step 3: Test Subscription Cancellation

### Scenario A: Cancel at Period End (Default Behavior)

When users cancel through the billing portal, Stripe keeps them active until the period ends, then stops charging.

1. **Open Billing Portal**:
   - Go to `/admin/settings`
   - Click "Open Billing Portal"
   - This redirects to Stripe's hosted billing portal

2. **Cancel Subscription**:
   - In the billing portal, click "Cancel subscription"
   - Choose "Cancel at period end" (default option)
   - Confirm cancellation

3. **Verify in Stripe Dashboard**:
   - Go to Stripe Dashboard → Customers → [Your customer] → Subscriptions
   - Subscription status should still be `active`
   - But you'll see "Cancels on [date]" or `cancel_at_period_end: true`

4. **Verify webhook fired**:
   - Check Stripe CLI or Dashboard → Webhooks → Recent events
   - Look for `customer.subscription.updated` event
   - The event data should have `cancel_at_period_end: true`

5. **Verify in your database**:
   ```sql
   SELECT subscription_tier, subscription_status, subscription_period_end
   FROM admin_users
   WHERE email = 'your-test-email@example.com';
   ```
   
   Should show:
   - `subscription_tier`: Still `basic`, `pro`, or `enterprise` (not downgraded yet)
   - `subscription_status`: `active`
   - `subscription_period_end`: Future date when subscription will end

6. **Simulate period end** (to test the final cancellation):
   - In Stripe Dashboard → Customers → [Your customer] → Subscriptions
   - Click on the subscription
   - Click "..." menu → "Cancel subscription immediately" (this simulates period end)
   - OR use Stripe CLI to trigger the event:
     ```bash
     stripe trigger customer.subscription.deleted
     ```

7. **Verify downgrade happened**:
   ```sql
   SELECT subscription_tier, subscription_status, stripe_subscription_id
   FROM admin_users
   WHERE email = 'your-test-email@example.com';
   ```
   
   Should show:
   - `subscription_tier`: `free`
   - `subscription_status`: `canceled`
   - `stripe_subscription_id`: `null`

### Scenario B: Immediate Cancellation

To test immediate cancellation (when status becomes `canceled` right away):

1. **Cancel subscription immediately**:
   - In Stripe Dashboard → Customers → [Your customer] → Subscriptions
   - Click "..." menu → "Cancel subscription immediately"
   - OR use Stripe CLI:
     ```bash
     stripe subscriptions cancel sub_... --immediate
     ```

2. **Verify webhook fired**:
   - Look for `customer.subscription.updated` event
   - Event data should have `status: "canceled"`

3. **Verify immediate downgrade**:
   ```sql
   SELECT subscription_tier, subscription_status
   FROM admin_users
   WHERE email = 'your-test-email@example.com';
   ```
   
   Should show:
   - `subscription_tier`: `free`
   - `subscription_status`: `canceled`

## Step 4: Verify Stripe Stops Charging

### Check Subscription Status

1. **In Stripe Dashboard**:
   - Go to Customers → [Your customer] → Subscriptions
   - Check subscription status:
     - `active` = Still charging (until period end if canceled)
     - `canceled` = No longer charging
     - `past_due` = Payment failed, will retry
     - `unpaid` = Payment failed, won't retry

2. **Check Upcoming Invoices**:
   - Go to Stripe Dashboard → Customers → [Your customer] → Invoices
   - If subscription is canceled, there should be NO upcoming invoices
   - If `cancel_at_period_end: true`, the last invoice will be at period end, then no more

3. **Verify No Future Charges**:
   - Go to Stripe Dashboard → Customers → [Your customer] → Subscriptions
   - Click on the subscription
   - Scroll to "Upcoming invoice" section
   - If canceled, it should say "No upcoming invoice" or show the cancellation date

## Step 5: Test Recurring Payments

To verify monthly billing works:

1. **Create a subscription** (as in Step 2)

2. **Simulate next billing cycle**:
   ```bash
   # Using Stripe CLI
   stripe invoices create --customer cus_... --subscription sub_...
   ```
   
   OR manually in Stripe Dashboard:
   - Go to Customers → [Your customer] → Invoices
   - Click "Create invoice"
   - Select the subscription
   - Mark as paid

3. **Trigger payment succeeded webhook**:
   ```bash
   stripe trigger invoice.payment_succeeded
   ```

4. **Verify period updated**:
   ```sql
   SELECT subscription_period_start, subscription_period_end
   FROM admin_users
   WHERE email = 'your-test-email@example.com';
   ```
   
   Dates should be updated to reflect the new billing period

## Step 6: Test Edge Cases

### Test Payment Failure

1. **Use a card that will decline**:
   - Card: `4000 0000 0000 0002`
   - Complete checkout (it will fail)

2. **Or simulate payment failure**:
   ```bash
   # In Stripe Dashboard, go to the subscription
   # Click "..." → "Simulate payment failure"
   ```

3. **Verify handling**:
   - Check webhook events for `invoice.payment_failed`
   - Subscription status may change to `past_due`

### Test Plan Upgrade/Downgrade

1. **Upgrade plan**:
   - Go to billing portal
   - Change from Basic → Pro
   - Verify webhook `customer.subscription.updated` fires
   - Verify database shows new tier

2. **Downgrade plan**:
   - Change from Pro → Basic
   - Verify webhook fires
   - Verify database shows new tier

## Step 7: Monitor Webhook Events

### Using Stripe CLI

The CLI shows all events in real-time:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You'll see output like:
```
2024-01-15 10:30:45   --> checkout.session.completed [evt_...]
2024-01-15 10:30:46   --> customer.subscription.created [evt_...]
2024-01-15 10:30:47   --> invoice.payment_succeeded [evt_...]
```

### Using Stripe Dashboard

1. Go to Developers → Webhooks → [Your endpoint]
2. Click "Recent events"
3. Check for:
   - ✅ Green checkmark = Webhook delivered successfully
   - ❌ Red X = Webhook failed (check response)

### Check Your Server Logs

Your webhook handler logs events. Check your server console for:
- `Subscription canceled - downgraded user to free tier: [user_id]`
- `Subscription scheduled to cancel at period end: [user_id]`
- Any error messages

## Step 8: Production Testing Checklist

Before going live, test in production with a real card (you can refund yourself):

- [ ] Test subscription creation with real card
- [ ] Verify webhook receives `checkout.session.completed`
- [ ] Verify database updated correctly
- [ ] Test cancellation through billing portal
- [ ] Verify webhook receives `customer.subscription.updated` with `cancel_at_period_end: true`
- [ ] Wait for period end OR manually trigger `customer.subscription.deleted`
- [ ] Verify downgrade to free tier
- [ ] Verify no future invoices in Stripe
- [ ] Test payment failure handling
- [ ] Test plan upgrade/downgrade

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is accessible**:
   ```bash
   curl https://your-domain.com/api/webhooks/stripe
   ```
   Should return 405 (Method Not Allowed) or similar, not 404

2. **Verify webhook secret matches**:
   - Check environment variable `STRIPE_WEBHOOK_SECRET`
   - Compare with Stripe Dashboard → Webhooks → [Endpoint] → Signing secret

3. **Check server logs** for webhook signature verification errors

### Subscription Not Updating in Database

1. **Check webhook is firing**: Look in Stripe Dashboard → Webhooks → Recent events
2. **Check webhook response**: Click on event → Response tab
3. **Check server logs** for errors in webhook handler
4. **Verify user lookup**: Make sure `stripe_customer_id` matches in database

### Cancellation Not Working

1. **Verify webhook handles `customer.subscription.updated`** with `cancel_at_period_end: true`
2. **Verify webhook handles `customer.subscription.updated`** with `status: "canceled"`
3. **Check database** - subscription should downgrade when status is `canceled`
4. **Verify Stripe subscription is actually canceled** in Stripe Dashboard

### Still Being Charged After Cancellation

1. **Check subscription status in Stripe Dashboard**:
   - If `active` with `cancel_at_period_end: true`, you'll be charged until period end (this is correct)
   - If `canceled`, you should NOT be charged

2. **Check upcoming invoices** in Stripe Dashboard - should be none if canceled

3. **Verify webhook fired** - check for `customer.subscription.deleted` or `customer.subscription.updated` with `status: "canceled"`

## Quick Test Script

Here's a quick manual test you can run:

```bash
# 1. Create a test subscription
# (Do this through your app UI with test card 4242 4242 4242 4242)

# 2. Check database
# SELECT subscription_tier, subscription_status FROM admin_users WHERE email = 'test@example.com';

# 3. Cancel in Stripe Dashboard or through billing portal

# 4. Trigger webhook manually (if needed)
stripe trigger customer.subscription.deleted

# 5. Verify downgrade
# SELECT subscription_tier, subscription_status FROM admin_users WHERE email = 'test@example.com';
# Should show: subscription_tier = 'free', subscription_status = 'canceled'
```

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
