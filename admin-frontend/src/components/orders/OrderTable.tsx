import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  orders: any[];

  onDelete: (id: number) => void;

  onEdit: (id: number) => void;
}

const OrderTable = ({
  orders,
  onDelete,
  onEdit,
}: Props) => {
  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-200">
          <th>ID</th>

          <th>Customer</th>

          <th>Phone</th>

          <th>Status</th>

          <th>Total</th>

          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>

            <td>
              {order.customerName}
            </td>

            <td>{order.phone}</td>

            <td>
              <OrderStatusBadge
                status={order.status}
              />
            </td>

            <td>
              {order.totalAmount}
            </td>

            <td className="space-x-2">
              <button
                onClick={() =>
                  onEdit(order.id)
                }
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() =>
                  onDelete(order.id)
                }
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OrderTable;