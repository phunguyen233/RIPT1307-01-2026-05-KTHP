interface Props {
  status: string;
}

const OrderStatusBadge = ({
  status,
}: Props) => {
  return (
    <span
      className={`px-2 py-1 rounded text-white
      ${
        status === "pending"
          ? "bg-yellow-500"
          : status === "completed"
          ? "bg-green-500"
          : status === "cancelled"
          ? "bg-red-500"
          : "bg-blue-500"
      }
    `}
    >
      {status}
    </span>
  );
};

export default OrderStatusBadge;