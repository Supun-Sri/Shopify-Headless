'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ShopifyImage } from '@/lib/types';

interface ImageGalleryProps {
  images: ShopifyImage[];
  productTitle: string;
}

export default function ImageGallery({ images, productTitle }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <span>No images available</span>
      </div>
    );
  }

  const mainImage = images[selectedIndex];

  return (
    <div className="gallery">
      {/* Main Image */}
      <div className="gallery-main">
        <Image
          src={mainImage.url}
          alt={mainImage.altText || `${productTitle} - Image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="gallery-main-img"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`gallery-thumb ${index === selectedIndex ? 'gallery-thumb-active' : ''}`}
              aria-label={`View image ${index + 1}`}
              id={`gallery-thumb-${index}`}
            >
              <Image
                src={image.url}
                alt={image.altText || `${productTitle} thumbnail ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="gallery-thumb-img"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
