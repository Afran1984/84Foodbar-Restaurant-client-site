import React from 'react';
import useAuth from '../../../Hooks/useAuth';
import useAxiousSecure from '../../../Hooks/useAxiousSecure';
import { useQuery } from '@tanstack/react-query';

const PaymentHistory = () => {
    const {user} = useAuth();
    console.log(user);
    const axiosSecure = useAxiousSecure();

    const {data: payments = []} = useQuery({
        queryKey:['payments', user.email],
        queryFn: async() =>{
            const res = await axiosSecure.get(`/payments/${user.email}`)
            return res.data;
        }

    })
    return (
        <div className='mx-4'>
            <div className="overflow-x-auto">
  <table className="table table-zebra">
    {/* head */}
    <thead>
      <tr>
        <th>#</th>
        <th>Price</th>
        <th>Transaction Id</th>
        <th>Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {payments.map((payment, index) => <tr key={payment._id}>
        <th>{index + 1}</th>
        <td>{payment.price}</td>
        <td>{payment.transactionId}</td>
        <td>{payment.date}</td>
        <td>{payment.status}</td>
      </tr>)}
    </tbody>
  </table>
</div>
        </div>
    );
};

export default PaymentHistory;