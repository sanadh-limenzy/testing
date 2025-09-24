# TheAugustaRule

Professional document management and PDF generation web application.

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Database**: Supabase with Drizzle ORM
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Primary Color**: #649cf5

## Setup Instructions

1. **Environment Configuration**
   Create `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_connection_string
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```
   
   Note: Environment variables are validated using T3 Env with Zod schemas for type safety.

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── auth/           # Authentication components
└── lib/                # Utility libraries
    ├── db/             # Database schema and connection
    └── supabase/       # Supabase client configuration
```

## Features

- **Multi-step Registration Flow**:
  - Google reCAPTCHA verification
  - Account creation with email/password
  - Personal address collection with Google Maps verification
  - Multiple rental/business address support
  - Business information collection
- **User Authentication**: Supabase-powered sign up/sign in
- **Address Verification**: Google Maps SDK integration
- **Document Management**: Full CRUD operations
- **PDF Generation**: A4 format, unsigned documents
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript support with T3 Env

## Manual Fallbacks

If automated setup fails:
- Create `.env.local` manually with Supabase credentials
- Run `npm install` to install dependencies
- Configure Supabase project with authentication enabled