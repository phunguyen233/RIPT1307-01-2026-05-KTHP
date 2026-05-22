import {
  useEffect,
  useState,
} from "react";

import cartAPI from "../../../api/cartAPI";

import CartItem from "./CartItem";

const Cart = () => {
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

  const handleRemove =
    async (id: number) => {
      try {
        await cartAPI.removeCartItem(
          id
        );

        fetchCart();
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        My Cart
      </h1>

      {cart.length === 0 && (
        <p>Cart is empty</p>
      )}

      {cart.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onRemove={
            handleRemove
          }
        />
      ))}
    </div>
  );
};

export default Cart;