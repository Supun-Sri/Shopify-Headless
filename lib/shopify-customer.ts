import { cookies } from 'next/headers';

export interface CustomerOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  totalPrice?: {
    amount: string;
    currencyCode: string;
  };
}

export interface CustomerAccountInfo {
  id?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  defaultAddress?: {
    formatted?: string[];
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  } | null;
  orders: CustomerOrder[];
}

export function decodeIdToken(token: string): {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function getShopId(): string {
  const authUrl = process.env.SHOPIFY_AUTH_URL || '';
  const match = authUrl.match(/authentication\/(\d+)\//);
  return match ? match[1] : '73923231931';
}

export function getCustomerGraphQLUrl(): string {
  const shopId = getShopId();
  return 'https://shopify.com/' + shopId + '/account/customer/api/2024-07/graphql';
}

export async function getCustomerAccountData(): Promise<{
  isLoggedIn: boolean;
  customer: CustomerAccountInfo | null;
}> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customer_access_token')?.value;
    const idToken = cookieStore.get('customer_id_token')?.value;

    if (!accessToken && !idToken) {
      return { isLoggedIn: false, customer: null };
    }

    const decoded = idToken ? decodeIdToken(idToken) : null;
    let displayName = decoded?.name;
    if (!displayName && decoded?.given_name) {
      displayName = (decoded.given_name + ' ' + (decoded.family_name || '')).trim();
    }
    if (!displayName && decoded?.email) {
      displayName = decoded.email.split('@')[0];
    }

    let customerData: CustomerAccountInfo = {
      id: decoded?.sub,
      email: decoded?.email,
      firstName: decoded?.given_name,
      lastName: decoded?.family_name,
      displayName: displayName || 'Valued Customer',
      orders: [],
      defaultAddress: null,
    };

    if (accessToken) {
      try {
        const endpoint = getCustomerGraphQLUrl();
        const query = `
          query CustomerProfile {
            customer {
              id
              firstName
              lastName
              displayName
              emailAddress {
                emailAddress
              }
              phoneNumber {
                phoneNumber
              }
              defaultAddress {
                formatted
                address1
                address2
                city
                province
                zip
                country
              }
              orders(first: 10) {
                edges {
                  node {
                    id
                    name
                    processedAt
                    financialStatus
                    fulfillmentStatus
                    totalPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken,
          },
          body: JSON.stringify({ query }),
          cache: 'no-store',
        });

        if (res.ok) {
          const json = await res.json();
          const cust = json?.data?.customer;
          if (cust) {
            customerData = {
              id: cust.id || customerData.id,
              firstName: cust.firstName || customerData.firstName,
              lastName: cust.lastName || customerData.lastName,
              displayName: cust.displayName || customerData.displayName,
              email: cust.emailAddress?.emailAddress || customerData.email,
              phone: cust.phoneNumber?.phoneNumber || customerData.phone,
              defaultAddress: cust.defaultAddress || null,
              orders: (cust.orders?.edges || []).map((e: any) => ({
                id: e.node.id,
                name: e.node.name,
                processedAt: e.node.processedAt,
                financialStatus: e.node.financialStatus,
                fulfillmentStatus: e.node.fulfillmentStatus,
                totalPrice: e.node.totalPrice,
              })),
            };
          }
        }
      } catch (graphError) {
        console.warn('Customer Account GraphQL fetch skipped:', graphError);
      }
    }

    return {
      isLoggedIn: true,
      customer: customerData,
    };
  } catch (err) {
    console.error('getCustomerAccountData error:', err);
    return { isLoggedIn: false, customer: null };
  }
}
