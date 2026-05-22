type Props = {
  item: any;

  onRemove: (
    id: number
  ) => void;
};

const CartItem = ({
  item,
  onRemove,
}: Props) => {
  return (
    <div className="border p-4 rounded mb-4">
      <h2 className="text-xl font-bold">
        {item.product_name}
      </h2>

      <p>
        Price:
        {" "}
        $
        {item.product_price}
      </p>

      <p>
        Quantity:
        {" "}
        {item.quantity}
      </p>

      <button
        onClick={() =>
          onRemove(item.id)
        }
        className="bg-red-500 text-white px-4 py-2 mt-2"
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;