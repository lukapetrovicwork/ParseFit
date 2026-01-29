# ATS Resume Scanner

A production-ready SaaS application that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS).

## Features

- **Resume Parsing**: Supports PDF and DOCX file formats
- **ATS Scoring**: Comprehensive 0-100 score based on keyword matching, formatting, and content
- **Keyword Analysis**: Identifies missing skills and keywords from job descriptions
- **Section Detection**: Analyzes resume structure (Summary, Experience, Education, Skills, etc.)
- **Bullet Point Analysis**: Evaluates and suggests improvements for resume bullets
- **Formatting Checks**: Detects ATS-unfriendly elements (images, tables, columns)
- **AI-Style Suggestions**: Rule-based NLP recommendations for improvement
- **User Authentication**: Secure sign-up/login via Clerk
- **Subscription Management**: Free tier (3 scans/month) and Pro tier (unlimited)
- **Stripe Integration**: Secure payment processing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma
- **Authentication**: Clerk
- **Payments**: Stripe
- **NLP**: Custom keyword extraction, cosine similarity, section detection

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account (for authentication)
- Stripe account (for payments)

### 1. Clone and Install Dependencies

```bash
cd ATSScanner
npm install
```

### 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ats_scanner?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_PRICE_ID=price_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your API keys to `.env`
3. Configure redirect URLs in Clerk dashboard

### 4. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Copy your API keys to `.env`
3. Create a subscription product and price in Stripe Dashboard
4. Copy the Price ID to `STRIPE_PRICE_ID`
5. Set up a webhook endpoint pointing to `/api/webhooks/stripe`
6. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Set Up Database

```bash
# Push the Prisma schema to your database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Import your repository on [Vercel](https://vercel.com)
2. Add all environment variables
3. Deploy

### 3. Configure Production Webhooks

1. Update Stripe webhook URL to your production domain
2. Update Clerk redirect URLs

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   └── *.tsx              # Feature components
│   ├── lib/
│   │   ├── parser/            # PDF/DOCX parsing
│   │   ├── nlp/               # NLP utilities
│   │   ├── scoring/           # ATS scoring engine
│   │   ├── prisma.ts          # Database client
│   │   ├── stripe.ts          # Stripe utilities
│   │   └── utils.ts           # Shared utilities
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Auth middleware
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/scan` | POST | Create new resume scan |
| `/api/scans` | GET | List user's scans |
| `/api/scans/[id]` | GET | Get scan details |
| `/api/scans/[id]` | DELETE | Delete a scan |
| `/api/subscription` | GET | Get subscription status |
| `/api/subscription` | POST | Manage subscription |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

## License

MIT
