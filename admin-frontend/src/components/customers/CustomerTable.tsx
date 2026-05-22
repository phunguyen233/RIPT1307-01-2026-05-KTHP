interface Props {
  customers: any[];
}

const CustomerTable = ({
  customers,
}: Props) => {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>ID</th>

          <th>Name</th>

          <th>Email</th>

          <th>Phone</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td>{customer.id}</td>

            <td>{customer.name}</td>

            <td>{customer.email}</td>

            <td>{customer.phone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomerTable;