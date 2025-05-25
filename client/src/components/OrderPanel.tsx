import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function OrderPanel() {
  const { items, total, removeItem, processOrder, isProcessing } = useCart();
  
  const formattedPrice = (price: number | string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₱ ${numericPrice.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold uppercase mb-3">PRODUCT:</h2>
        <div className="min-h-[2rem]">
          {items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.product.id} className="flex justify-between items-center py-1">
                  <span className="text-base md:text-lg">
                    {item.product.name}
                    {item.product.size && <span className="text-xs md:text-sm ml-1 bg-gray-100 px-1.5 py-0.5 rounded-sm">{item.product.size}</span>}
                    <span className="ml-1 font-medium">(x{item.quantity})</span>
                  </span>
                  <button 
                    className="text-xl text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center"
                    onClick={() => removeItem(item.product.id, item.product.size)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-base">No products selected</p>
          )}
        </div>
        
        <h2 className="text-xl font-bold uppercase mb-3 mt-5">PRICE:</h2>
        <div className="min-h-[2rem]">
          {items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.product.id} className="flex justify-between items-center py-1">
                  <span className="text-base">
                    {item.product.name}
                    {item.product.size && <span className="text-xs md:text-sm ml-1 bg-gray-100 px-1.5 py-0.5 rounded-sm">{item.product.size}</span>}
                  </span>
                  <span className="text-base md:text-lg font-medium">{formattedPrice(parseFloat(item.product.price) * item.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-base">No products selected</p>
          )}
        </div>
        
        <hr className="my-6 border-[#F5D7B5]" />
        
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold uppercase">TOTAL:</h2>
          <div className="text-xl font-bold">{formattedPrice(total)}</div>
        </div>
      </div>
      
      <div className="mt-auto space-y-2">
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition duration-300 font-medium text-lg"
          onClick={processOrder}
          disabled={items.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              PROCESSING...
            </>
          ) : (
            "COMPLETE ORDER"
          )}
        </Button>
      </div>
    </div>
  );
}
