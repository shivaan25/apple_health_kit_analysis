# FitLife Analytics - Health Data SaaS

A comprehensive health analytics platform that processes Apple Health export data to provide AI-driven insights for fat loss and muscle growth.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript
- **Database & Auth**: Supabase
- **AI**: OpenAI GPT-4
- **Parsing**: Stream-based XML parsing for large datasets

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Supabase Project
- OpenAI API Key

### 2. Environment Variables

**Server (`server/.env`)**:
```
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

**Client (`client/.env.local`)**:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 3. Database Setup
Run the SQL commands in `server/supabase_schema.sql` in your Supabase SQL Editor to set up the tables and security policies.

### 4. Installation
```bash
npm run install:all
```

### 5. Running the App
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Features
- **Smart Parsing**: Extracts only relevant health metrics from the last 7, 30, or 90 days.
- **AI Insights**: Generates personalized advice based on your specific data trends.
- **Progress Tracking**: Saves snapshots of your health data to track progress over time.
- **Secure**: Data is processed in memory and aggregated results are stored securely in Supabase.
