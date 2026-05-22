import {
  useEffect,
  useState,
} from "react";

import customerAPI from "../../../api/customerAPI";

import CustomerTable from "../../../components/customers/CustomerTable";

const CustomerList = () => {
  const [customers, setCustomers] =
    useState<any[]>([]);

  const fetchCustomers = async () => {
    try {
      const data =
        await customerAPI.getCustomers();

      setCustomers(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Customers
      </h1>

      <CustomerTable
        customers={customers}
      />
    </div>
  );
};

export default CustomerList;