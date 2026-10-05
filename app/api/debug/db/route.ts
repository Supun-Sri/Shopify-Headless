import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/mongodb';
import { getCustomerKey } from '@/lib/wishlist-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('customer_id_token')?.value;

    if (!idToken) {
      return NextResponse.json(
        { error: 'Not logged in. Please log into the store first.' },
        { status: 401 }
      );
    }

    const customerKey = getCustomerKey(idToken);

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        error: 'MONGODB_URI is not set in Netlify environment variables.',
        customerKey
      });
    }

    // Attempt to connect to the database
    const db = await getDb();
    
    // Fetch the raw document for this specific user
    const doc = await db.collection('customers').findOne({ _id: customerKey as any });

    return NextResponse.json({
      connection: 'success',
      customerKey: customerKey,
      database_record: doc || 'No record found in MongoDB yet (try adding an item to your wishlist first!)'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'MongoDB connection failed.', 
        message: error.message,
        hint: 'Did you allow access from anywhere (0.0.0.0/0) in MongoDB Atlas Network Access?'
      },
      { status: 500 }
    );
  }
}
