# Stripe Setup Guide for OwlRSVP

This guide will walk you through setting up Stripe payments for your OwlRSVP application, including connecting your bank account to receive payouts.

## Step 1: Create Your Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Sign up"** in the top right corner
3. Enter your email address and create a password
4. Complete the account creation process

## Step 2: Complete Business Verification

1. After signing up, Stripe will prompt you to complete your business information
2. Fill in:
   - **Business type** (Individual, Company, etc.)
   - **Business name**
   - **Business address**
   - **Tax ID** (if applicable)
   - **Phone number**
3. You may need to provide additional documentation depending on your location
4. This process typically takes a few minutes to a few hours

## Step 3: Add Your Bank Account

This is how you'll receive payments from Stripe.

1. Log into your Stripe Dashboard
2. Click **"Settings"** in the left sidebar
3. Click **"Bank accounts and scheduling"** under the "Payments" section
4. Click **"+ Add bank account"** button
5. Enter your bank account details:
   - **Account holder name** (must match your business name)
   - **Account number**
   - **Routing number** (9 digits for US banks)
6. Click **"Add Bank Account"**

### Verify Your Bank Account

1. Stripe will deposit **2 small amounts** (usually less than $1 each) into your bank account
2. This typically takes **1-2 business days**
3. Once you see the deposits:
   - Go back to Stripe Dashboard → Settings → Bank accounts and scheduling
   - Click **"Verify amounts"** next to your bank account
   - Enter the two deposit amounts (in cents, e.g., if Stripe deposited $0.32, enter "32")
4. Once verified, your bank account is connected and ready to receive payouts

## Step 4: Create Products in Stripe

You need to create subscription products for each tier (Basic, Pro, Enterprise).

### Create Basic Plan

1. In Stripe Dashboard, click **"Products"** in the left sidebar
2. Click **"+ Add product"** button
3. Fill in:
   - **Name**: "Basic Plan"
   - **Description**: "5 events, 200 guests per event, custom branding"
4. Under **"Pricing"**:
   - Select **"Recurring"**
   - **Price**: `9.00`
   - **Currency**: USD (or your preferred currency)
   - **Billing period**: Monthly
5. Click **"Save product"**
6. **IMPORTANT**: Copy the **Price ID** (starts with `price_...`) - you'll need this later

### Create Pro Plan

1. Click **"+ Add product"** again
2. Fill in:
   - **Name**: "Pro Plan"
   - **Description**: "25 events, 1,000 guests per event, advanced analytics"
3. Under **"Pricing"**:
   - Select **"Recurring"**
   - **Price**: `29.00`
   - **Currency**: USD
   - **Billing period**: Monthly
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_...`)

### Basic Price ID - price_1SSRI2Bw9m7IQubA6tAJWcq4
### Pro Price ID - price_1SSRKABw9m7IQubAdsfUBPRT
### Enterprise Price ID - price_1SSRKqBw9m7IQubAK6MFOF1T

### Create Enterprise Plan

1. Click **"+ Add product"** again
2. Fill in:
   - **Name**: "Enterprise Plan"
   - **Description**: "Unlimited events, 5,000 guests per event, white-label"
3. Under **"Pricing"**:
   - Select **"Recurring"**
   - **Price**: `99.00`
   - **Currency**: USD
   - **Billing period**: Monthly
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_...`)

## Step 5: Set Up Webhook

Webhooks allow Stripe to notify your app when subscription events happen (payment succeeded, subscription updated, etc.).

1. In Stripe Dashboard, click **"Developers"** in the left sidebar
2. Click **"Webhooks"** in the submenu
3. Click **"+ Add endpoint"** button
4. Fill in:
   - **Endpoint URL**: `https://owlrsvp.com/api/webhooks/stripe`
     - Replace `owlrsvp.com` with your actual domain
   - **Description**: "OwlRSVP subscription webhooks"
5. Under **"Events to send"**, select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Click **"Add endpoint"**
7. **IMPORTANT**: Copy the **"Signing secret"** (starts with `whsec_...`) - you'll need this for your environment variables

### Testing Webhooks Locally (Optional)

If you want to test webhooks locally during development:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. This will give you a webhook signing secret for local testing

## Step 6: Get Your API Keys

1. In Stripe Dashboard, click **"Developers"** → **"API keys"**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_...`) - safe to use in frontend code
   - **Secret key** (starts with `sk_...`) - **NEVER** expose this publicly
3. Click **"Reveal"** next to the Secret key to see it
4. Copy both keys - you'll need them for your environment variables

## Step 7: Add Environment Variables

Add these to your Vercel project (or your hosting platform):

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add the following variables:

```
STRIPE_SECRET_KEY=sk_live_... (your secret key from Step 6)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (your publishable key from Step 6)
STRIPE_WEBHOOK_SECRET=whsec_... (your webhook signing secret from Step 5)
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_... (Basic plan price ID from Step 4)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_... (Pro plan price ID from Step 4)
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_... (Enterprise plan price ID from Step 4)
```

### Important Notes:

- Use **test keys** (start with `sk_test_` and `pk_test_`) for development
- Use **live keys** (start with `sk_live_` and `pk_live_`) for production
- Make sure to set these for the correct environment (Production, Preview, Development)
- After adding variables, **redeploy your application** for changes to take effect

## Step 8: Test Your Integration

### Test Mode

1. In Stripe Dashboard, make sure you're in **"Test mode"** (toggle in top right)
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date, any 3-digit CVC, any ZIP code
3. Go to your app and try subscribing to a plan
4. Check Stripe Dashboard → **"Payments"** to see the test payment

### Go Live

1. Once testing is complete, toggle to **"Live mode"** in Stripe Dashboard
2. Update your environment variables to use live keys (see Step 7)
3. Redeploy your application
4. You're now accepting real payments!

## Step 9: Set Up Payout Schedule

1. Go to Stripe Dashboard → **"Settings"** → **"Bank accounts and scheduling"**
2. Under **"Payout schedule"**, choose:
   - **Daily** (recommended for faster access to funds)
   - **Weekly** (every Monday, Wednesday, or Friday)
   - **Monthly** (on a specific day)
3. Payouts typically take **2-7 business days** to reach your bank account after the payout is initiated

## Troubleshooting

### Webhook Not Working

- Check that the webhook URL is correct and publicly accessible
- Verify the webhook signing secret matches in your environment variables
- Check Stripe Dashboard → Developers → Webhooks → [Your endpoint] → "Recent events" for errors
- Make sure your server is running and can receive POST requests

### Payments Not Processing

- Verify you're using the correct API keys (test vs. live)
- Check that price IDs match the products you created
- Review Stripe Dashboard → Payments for error messages
- Check your server logs for errors

### Bank Account Verification Issues

- Make sure the account holder name matches your business name exactly
- Double-check the routing and account numbers
- Contact Stripe support if deposits don't appear after 3 business days

## Security Best Practices

1. **Never commit API keys to Git** - always use environment variables
2. **Use different keys for test and production** - never mix them
3. **Rotate keys periodically** - especially if you suspect a security issue
4. **Enable 2FA** on your Stripe account
5. **Review webhook events regularly** - check for suspicious activity

## Support

- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Stripe Status: [https://status.stripe.com](https://status.stripe.com)

## Quick Reference Checklist

- [ ] Created Stripe account
- [ ] Completed business verification
- [ ] Added and verified bank account
- [ ] Created Basic Plan product (copied Price ID)
- [ ] Created Pro Plan product (copied Price ID)
- [ ] Created Enterprise Plan product (copied Price ID)
- [ ] Set up webhook endpoint (copied Signing secret)
- [ ] Copied Publishable key
- [ ] Copied Secret key
- [ ] Added all environment variables to Vercel
- [ ] Tested in test mode
- [ ] Switched to live mode
- [ ] Set up payout schedule

---

**Congratulations!** Your Stripe integration is now complete. You can start accepting subscription payments and receiving payouts to your bank account.

