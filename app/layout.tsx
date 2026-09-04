import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartProvider from "@/components/providers/cart-provider";
import WishlistProvider from "@/components/providers/WishlistProvider";
import { getWishlist } from "@/app/actions/wishlist";
import { cookies } from "next/headers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "IMPERIAL — Storefront Prototype",
    template: "%s | IMPERIAL",
  },
  description:
    "Materials. Systems. Project confidence. Technical products, responsive support and reliable UAE supply for demanding construction environments.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "IMPERIAL",
    title: "IMPERIAL — Storefront Prototype",
    description:
      "Materials. Systems. Project confidence.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('customer_access_token')?.value;
  const idToken = cookieStore.get('customer_id_token')?.value;
  const isLoggedIn = Boolean(accessToken || idToken);

  const wishlistItems = await getWishlist();

  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <CartProvider>
          <WishlistProvider initialItems={wishlistItems} isLoggedIn={isLoggedIn}>
            <Header />
            <main id="main-content">{children}</main>
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
