# Warehouse Inventory Management PWA - Implementation Plan

## Overview

Build a warehouse inventory management system with two Progressive Web Applications (PWAs) backed by Supabase:
1. **Shop PWA** - For store managers to browse catalog and request products
2. **Warehouse PWA** - For warehouse workers to manage inventory, photos, and quantities

The system features role-based authentication (email for managers, PIN for workers), offline support, inventory change tracking (audit trail), and XLSX import/export for data migration.

## Current State Analysis

- **Project**: Greenfield - empty repository with no application code
- **Existing Assets**: XLSX inventory file (`Warehouse Stock Stick.xlsx`) with ~580 products
- **Directory**: Contains only `.claude/` configuration, `.gitignore`, and `thoughts/`

## Desired End State

A fully functional inventory management system where:
1. **Warehouse workers** can add/edit products, upload photos, adjust quantities with automatic audit trail
2. **Shop managers** can browse the catalog, search products, and create requests for items needed in store
3. **Both apps** work offline and sync when connected
4. **Data** can be imported from existing Excel files and exported for backup
5. **Notifications** alert relevant users of new requests and status changes

### Verification:
- Both PWAs installable on tablets via "Add to Home Screen"
- Warehouse worker can log in with PIN, add product with photo, adjust quantity
- Shop manager can log in with email, browse catalog, create request
- Request status flows: pending → ready → delivered
- Inventory changes tracked in history table
- XLSX import populates database from Excel file
- XLSX export downloads complete inventory
- Apps function offline, sync when reconnected

## What We're NOT Doing

- Native mobile apps (APK/iOS) - PWA only
- Multi-warehouse support - single warehouse location
- Automatic low-stock alerts - manual highlighting only
- Complex reporting/analytics - basic data views only
- Multi-language UI - English only
- Real-time collaborative editing - single user per record

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 18 + Vite | Fast PWA development |
| Styling | Tailwind CSS | Utility-first styling |
| Backend | Supabase | Database, Auth, Storage, Realtime |
| Database | PostgreSQL (via Supabase) | Relational data storage |
| Auth | Supabase Auth | Email + custom PIN authentication |
| Storage | Supabase Storage | Product photos |
| XLSX | ExcelJS | Import/export Excel files |
| Barcode | QuaggaJS or html5-qrcode | Camera barcode scanning |
| Hosting | Vercel | Frontend deployment |

## Data Model

### products
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sku | text | Unique product code (e.g., "AGA003") |
| barcode | text | Optional barcode number |
| name | text | Product name |
| brand | text | Brand name |
| supplier | text | Supplier code |
| photo_url | text | URL to product image in storage |
| quantity | integer | Current stock level |
| qty_per_package | integer | Units per package |
| location | text | Cabinet/shelf location |
| is_low_stock | boolean | Manual low-stock flag |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last modification |

### inventory_history (audit trail)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | uuid | Foreign key to products |
| user_id | uuid | Who made the change |
| old_quantity | integer | Previous quantity |
| new_quantity | integer | New quantity |
| change_amount | integer | Delta (+/-) |
| note | text | Optional note |
| created_at | timestamptz | When change occurred |

### requests
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | uuid | Foreign key to products |
| quantity_requested | integer | How many needed |
| status | text | pending / ready / delivered |
| requested_by | uuid | Manager who requested |
| handled_by | uuid | Worker who fulfilled |
| created_at | timestamptz | Request date |
| updated_at | timestamptz | Status change date |

### users
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (from Supabase Auth) |
| email | text | Login identifier (managers) |
| pin_hash | text | Hashed PIN (workers) |
| role | text | manager / warehouse_worker |
| name | text | Display name |
| created_at | timestamptz | Account creation |

---

## Phase 1: Project Foundation

### Overview
Initialize React project with Vite, configure PWA support, set up project structure and development tooling.

### Changes Required:

#### 1. Initialize Vite React Project
```bash
npm create vite@latest warehouse-pwa -- --template react-ts
cd warehouse-pwa
npm install
```

#### 2. Install Core Dependencies
```bash
npm install @supabase/supabase-js react-router-dom tailwindcss postcss autoprefixer
npm install -D vite-plugin-pwa workbox-window
```

#### 3. Project Structure
```
warehouse-pwa/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   │   ├── common/          # Shared components
│   │   ├── shop/            # Shop-specific components
│   │   └── warehouse/       # Warehouse-specific components
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── xlsx.ts          # XLSX utilities
│   ├── pages/
│   │   ├── shop/            # Shop PWA pages
│   │   └── warehouse/       # Warehouse PWA pages
│   ├── types/               # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

#### 4. Configure Vite for PWA
**File**: `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Warehouse Inventory',
        short_name: 'Warehouse',
        description: 'Warehouse inventory management system',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase\.co\/storage/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ]
})
```

#### 5. Configure Tailwind
```bash
npx tailwindcss init -p
```

**File**: `tailwind.config.js`
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File**: `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Success Criteria:

#### Automated Verification:
- [x] `npm run dev` starts development server without errors
- [x] `npm run build` completes successfully
- [x] TypeScript compiles without errors: `npm run typecheck`
- [ ] Lighthouse PWA audit passes basic checks

#### Manual Verification:
- [x] App loads in browser at localhost:5173
- [x] Tailwind styles apply correctly
- [x] PWA manifest detected in browser DevTools > Application
- [x] No console errors on page load

**Implementation Note**: After completing this phase, verify the development server runs and basic React app displays before proceeding.

---

## Phase 2: Supabase Setup

### Overview
Create Supabase project, configure database schema, set up authentication, and create storage bucket for photos.

### Changes Required:

#### 1. Create Supabase Project
- Go to https://supabase.com
- Create new project (free tier)
- Note the project URL and anon key

#### 2. Database Schema (SQL)
Run in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    pin_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'warehouse_worker')),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    supplier TEXT,
    photo_url TEXT,
    quantity INTEGER DEFAULT 0,
    qty_per_package INTEGER DEFAULT 1,
    location TEXT,
    is_low_stock BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory history (audit trail)
CREATE TABLE public.inventory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    old_quantity INTEGER,
    new_quantity INTEGER,
    change_amount INTEGER,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requests table
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_requested INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'delivered')),
    requested_by UUID REFERENCES public.users(id),
    handled_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_inventory_history_product ON public.inventory_history(product_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_product ON public.requests(product_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to products and requests
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 3. Row Level Security (RLS) Policies
```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Products: all authenticated users can read
CREATE POLICY "Authenticated users can read products" ON public.products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Products: warehouse workers can insert/update
CREATE POLICY "Warehouse workers can insert products" ON public.products
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'warehouse_worker')
    );

CREATE POLICY "Warehouse workers can update products" ON public.products
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'warehouse_worker')
    );

-- Inventory history: warehouse workers can insert
CREATE POLICY "Warehouse workers can insert history" ON public.inventory_history
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'warehouse_worker')
    );

-- Inventory history: all authenticated can read
CREATE POLICY "Authenticated users can read history" ON public.inventory_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Requests: managers can create
CREATE POLICY "Managers can create requests" ON public.requests
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    );

-- Requests: all authenticated can read
CREATE POLICY "Authenticated users can read requests" ON public.requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Requests: warehouse workers can update status
CREATE POLICY "Warehouse workers can update requests" ON public.requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'warehouse_worker')
    );
```

#### 4. Storage Bucket for Photos
```sql
-- Create storage bucket (run in SQL or use Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true);

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-photos' AND auth.role() = 'authenticated');

-- Storage policy: public read access
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');
```

#### 5. Supabase Client Configuration
**File**: `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

#### 6. Environment Variables
**File**: `.env.local`
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**File**: `.env.example`
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Success Criteria:

#### Automated Verification:
- [x] Database tables created: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
- [x] RLS enabled on all tables
- [x] Storage bucket exists and is public

#### Manual Verification:
- [x] Supabase Dashboard shows all 4 tables
- [ ] Can insert test row into products table
- [x] Storage bucket visible in Dashboard
- [ ] Can upload test image to bucket

**Implementation Note**: Save the Supabase URL and anon key - they'll be needed for the frontend configuration.

---

## Phase 3: Authentication System

### Overview
Implement dual authentication: email/password for managers, PIN-based for warehouse workers.

### Changes Required:

#### 1. Install Additional Auth Dependencies
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

#### 2. Auth Context
**File**: `src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string | null
  role: 'manager' | 'warehouse_worker'
  name: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithPin: (pin: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    setProfile(data)
    setLoading(false)
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signInWithPin(pin: string) {
    // PIN authentication via Edge Function (see Phase 3.3)
    const { data, error } = await supabase.functions.invoke('pin-auth', {
      body: { pin }
    })

    if (error) throw error

    // Set the session from the response
    if (data.session) {
      await supabase.auth.setSession(data.session)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signInWithEmail,
      signInWithPin,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

#### 3. PIN Authentication Edge Function
Create Supabase Edge Function for PIN-based auth:

**File**: `supabase/functions/pin-auth/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pin } = await req.json()

    if (!pin || pin.length < 4) {
      throw new Error('Invalid PIN')
    }

    // Create admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find user with matching PIN
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'warehouse_worker')

    if (userError) throw userError

    // Check PIN against each worker
    let matchedUser = null
    for (const user of users) {
      if (user.pin_hash && await bcrypt.compare(pin, user.pin_hash)) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) {
      throw new Error('Invalid PIN')
    }

    // Generate session for the user
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: matchedUser.email || `worker-${matchedUser.id}@warehouse.local`,
    })

    if (authError) throw authError

    return new Response(
      JSON.stringify({
        success: true,
        user: matchedUser,
        session: authData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

#### 4. Login Pages
**File**: `src/pages/LoginSelect.tsx`
```typescript
import { Link } from 'react-router-dom'

export function LoginSelect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          Warehouse Inventory
        </h1>

        <div className="space-y-4">
          <Link
            to="/login/manager"
            className="block w-full py-4 px-6 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Manager Login
            <span className="block text-sm opacity-75">Email & Password</span>
          </Link>

          <Link
            to="/login/worker"
            className="block w-full py-4 px-6 text-center bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Warehouse Worker Login
            <span className="block text-sm opacity-75">PIN Code</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**File**: `src/pages/ManagerLogin.tsx`
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ManagerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithEmail } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmail(email, password)
      navigate('/shop')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Manager Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

**File**: `src/pages/WorkerLogin.tsx`
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function WorkerLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithPin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithPin(pin)
      navigate('/warehouse')
    } catch (err) {
      setError('Invalid PIN')
    } finally {
      setLoading(false)
    }
  }

  function handlePinInput(value: string) {
    // Only allow digits, max 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setPin(cleaned)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Worker Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Enter PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => handlePinInput(e.target.value)}
            className="w-full p-4 text-2xl text-center border rounded-lg tracking-widest"
            placeholder="••••••"
            maxLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
```

#### 5. Protected Route Component
**File**: `src/components/common/ProtectedRoute.tsx`
```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('manager' | 'warehouse_worker')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate app based on role
    return <Navigate to={profile.role === 'manager' ? '/shop' : '/warehouse'} replace />
  }

  return <>{children}</>
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Edge function deploys successfully: `supabase functions deploy pin-auth`
- [x] TypeScript compiles without errors
- [x] Auth context provides user state correctly

#### Manual Verification:
- [ ] Manager can log in with email/password
- [ ] Worker can log in with PIN
- [ ] Invalid credentials show error message
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based routing works (manager → shop, worker → warehouse)

**Implementation Note**: Create test users in Supabase Dashboard before testing. For workers, manually set their `pin_hash` using bcrypt.

---

## Phase 4: Warehouse PWA Core

### Overview
Build the warehouse worker interface for managing products: CRUD operations, photo upload, quantity adjustments with audit trail.

### Changes Required:

#### 1. Product Types
**File**: `src/types/product.ts`
```typescript
export interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  brand: string | null
  supplier: string | null
  photo_url: string | null
  quantity: number
  qty_per_package: number
  location: string | null
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  sku: string
  barcode?: string
  name: string
  brand?: string
  supplier?: string
  quantity: number
  qty_per_package: number
  location?: string
}

export interface InventoryChange {
  product_id: string
  old_quantity: number
  new_quantity: number
  change_amount: number
  note?: string
}
```

#### 2. Products Hook
**File**: `src/hooks/useProducts.ts`
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Product, ProductFormData, InventoryChange } from '../types/product'
import { useAuth } from '../contexts/AuthContext'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (error) {
      setError(error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  async function createProduct(formData: ProductFormData, photoFile?: File) {
    let photo_url = null

    // Upload photo if provided
    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(uploadData.path)

      photo_url = publicUrl
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{ ...formData, photo_url }])
      .select()
      .single()

    if (error) throw error

    setProducts([...products, data])
    return data
  }

  async function updateProduct(id: string, formData: Partial<ProductFormData>, photoFile?: File) {
    let photo_url = undefined

    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(uploadData.path)

      photo_url = publicUrl
    }

    const updateData = photo_url ? { ...formData, photo_url } : formData

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    setProducts(products.map(p => p.id === id ? data : p))
    return data
  }

  async function adjustQuantity(productId: string, change: number, note?: string) {
    const product = products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')

    const newQuantity = product.quantity + change

    // Update product quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', productId)

    if (updateError) throw updateError

    // Record in history
    const historyEntry: InventoryChange = {
      product_id: productId,
      old_quantity: product.quantity,
      new_quantity: newQuantity,
      change_amount: change,
      note,
    }

    const { error: historyError } = await supabase
      .from('inventory_history')
      .insert([{ ...historyEntry, user_id: user?.id }])

    if (historyError) throw historyError

    // Update local state
    setProducts(products.map(p =>
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ))
  }

  async function toggleLowStock(productId: string) {
    const product = products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')

    const { error } = await supabase
      .from('products')
      .update({ is_low_stock: !product.is_low_stock })
      .eq('id', productId)

    if (error) throw error

    setProducts(products.map(p =>
      p.id === productId ? { ...p, is_low_stock: !p.is_low_stock } : p
    ))
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    setProducts(products.filter(p => p.id !== id))
  }

  async function searchBySku(sku: string) {
    return products.filter(p =>
      p.sku.toLowerCase().includes(sku.toLowerCase())
    )
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    adjustQuantity,
    toggleLowStock,
    deleteProduct,
    searchBySku,
  }
}
```

#### 3. Warehouse Dashboard
**File**: `src/pages/warehouse/Dashboard.tsx`
```typescript
import { useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { ProductList } from '../../components/warehouse/ProductList'
import { ProductForm } from '../../components/warehouse/ProductForm'
import { SearchBar } from '../../components/common/SearchBar'
import { useAuth } from '../../contexts/AuthContext'

export function WarehouseDashboard() {
  const { products, loading, createProduct, searchBySku } = useProducts()
  const { profile, signOut } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(products)

  async function handleSearch(term: string) {
    setSearchTerm(term)
    if (term) {
      const results = await searchBySku(term)
      setFilteredProducts(results)
    } else {
      setFilteredProducts(products)
    }
  }

  const displayProducts = searchTerm ? filteredProducts : products

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Warehouse</h1>
          <div className="flex items-center gap-4">
            <span>{profile?.name}</span>
            <button onClick={signOut} className="text-sm underline">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by SKU..."
          />
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            + Add Product
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : (
          <ProductList products={displayProducts} />
        )}

        {showForm && (
          <ProductForm
            onSubmit={async (data, photo) => {
              await createProduct(data, photo)
              setShowForm(false)
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </main>
    </div>
  )
}
```

#### 4. Product List Component
**File**: `src/components/warehouse/ProductList.tsx`
```typescript
import { Product } from '../../types/product'
import { ProductCard } from './ProductCard'

interface ProductListProps {
  products: Product[]
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

#### 5. Product Card with Quantity Controls
**File**: `src/components/warehouse/ProductCard.tsx`
```typescript
import { useState } from 'react'
import { Product } from '../../types/product'
import { useProducts } from '../../hooks/useProducts'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { adjustQuantity, toggleLowStock } = useProducts()
  const [adjusting, setAdjusting] = useState(false)

  async function handleAdjust(change: number) {
    setAdjusting(true)
    try {
      await adjustQuantity(product.id, change)
    } catch (err) {
      console.error('Failed to adjust quantity:', err)
    }
    setAdjusting(false)
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${product.is_low_stock ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}>
      <div className="flex gap-4">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-20 h-20 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          {product.location && (
            <p className="text-sm text-gray-500">Location: {product.location}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAdjust(-1)}
            disabled={adjusting || product.quantity <= 0}
            className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold text-xl disabled:opacity-50"
          >
            -
          </button>

          <span className="text-2xl font-bold w-16 text-center">
            {product.quantity}
          </span>

          <button
            onClick={() => handleAdjust(1)}
            disabled={adjusting}
            className="w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold text-xl disabled:opacity-50"
          >
            +
          </button>
        </div>

        <button
          onClick={() => toggleLowStock(product.id)}
          className={`px-3 py-1 rounded text-sm ${
            product.is_low_stock
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {product.is_low_stock ? 'Low Stock' : 'Mark Low'}
        </button>
      </div>
    </div>
  )
}
```

#### 6. Product Form with Photo Upload
**File**: `src/components/warehouse/ProductForm.tsx`
```typescript
import { useState, useRef } from 'react'
import { ProductFormData } from '../../types/product'

interface ProductFormProps {
  onSubmit: (data: ProductFormData, photo?: File) => Promise<void>
  onClose: () => void
  initialData?: Partial<ProductFormData>
}

export function ProductForm({ onSubmit, onClose, initialData }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    supplier: initialData?.supplier || '',
    quantity: initialData?.quantity || 0,
    qty_per_package: initialData?.qty_per_package || 1,
    location: initialData?.location || '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  function handleCameraCapture() {
    fileInputRef.current?.click()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData, photo || undefined)
    } catch (err) {
      console.error('Failed to save product:', err)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {initialData ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Photo</label>
            <div className="flex gap-4 items-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                  No photo
                </div>
              )}
              <button
                type="button"
                onClick={handleCameraCapture}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Take Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium mb-1">Barcode</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Brand & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Quantity & Per Package */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Qty per Package</label>
              <input
                type="number"
                value={formData.qty_per_package}
                onChange={(e) => setFormData({ ...formData, qty_per_package: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border rounded"
                min="1"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location (Cabinet/Shelf)</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="e.g., A-1, B-3"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors
- [ ] Products load from Supabase
- [ ] Photo uploads to storage bucket

#### Manual Verification:
- [ ] Can add new product with photo from camera
- [ ] Can edit existing product
- [ ] Quantity +/- buttons work and update immediately
- [ ] Inventory history records each change
- [ ] Low stock toggle highlights product yellow
- [ ] Search by SKU filters product list
- [ ] Product data persists after refresh

**Implementation Note**: Test photo upload with actual tablet camera to verify `capture="environment"` works correctly.

---

## Phase 5: Shop PWA Core

### Overview
Build the shop manager interface for browsing products and creating/tracking requests.

### Changes Required:

#### 1. Request Types
**File**: `src/types/request.ts`
```typescript
import { Product } from './product'

export type RequestStatus = 'pending' | 'ready' | 'delivered'

export interface Request {
  id: string
  product_id: string
  quantity_requested: number
  status: RequestStatus
  requested_by: string
  handled_by: string | null
  created_at: string
  updated_at: string
  product?: Product
}

export interface RequestFormData {
  product_id: string
  quantity_requested: number
}
```

#### 2. Requests Hook
**File**: `src/hooks/useRequests.ts`
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Request, RequestFormData, RequestStatus } from '../types/request'
import { useAuth } from '../contexts/AuthContext'

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchRequests()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests'
      }, () => {
        fetchRequests()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchRequests() {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        product:products(*)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRequests(data)
    }
    setLoading(false)
  }

  async function createRequest(formData: RequestFormData) {
    const { data, error } = await supabase
      .from('requests')
      .insert([{ ...formData, requested_by: user?.id }])
      .select(`*, product:products(*)`)
      .single()

    if (error) throw error

    setRequests([data, ...requests])
    return data
  }

  async function updateStatus(requestId: string, status: RequestStatus) {
    const { error } = await supabase
      .from('requests')
      .update({
        status,
        handled_by: user?.id
      })
      .eq('id', requestId)

    if (error) throw error

    setRequests(requests.map(r =>
      r.id === requestId ? { ...r, status, handled_by: user?.id } : r
    ))
  }

  return {
    requests,
    loading,
    createRequest,
    updateStatus,
    fetchRequests,
  }
}
```

#### 3. Shop Dashboard
**File**: `src/pages/shop/Dashboard.tsx`
```typescript
import { useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useRequests } from '../../hooks/useRequests'
import { useAuth } from '../../contexts/AuthContext'
import { ProductCatalog } from '../../components/shop/ProductCatalog'
import { RequestList } from '../../components/shop/RequestList'
import { SearchBar } from '../../components/common/SearchBar'

type Tab = 'catalog' | 'requests'

export function ShopDashboard() {
  const { products, loading: productsLoading, searchBySku } = useProducts()
  const { requests, loading: requestsLoading, createRequest } = useRequests()
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('catalog')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(products)

  async function handleSearch(term: string) {
    setSearchTerm(term)
    if (term) {
      const results = await searchBySku(term)
      setFilteredProducts(results)
    } else {
      setFilteredProducts(products)
    }
  }

  const displayProducts = searchTerm ? filteredProducts : products
  const pendingRequests = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Shop</h1>
          <div className="flex items-center gap-4">
            <span>{profile?.name}</span>
            <button onClick={signOut} className="text-sm underline">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-3 text-center ${
            activeTab === 'catalog'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Catalog
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 text-center relative ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          My Requests
          {pendingRequests > 0 && (
            <span className="absolute -top-1 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests}
            </span>
          )}
        </button>
      </div>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'catalog' && (
          <>
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search products..."
              className="mb-4"
            />
            {productsLoading ? (
              <div className="text-center py-8">Loading catalog...</div>
            ) : (
              <ProductCatalog
                products={displayProducts}
                onRequest={createRequest}
              />
            )}
          </>
        )}

        {activeTab === 'requests' && (
          requestsLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : (
            <RequestList requests={requests} />
          )
        )}
      </main>
    </div>
  )
}
```

#### 4. Product Catalog Component
**File**: `src/components/shop/ProductCatalog.tsx`
```typescript
import { useState } from 'react'
import { Product } from '../../types/product'
import { RequestFormData } from '../../types/request'

interface ProductCatalogProps {
  products: Product[]
  onRequest: (data: RequestFormData) => Promise<void>
}

export function ProductCatalog({ products, onRequest }: ProductCatalogProps) {
  const [requesting, setRequesting] = useState<string | null>(null)

  async function handleRequest(product: Product, quantity: number) {
    setRequesting(product.id)
    try {
      await onRequest({
        product_id: product.id,
        quantity_requested: quantity,
      })
      alert('Request created successfully!')
    } catch (err) {
      alert('Failed to create request')
    }
    setRequesting(null)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {products.map(product => (
        <CatalogItem
          key={product.id}
          product={product}
          onRequest={handleRequest}
          isRequesting={requesting === product.id}
        />
      ))}
    </div>
  )
}

interface CatalogItemProps {
  product: Product
  onRequest: (product: Product, quantity: number) => void
  isRequesting: boolean
}

function CatalogItem({ product, onRequest, isRequesting }: CatalogItemProps) {
  const [quantity, setQuantity] = useState(1)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex gap-4">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-20 h-20 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          {product.brand && (
            <p className="text-sm text-gray-500">{product.brand}</p>
          )}
          <p className="text-sm mt-1">
            <span className={product.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.quantity > 0 ? `In Stock: ${product.quantity}` : 'Out of Stock'}
            </span>
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          disabled={product.quantity === 0}
          className="self-start px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Request
        </button>
      </div>

      {showForm && (
        <div className="mt-4 pt-4 border-t flex items-center gap-4">
          <label className="text-sm">Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 p-2 border rounded"
            min="1"
            max={product.quantity}
          />
          <button
            onClick={() => {
              onRequest(product, quantity)
              setShowForm(false)
              setQuantity(1)
            }}
            disabled={isRequesting}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {isRequesting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 5. Request List Component
**File**: `src/components/shop/RequestList.tsx`
```typescript
import { Request } from '../../types/request'

interface RequestListProps {
  requests: Request[]
}

export function RequestList({ requests }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No requests yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}

function RequestCard({ request }: { request: Request }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
  }

  const statusLabels = {
    pending: 'Pending',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{request.product?.name || 'Unknown Product'}</h3>
          <p className="text-sm text-gray-600">
            Quantity: {request.quantity_requested}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      </div>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles without errors
- [ ] Requests load with product data (join works)
- [ ] Realtime subscription connects

#### Manual Verification:
- [ ] Can browse product catalog
- [ ] Can search products by name/SKU
- [ ] Can create request for product
- [ ] Request appears in "My Requests" tab
- [ ] Request status updates in realtime when warehouse changes it
- [ ] Out of stock products disable request button

**Implementation Note**: Test realtime updates by opening shop and warehouse apps side by side.

---

## Phase 6: XLSX Import/Export

### Overview
Add ability to import products from Excel files and export current inventory to Excel format.

### Changes Required:

#### 1. Install ExcelJS
```bash
npm install exceljs
```

#### 2. XLSX Utilities
**File**: `src/lib/xlsx.ts`
```typescript
import ExcelJS from 'exceljs'
import { Product, ProductFormData } from '../types/product'

// Column mapping from existing Excel file structure
const COLUMN_MAP = {
  barcode: 'A',      // Barcode
  sku: 'B',          // SKU/Product code
  supplier: 'D',     // Supplier code
  brand: 'E',        // Brand name
  name: 'G',         // Product name
  qty_per_package: 'H', // Qty per package
  quantity: 'J',     // Current quantity
}

/**
 * Parse XLSX file and extract product data
 */
export async function parseXlsxFile(file: File): Promise<ProductFormData[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const products: ProductFormData[] = []

  // Try to find WAREHOUSE sheet, fallback to first sheet
  let sheet = workbook.getWorksheet('WAREHOUSE')
  if (!sheet) {
    sheet = workbook.worksheets[0]
  }

  if (!sheet) {
    throw new Error('No worksheets found in file')
  }

  // Process rows (skip header row 1)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Skip header

    const sku = getCellValue(row, COLUMN_MAP.sku)
    const name = getCellValue(row, COLUMN_MAP.name)

    // Skip rows without SKU or name
    if (!sku || !name) return

    products.push({
      sku: String(sku).trim(),
      barcode: getCellValue(row, COLUMN_MAP.barcode)?.toString().trim() || undefined,
      name: String(name).trim(),
      brand: getCellValue(row, COLUMN_MAP.brand)?.toString().trim() || undefined,
      supplier: getCellValue(row, COLUMN_MAP.supplier)?.toString().trim() || undefined,
      quantity: parseInt(getCellValue(row, COLUMN_MAP.quantity)) || 0,
      qty_per_package: parseInt(getCellValue(row, COLUMN_MAP.qty_per_package)) || 1,
    })
  })

  return products
}

/**
 * Get cell value handling different types
 */
function getCellValue(row: ExcelJS.Row, column: string): any {
  const cell = row.getCell(column)

  if (!cell || cell.value === null || cell.value === undefined) {
    return ''
  }

  // Handle rich text
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return cell.value.richText.map((r: any) => r.text).join('')
  }

  // Handle formula results
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return cell.value.result
  }

  return cell.value
}

/**
 * Export products to XLSX file
 */
export async function exportToXlsx(products: Product[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('WAREHOUSE')

  // Set up headers
  sheet.columns = [
    { header: 'Barcode', key: 'barcode', width: 15 },
    { header: 'SKU', key: 'sku', width: 12 },
    { header: 'Supplier', key: 'supplier', width: 10 },
    { header: 'Brand', key: 'brand', width: 15 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Qty/Package', key: 'qty_per_package', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Location', key: 'location', width: 12 },
    { header: 'Low Stock', key: 'is_low_stock', width: 10 },
  ]

  // Style header row
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Add data rows
  products.forEach(product => {
    const row = sheet.addRow({
      barcode: product.barcode || '',
      sku: product.sku,
      supplier: product.supplier || '',
      brand: product.brand || '',
      name: product.name,
      qty_per_package: product.qty_per_package,
      quantity: product.quantity,
      location: product.location || '',
      is_low_stock: product.is_low_stock ? 'Yes' : 'No',
    })

    // Highlight low stock rows
    if (product.is_low_stock) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }
      }
    }
  })

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

#### 3. Import/Export Hook
**File**: `src/hooks/useXlsxSync.ts`
```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { parseXlsxFile, exportToXlsx, downloadBlob } from '../lib/xlsx'
import { useProducts } from './useProducts'

export function useXlsxSync() {
  const { products, fetchProducts } = useProducts()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  async function importFromFile(file: File) {
    setImporting(true)
    setProgress({ current: 0, total: 0 })

    try {
      const parsedProducts = await parseXlsxFile(file)
      setProgress({ current: 0, total: parsedProducts.length })

      let imported = 0
      let skipped = 0

      for (const product of parsedProducts) {
        // Check if SKU already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('sku', product.sku)
          .single()

        if (existing) {
          // Update existing product
          await supabase
            .from('products')
            .update(product)
            .eq('id', existing.id)
          skipped++
        } else {
          // Insert new product
          await supabase
            .from('products')
            .insert([product])
          imported++
        }

        setProgress(p => ({ ...p, current: p.current + 1 }))
      }

      await fetchProducts()

      return { imported, skipped, total: parsedProducts.length }
    } finally {
      setImporting(false)
    }
  }

  async function exportToFile() {
    setExporting(true)
    try {
      const blob = await exportToXlsx(products)
      const date = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `inventory-export-${date}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  return {
    importFromFile,
    exportToFile,
    importing,
    exporting,
    progress,
  }
}
```

#### 4. Import/Export UI Component
**File**: `src/components/warehouse/DataSync.tsx`
```typescript
import { useRef, useState } from 'react'
import { useXlsxSync } from '../../hooks/useXlsxSync'

export function DataSync() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importFromFile, exportToFile, importing, exporting, progress } = useXlsxSync()
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importResult = await importFromFile(file)
      setResult(importResult)
    } catch (err) {
      alert('Failed to import file: ' + (err as Error).message)
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="font-semibold mb-4">Data Import/Export</h2>

      <div className="flex gap-4 flex-wrap">
        {/* Import */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {importing
              ? `Importing... (${progress.current}/${progress.total})`
              : 'Import from Excel'
            }
          </button>
        </div>

        {/* Export */}
        <button
          onClick={exportToFile}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Import Result */}
      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          Import complete: {result.imported} new, {result.skipped} updated, {result.total} total
          <button
            onClick={() => setResult(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 5. Add to Warehouse Dashboard
Update `src/pages/warehouse/Dashboard.tsx` to include DataSync component:

```typescript
// Add import
import { DataSync } from '../../components/warehouse/DataSync'

// Add in the main element, before the search bar
<DataSync />
```

### Success Criteria:

#### Automated Verification:
- [ ] ExcelJS parses test file correctly
- [ ] Export generates valid XLSX file
- [ ] TypeScript compiles without errors

#### Manual Verification:
- [ ] Can import `Warehouse Stock Stick.xlsx` file
- [ ] Import shows progress indicator
- [ ] Imported products appear in list
- [ ] Duplicate SKUs update existing products (not create duplicates)
- [ ] Export downloads complete inventory
- [ ] Exported file opens in Excel with correct formatting
- [ ] Low stock rows highlighted yellow in export

**Implementation Note**: Test with the actual `Warehouse Stock Stick.xlsx` file to verify column mapping is correct.

---

## Phase 7: Offline Support

### Overview
Enable offline functionality with service worker caching and local storage sync.

### Changes Required:

#### 1. Update Vite PWA Config
**File**: `vite.config.ts` - Update workbox configuration:

```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  runtimeCaching: [
    {
      // Cache product images
      urlPattern: /^https:\/\/.*supabase\.co\/storage/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'product-images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
        }
      }
    },
    {
      // Cache API responses
      urlPattern: /^https:\/\/.*supabase\.co\/rest/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        },
        networkTimeoutSeconds: 5
      }
    }
  ]
}
```

#### 2. Offline Detection Hook
**File**: `src/hooks/useOnlineStatus.ts`
```typescript
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

#### 3. Local Storage Sync
**File**: `src/lib/offlineStorage.ts`
```typescript
const PENDING_CHANGES_KEY = 'warehouse_pending_changes'

interface PendingChange {
  id: string
  type: 'product_update' | 'quantity_adjust' | 'request_create'
  data: any
  timestamp: number
}

export function savePendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>) {
  const pending = getPendingChanges()
  pending.push({
    ...change,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  })
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(pending))
}

export function getPendingChanges(): PendingChange[] {
  const stored = localStorage.getItem(PENDING_CHANGES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function clearPendingChange(id: string) {
  const pending = getPendingChanges().filter(c => c.id !== id)
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(pending))
}

export function clearAllPendingChanges() {
  localStorage.removeItem(PENDING_CHANGES_KEY)
}
```

#### 4. Sync Service
**File**: `src/lib/syncService.ts`
```typescript
import { supabase } from './supabase'
import { getPendingChanges, clearPendingChange } from './offlineStorage'

export async function syncPendingChanges(): Promise<{ synced: number; failed: number }> {
  const pending = getPendingChanges()
  let synced = 0
  let failed = 0

  for (const change of pending) {
    try {
      switch (change.type) {
        case 'quantity_adjust':
          await supabase
            .from('products')
            .update({ quantity: change.data.newQuantity })
            .eq('id', change.data.productId)

          await supabase
            .from('inventory_history')
            .insert([change.data.historyEntry])
          break

        case 'product_update':
          await supabase
            .from('products')
            .update(change.data.updates)
            .eq('id', change.data.productId)
          break

        case 'request_create':
          await supabase
            .from('requests')
            .insert([change.data])
          break
      }

      clearPendingChange(change.id)
      synced++
    } catch (error) {
      console.error('Failed to sync change:', change.id, error)
      failed++
    }
  }

  return { synced, failed }
}
```

#### 5. Offline Indicator Component
**File**: `src/components/common/OfflineIndicator.tsx`
```typescript
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { getPendingChanges } from '../../lib/offlineStorage'
import { syncPendingChanges } from '../../lib/syncService'
import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setPendingCount(getPendingChanges().length)
  }, [])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync()
    }
  }, [isOnline])

  async function handleSync() {
    setSyncing(true)
    const result = await syncPendingChanges()
    setPendingCount(getPendingChanges().length)
    setSyncing(false)

    if (result.synced > 0) {
      // Optionally show success message
    }
  }

  if (isOnline && pendingCount === 0) {
    return null // Don't show anything when online and synced
  }

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-yellow-500' : 'bg-red-500'
    } text-white`}>
      {!isOnline && (
        <span>Offline Mode</span>
      )}
      {isOnline && pendingCount > 0 && (
        <span>
          {syncing ? 'Syncing...' : `${pendingCount} changes pending`}
        </span>
      )}
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Service worker registered and active
- [ ] Workbox caches static assets
- [ ] Local storage operations work correctly

#### Manual Verification:
- [ ] App loads when offline (after first visit)
- [ ] Can browse cached products offline
- [ ] Quantity changes saved to local storage when offline
- [ ] Changes sync automatically when connection restored
- [ ] Offline indicator shows correct status
- [ ] Product images load from cache when offline

**Implementation Note**: Test by using DevTools Network tab to simulate offline mode. Verify changes made offline sync correctly when going back online.

---

## Phase 8: Push Notifications

### Overview
Implement push notifications for new requests and status changes using Supabase Realtime.

### Changes Required:

#### 1. Notification Permission Hook
**File**: `src/hooks/useNotifications.ts`
```typescript
import { useState, useEffect } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function requestPermission() {
    if (!supported) return false

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  function showNotification(title: string, options?: NotificationOptions) {
    if (permission !== 'granted') return

    new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options
    })
  }

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
  }
}
```

#### 2. Request Notification Service
**File**: `src/lib/notificationService.ts`
```typescript
import { supabase } from './supabase'

type NotificationCallback = (title: string, body: string) => void

export function subscribeToRequestNotifications(
  role: 'manager' | 'warehouse_worker',
  onNotification: NotificationCallback
) {
  const channel = supabase
    .channel('request-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'requests'
      },
      (payload) => {
        // Warehouse workers get notified of new requests
        if (role === 'warehouse_worker') {
          onNotification(
            'New Request',
            'A new product request has been submitted'
          )
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests'
      },
      (payload) => {
        const newStatus = payload.new.status

        // Managers get notified of status changes
        if (role === 'manager') {
          if (newStatus === 'ready') {
            onNotification(
              'Request Ready',
              'Your request is ready for pickup'
            )
          } else if (newStatus === 'delivered') {
            onNotification(
              'Request Delivered',
              'Your request has been delivered'
            )
          }
        }
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}
```

#### 3. Add Notifications to App
**File**: `src/App.tsx` - Add notification subscription:

```typescript
import { useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useNotifications } from './hooks/useNotifications'
import { subscribeToRequestNotifications } from './lib/notificationService'

function App() {
  const { profile } = useAuth()
  const { permission, requestPermission, showNotification } = useNotifications()

  useEffect(() => {
    if (profile && permission === 'default') {
      // Request permission on first load
      requestPermission()
    }
  }, [profile])

  useEffect(() => {
    if (!profile || permission !== 'granted') return

    const unsubscribe = subscribeToRequestNotifications(
      profile.role,
      showNotification
    )

    return unsubscribe
  }, [profile, permission])

  // ... rest of app
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Notification API available in browser
- [ ] Supabase realtime subscription connects

#### Manual Verification:
- [ ] App requests notification permission on first load
- [ ] Warehouse worker receives notification when new request created
- [ ] Manager receives notification when request status changes to "ready"
- [ ] Notifications appear even when app is in background (PWA installed)

**Implementation Note**: Push notifications only work when the app is running (foreground or background). For true push when app is closed, you'd need Web Push with a service worker, which is more complex.

---

## Phase 9: Barcode Scanning (Optional)

### Overview
Add camera-based barcode scanning for quick product lookup.

### Changes Required:

#### 1. Install Barcode Library
```bash
npm install html5-qrcode
```

#### 2. Barcode Scanner Component
**File**: `src/components/common/BarcodeScanner.tsx`
```typescript
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        // Success - barcode detected
        scanner.stop()
        onScan(decodedText)
      },
      () => {
        // Ignore scan failures (no barcode in frame)
      }
    ).catch(err => {
      setError('Camera access denied or not available')
      console.error('Scanner error:', err)
    })

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white text-2xl"
        >
          &times;
        </button>

        <div id="barcode-reader" className="w-full h-full" />

        {error && (
          <div className="absolute bottom-20 left-0 right-0 text-center text-white bg-red-600 p-4">
            {error}
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 text-center text-white">
          Point camera at barcode
        </div>
      </div>
    </div>
  )
}
```

#### 3. Add Scanner to Warehouse Dashboard
Update search section in Warehouse Dashboard:

```typescript
import { BarcodeScanner } from '../../components/common/BarcodeScanner'

// In component:
const [showScanner, setShowScanner] = useState(false)

async function handleBarcodeScanned(barcode: string) {
  setShowScanner(false)

  // Search for product by barcode
  const product = products.find(p => p.barcode === barcode)

  if (product) {
    // Navigate to or highlight the product
    setSearchTerm(product.sku)
    handleSearch(product.sku)
  } else {
    alert('Product not found for barcode: ' + barcode)
  }
}

// In JSX:
<button
  onClick={() => setShowScanner(true)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg"
>
  Scan Barcode
</button>

{showScanner && (
  <BarcodeScanner
    onScan={handleBarcodeScanned}
    onClose={() => setShowScanner(false)}
  />
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] html5-qrcode library loads correctly
- [ ] TypeScript compiles without errors

#### Manual Verification:
- [ ] Scanner opens and shows camera feed
- [ ] Scanning barcode triggers lookup
- [ ] Found product highlights in list
- [ ] Unknown barcode shows appropriate message
- [ ] Scanner closes properly when dismissed

**Implementation Note**: Test with actual product barcodes. May need to add barcode data to products first via import or manual entry.

---

## Phase 10: Deployment

### Overview
Deploy the application to production using Vercel for frontend and Supabase for backend.

### Changes Required:

#### 1. Build Optimization
**File**: `vite.config.ts` - Add build optimizations:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        supabase: ['@supabase/supabase-js'],
        xlsx: ['exceljs'],
      }
    }
  }
}
```

#### 2. Environment Configuration
**File**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

#### 4. Configure Supabase for Production
- Enable email confirmation (optional)
- Set up custom SMTP for emails
- Review and tighten RLS policies
- Enable database backups
- Set up monitoring/alerts

#### 5. PWA Installation Instructions
Create user documentation for installing the PWA:

```markdown
## Installing Warehouse App

### On Android Tablet:
1. Open Chrome and go to [your-app-url]
2. Tap the menu (three dots) in the top right
3. Tap "Add to Home Screen"
4. Tap "Add" to confirm
5. The app icon will appear on your home screen

### On iOS/iPad:
1. Open Safari and go to [your-app-url]
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` completes without errors
- [ ] Build size is reasonable (< 500KB initial)
- [ ] Lighthouse performance score > 80

#### Manual Verification:
- [ ] App accessible at production URL
- [ ] Login works in production
- [ ] All features functional
- [ ] PWA installable on tablet
- [ ] Offline mode works after installation
- [ ] Push notifications work (if enabled)

**Implementation Note**: Test thoroughly on actual target devices (tablets) before going live.

---

## Testing Strategy

### Unit Tests
- Utility functions (date formatting, column conversion)
- XLSX parsing logic
- Offline storage operations

### Integration Tests
- Authentication flows
- Product CRUD operations
- Request workflow
- XLSX import/export

### Manual Testing Checklist

#### Authentication
- [ ] Manager login with email/password
- [ ] Worker login with PIN
- [ ] Invalid credentials rejected
- [ ] Logout works
- [ ] Session persists on refresh

#### Warehouse PWA
- [ ] Add product with photo
- [ ] Edit product details
- [ ] Quantity +/- buttons
- [ ] Low stock toggle
- [ ] Search by SKU
- [ ] Delete product

#### Shop PWA
- [ ] Browse catalog
- [ ] Search products
- [ ] Create request
- [ ] View request status
- [ ] Realtime status updates

#### XLSX
- [ ] Import from Excel file
- [ ] Export to Excel file
- [ ] Duplicate handling on import
- [ ] Column mapping correct

#### Offline
- [ ] App loads offline
- [ ] Products viewable offline
- [ ] Changes queue when offline
- [ ] Sync on reconnect

#### Notifications
- [ ] Permission requested
- [ ] Warehouse gets new request alert
- [ ] Manager gets status change alert

---

## Performance Considerations

1. **Image Optimization**: Compress photos before upload, use thumbnails in lists
2. **Lazy Loading**: Load product images only when visible
3. **Pagination**: If product list grows large, implement pagination
4. **Caching**: Service worker caches static assets and API responses
5. **Bundle Splitting**: Vendor code separated for better caching

---

## Security Considerations

1. **RLS Policies**: All tables have row-level security
2. **Input Validation**: Sanitize all user inputs
3. **PIN Storage**: PINs stored as bcrypt hashes
4. **HTTPS**: Vercel provides automatic HTTPS
5. **API Keys**: Anon key is safe for client-side (RLS protects data)

---

## References

- Requirements: `thoughts/shared/research/2025-12-18-warehouse-pwa-requirements.md`
- XLSX Editor Reference: `thoughts/xlsx/thoughts/shared/plans/2025-12-16-xlsx-inventory-editor.md`
- Supabase Docs: https://supabase.com/docs
- Vite PWA Plugin: https://vite-pwa-org.netlify.app/
- ExcelJS Docs: https://github.com/exceljs/exceljs
- html5-qrcode: https://github.com/mebjas/html5-qrcode
