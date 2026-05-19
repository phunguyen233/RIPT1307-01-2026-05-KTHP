import {
  useEffect,
  useState,
} from "react";

import cartAPI from "../../../api/cartAPI";

import CartItem from "../../../components/cart/CartItem";

const CartPage = () => {
  const [cart, setCart] =
    useState<any[]>([]);

  const fetchCart = async () => {
    try {
      const data =
        await cartAPI.getCart();

      setCart(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (
    id: number
  ) => {
    try {
      await cartAPI.removeCartItem(
        id
      );

      fetchCart();
    } catch (error) {
      console.log(error);
    }
  };

  const total = cart.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity,
    0
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Shopping Cart
      </h1>

      <div className="space-y-4">
        {cart.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <div className="mt-6 text-xl font-bold">
        Total: {total}
      </div>
    </div>
  );
};

export default CartPage;