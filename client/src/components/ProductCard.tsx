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
      <div className="h-32 w-full overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2 text-center">
        <h3 className="font-medium uppercase tracking-wide">{product.name}</h3>
      </div>
    </div>
  );
}
