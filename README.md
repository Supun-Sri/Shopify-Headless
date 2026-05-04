#  Headless Shopify Storefront

A luxury headless e-commerce storefront built with **Next.js 15**, **React 19**, and **Shopify Storefront API**, featuring the Aethelgard "Quiet Luxury" design system.

## Architecture Decisions

The storefront is built to be modular, secure, and resilient.

### Key Decisions
- **Next.js App Router**: Chosen for its built-in support for Server Components and optimal data fetching patterns.

- **Server-Side API Layer**: All communication with Shopify's Storefront API happens via `shopifyFetch` on the server. This ensures that the Storefront Access Token is never exposed in the client-side JavaScript bundle, significantly enhancing security.

- **Zustand for State Management**: Selected for its minimal footprint and ease of use with persistence. It manages the local cart state and UI interactions like the Cart Drawer.

- **Hybrid Cart Sync**: We use an "Optimistic UI" approach. When an item is added, the local store updates instantly. Simultaneously, a Next.js Server Action syncs this change with the Shopify API to retrieve the official `checkoutUrl` and cart ID.

- **Vanilla CSS (Aethelgard)**: To maintain the high-precision "Quiet Luxury" aesthetic without the overhead or design constraints of utility-first frameworks.

- **Hydration Safety**: Implemented a mount-detection pattern in components to prevent SSR/CSR hydration mismatches typical of persisted client-side stores.

## File Directory
```
shopify-headless/
 app/                    # Next.js App Router (Pages, Layouts, Actions)
 components/             # React Components (Cart, Layout, Products, UI)
lib/                    # Logic Layer (API, Store, Types, Utils)
public/                 # Static Assets
```

## Setup Instructions



### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and populate it with your Shopify credentials:

```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = "your-store-domain"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN = "your-storefront-access-token"
SHOPIFY_API_VERSION = "your-api-version"
```

### 3. Running Locally
```bash
npm run dev
```

## GraphQL API Reference

### Queries

- `getAllProducts` - Paginated product fetching with filter/sort support.
- `getProductByHandle` - Detailed product data for PDP.
- `getProductRecommendations` -  related products for PDP.
- `getCollections` - Fetch collection list for homepage/navigation.

### Mutations

- `CreateCart` - Initializes a new Shopify cart session.
- `AddToCart` - Adds items to an existing cart.
- `UpdateCartLine` - Modifies item quantities in the cart.
- `RemoveFromCart` - Deletes an item from the cart session.


- **Shopify-Hosted Checkout**:   redirects users to the Shopify domain for payment processing.


