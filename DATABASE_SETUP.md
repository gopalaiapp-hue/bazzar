# Database Setup Guide - BazaarBudget

## Option 1: Neon (Recommended - Serverless PostgreSQL)

### Step 1: Create Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub or email
3. Neon offers a free tier with:
   - 0.5 GB storage
   - Unlimited compute hours
   - Perfect for development

### Step 2: Create a New Project
1. Click "Create Project" in the Neon dashboard
2. Project name: `BazaarBudget`
3. Region: Choose closest to you (e.g., `AWS us-east-1`)
4. PostgreSQL version: `16` (latest)
5. Click "Create Project"

### Step 3: Get Connection String
1. After project creation, you'll see the connection details
2. Copy the **Connection String** (it looks like this):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. Keep this safe - you'll need it in the next step

### Step 4: Set Environment Variable
Create a `.env` file in the project root:

```bash
# In e:\bazzar\BazaarBudget\BazaarBudget\.env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Important**: Replace the URL with your actual connection string from Neon.

### Step 5: Update .gitignore
Make sure `.env` is in `.gitignore` to avoid committing secrets:

```bash
# Add to .gitignore if not already there
.env
.env.local
```

### Step 6: Run Database Migration
```bash
npm run db:push
```

This will create all the tables defined in `shared/schema.ts`.

---

## Option 2: Local PostgreSQL (Alternative)

If you prefer running PostgreSQL locally:

### Windows (Using PostgreSQL Installer)
1. Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Install PostgreSQL 16
3. During installation, set a password for the `postgres` user
4. Default port: `5432`

### Create Database
```sql
-- Connect to PostgreSQL using pgAdmin or psql
CREATE DATABASE bazaarbudget;
```

### Set Environment Variable
```bash
# In .env file
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bazaarbudget"
```

---

## Verification Steps

After setting up the database:

1. **Test Connection**
   ```bash
   npm run db:push
   ```
   
   Expected output:
   ```
   ✓ Tables created successfully
   ```

2. **Verify Tables**
   - Log into Neon dashboard (or pgAdmin for local)
   - Check that these tables exist:
     - `users`
     - `otps`
     - `accounts`
     - `pockets`
     - `transactions`
     - `lena_dena`
     - `budgets`
     - `family_members`
     - `goals`
     - `tax_data`

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The server should start without database errors.

---

## Troubleshooting

### Error: "DATABASE_URL must be set"
- Make sure `.env` file exists in the project root
- Check that the variable name is exactly `DATABASE_URL`
- Restart your terminal/IDE after creating `.env`

### Error: "Connection refused"
- **Neon**: Check if your connection string is correct
- **Local**: Ensure PostgreSQL service is running

### Error: "SSL required"
- Neon requires SSL. Make sure your connection string includes `?sslmode=require`

### Error: "Schema push failed"
- Check if you have write permissions to the database
- Verify the database exists
- Check for syntax errors in `shared/schema.ts`

---

## Next Steps After Setup

1. **Seed Sample Data** (Optional)
   ```bash
   # After completing onboarding, get your userId from localStorage
   # Then run:
   curl -X POST http://localhost:5000/api/seed/YOUR_USER_ID
   ```

2. **Test the Application**
   - Complete onboarding flow
   - Navigate to Tax page (should show default tax data)
   - Navigate to Home page (should show pockets)
   - Navigate to Goals page (should show goals)

3. **Continue Development**
   - Implement transaction saving to database
   - Add pocket management UI
   - Build goal creation/editing features
