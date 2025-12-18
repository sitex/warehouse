---
date: 2025-12-18T17:30:17+10:00
researcher: Claude
git_commit: no-commits (initial)
branch: master
repository: sitex/warehouse
topic: "Warehouse Inventory Management PWA - Requirements Specification"
tags: [research, requirements, pwa, warehouse, inventory]
status: complete
last_updated: 2025-12-18
last_updated_by: Claude
---

# Research: Warehouse Inventory Management PWA Requirements

**Date**: 2025-12-18T17:30:17+10:00
**Researcher**: Claude
**Git Commit**: no-commits (initial repository)
**Branch**: master
**Repository**: sitex/warehouse

## Research Question
Extract and document requirements from the shared conversation for the Warehouse Inventory Management System.

## Summary

This is a **greenfield project** - the repository was just initialized with no existing code. The requirements were extracted from a conversation discussing a PWA-based warehouse inventory system for a cigar shop/warehouse operation.

The system consists of two Progressive Web Applications (PWA):
1. **Shop PWA** - For store managers to view inventory and request products
2. **Warehouse PWA** - For warehouse workers to manage inventory, photos, and quantities

## Detailed Requirements

### System Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Shop (PWA)    │     │  Warehouse (PWA)│
│                 │     │                 │
│ - View catalog  │     │ - Edit products │
│ - Request items │     │ - Upload photos │
│ - Track status  │     │ - Manage qty    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │   Backend   │
              │   + DB      │
              │   + Storage │
              └─────────────┘
```

### Shop PWA Features

| Feature | Description |
|---------|-------------|
| View Catalog | Browse products with photos and details |
| Search | Search products by name |
| Request Product | Create request for items needed in store |
| Request Tracking | View status: pending → ready → delivered |
| Authorization | Manager-level access control |

### Warehouse PWA Features

| Feature | Description |
|---------|-------------|
| Add/Edit Products | Full CRUD operations on inventory |
| Photo Upload | Capture and upload photos from tablet camera |
| Quantity Management | Increment/decrement stock levels (+/-) |
| Location Tracking | Assign products to cabinet/shelf |
| Offline Mode | Work without internet, sync when connected |
| Authorization | Warehouse worker access control |

### Shared Features (Both Apps)

- **Authentication**: Role-based (manager vs warehouse worker)
- **Push Notifications**: Alerts for new requests
- **PWA Capabilities**: Installable, works offline

### Offline Capabilities (PWA)

Service Worker should cache:
- Interface (HTML/CSS/JS)
- Product list data
- Photo thumbnails

Offline behavior:
- Viewing works fully offline
- Changes saved to local storage
- Automatic sync when connection restored

## Data Model (Implied)

### Products
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Product name |
| photo_url | string | URL to product image |
| quantity | integer | Current stock level |
| location | string | Cabinet/shelf location |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last modification |

### Requests
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Foreign key to product |
| status | enum | pending / ready / delivered |
| requested_by | UUID | User who made request |
| created_at | timestamp | Request date |
| updated_at | timestamp | Status change date |

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | string | Login identifier |
| role | enum | manager / warehouse_worker |
| name | string | Display name |

## Technology Stack Options

### Recommended (Simplest Path)

| Component | Technology | Cost |
|-----------|------------|------|
| Frontend | React / Vue / Vanilla JS (PWA) | Free |
| Backend | Supabase (BaaS) | Free tier (500MB DB, 1GB storage) |
| Database | PostgreSQL (via Supabase) | Included |
| Photo Storage | Supabase Storage | Included |
| Auth | Supabase Auth | Included |
| Hosting | Vercel / Netlify | Free tier |

### Self-Hosted Alternative

| Component | Technology | Cost |
|-----------|------------|------|
| Frontend | React / Vue / Vanilla JS (PWA) | Free |
| Backend | Node.js / Python FastAPI | Free |
| Database | SQLite / PostgreSQL | Free |
| Photo Storage | Local filesystem | Free |
| Hosting | Raspberry Pi / VPS | ~$5-10/month or one-time |

## Deployment Considerations

### No Google Play Store Required
- APK direct install for native Android
- PWA installed via browser "Add to Home Screen"
- Firebase App Distribution for team testing

### Hosting Options Discussed

| Option | Monthly Cost | Pros | Cons |
|--------|--------------|------|------|
| Supabase | Free* | All-in-one, no backend code | Limits on free tier |
| Railway/Render | Free-$5 | Full control | Need to write backend |
| VPS | $5-10 | Full control, no limits | Server management |
| Raspberry Pi | One-time ~$100 | No subscription, data on-site | Needs static IP/tunnel |

## Current Codebase State

**Status**: Empty repository (just initialized)

**Files present**:
- `.gitignore` - Basic ignore file
- `.claude/` - Claude Code configuration (commands, agents)
- `.git/` - Git repository

**No implementation code exists yet.**

## Next Steps (For Reference)

1. Choose technology stack (Supabase recommended for quick start)
2. Set up project structure
3. Implement data models
4. Build Warehouse PWA (core CRUD + photo upload)
5. Build Shop PWA (catalog view + request system)
6. Add authentication
7. Implement offline support
8. Add push notifications

## Open Questions

1. **Authentication method**: Email/password? PIN code? OAuth?
2. **Multi-warehouse support**: Single warehouse or multiple locations?
3. **Inventory history**: Track quantity changes over time?
4. **Barcode/QR scanning**: Needed for product lookup?
5. **Reports**: Any reporting/analytics requirements?
6. **Languages**: Russian-only UI or multilingual?
