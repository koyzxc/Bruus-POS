import { Product } from "@shared/schema";
import { useCart } from "@/contexts/cart-context";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  
  return (
    <div 
      className="product-card rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition duration-300 cursor-pointer"
      onClick={() => addItem(product)}
    >
      <div className="h-36 md:h-40 w-full overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 text-center">
        <h3 className="text-base md:text-lg font-medium uppercase tracking-wide">
          {product.name} 
          {product.size && (
            <span className="text-xs md:text-sm ml-1 bg-gray-100 px-1.5 py-0.5 rounded-sm font-normal">
              {product.size}
            </span>
          )}
        </h3>
        <p className="text-base md:text-lg font-semibold text-gray-700 mt-1">
          ₱{parseFloat(product.price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
