
# EchoSphere Production Setup Guide

You are almost there! The code is written. You just need to configure your backend.

## Step 1: Database Setup (Required)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project.
3. Open the **SQL Editor** (icon on the left).
4. Open the file `supabase_schema.sql` in this project.
5. Copy all the text.
6. Paste it into the SQL Editor on Supabase and click **Run**.
7. Go to **Project Settings -> API**.
8. Copy the **URL** and **anon public key**.
9. In the app, paste these keys when the "Connect to Cloud" screen appears.

## Step 2: Authentication
1. In Supabase Dashboard, go to **Authentication** > **Providers**.
2. Enable **Email/Password**.
3. (Optional) Disable "Confirm Email" if you want users to log in immediately without checking their inbox.

## Step 3: Edge Functions (Advanced - Optional for Demo)
*Note: The app will work without this, but Emails and Payments won't actually send.*

If you want real emails and payments:
1. Install Supabase CLI on your computer.
2. Run `supabase login`.
3. Run `supabase functions deploy send-email`.
4. Run `supabase functions deploy create-checkout-session`.
5. Add your API Keys (Resend & Stripe) to Supabase Secrets.
