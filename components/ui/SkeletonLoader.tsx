export function ProductCardSkeleton() {
  return (
    <div className="product-card">
      <div className="product-card-image skeleton" />
      <div className="product-card-info">
        <div className="skeleton skeleton-text" style={{ width: '60%', height: '10px' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', height: '14px', marginTop: '8px' }} />
        <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px', marginTop: '8px' }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="pdp-layout">
      <div className="pdp-gallery">
        <div className="gallery-main skeleton" />
        <div className="gallery-thumbs">
          <div className="gallery-thumb skeleton" />
          <div className="gallery-thumb skeleton" />
        </div>
      </div>
      <div className="pdp-info">
        <div className="skeleton skeleton-text" style={{ width: '40%', height: '10px' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%', height: '32px', marginTop: '16px' }} />
        <div className="skeleton skeleton-text" style={{ width: '30%', height: '18px', marginTop: '16px' }} />
        <div className="skeleton skeleton-text" style={{ width: '100%', height: '56px', marginTop: '40px' }} />
        <div className="skeleton skeleton-text" style={{ width: '100%', height: '56px', marginTop: '12px' }} />
      </div>
    </div>
  );
}
