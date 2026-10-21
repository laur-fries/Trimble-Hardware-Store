interface ProductImageProps {
  src: string;
  alt: string;
}

/**
 * Renders a product photo on a neutral surface with contain-fit so varied
 * source images share a consistent card header footprint.
 */
export default function ProductImage({ src, alt }: ProductImageProps) {
  return (
    <div className="product-image">
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}
