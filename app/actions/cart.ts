'use server';

import { createCart, addToCart, updateCartLine, removeFromCart } from '@/lib/shopify-api';

export async function addLineItemAction(cartId: string | null, merchandiseId: string, quantity: number) {
  try {
    if (!cartId) {
      // Create new cart
      return await createCart([{ merchandiseId, quantity }]);
    } else {
      // Add to existing cart
      return await addToCart(cartId, [{ merchandiseId, quantity }]);
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw new Error('Failed to add item to cart');
  }
}

export async function updateLineItemAction(cartId: string, lineId: string, quantity: number) {
  try {
    if (quantity === 0) {
      return await removeFromCart(cartId, [lineId]);
    }
    return await updateCartLine(cartId, [{ id: lineId, quantity }]);
  } catch (error) {
    console.error('Error updating cart line:', error);
    throw new Error('Failed to update cart line');
  }
}

export async function removeLineItemAction(cartId: string, lineId: string) {
  try {
    return await removeFromCart(cartId, [lineId]);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw new Error('Failed to remove item from cart');
  }
}
