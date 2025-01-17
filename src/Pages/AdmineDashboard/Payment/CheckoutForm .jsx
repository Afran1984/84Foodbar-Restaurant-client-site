import React, { useEffect, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import useAxiousSecure from "../../../Hooks/useAxiousSecure";
import useCarts from "../../../Hooks/useCarts";
import useAuth from '../../../Hooks/useAuth';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const CheckoutForm  = () => {
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const stripe = useStripe();
    const elements = useElements();
    const axiosSecure = useAxiousSecure();
    const [cart, refetch] = useCarts();
    const [transactionId, setTransactionId] = useState('');
    const {user} = useAuth();
    const navigate = useNavigate();

    const totalPrice = cart.reduce((total, item) => total + item.price ,0)

    useEffect( () =>{
     if(totalPrice > 0){
      axiosSecure.post('/create-payment-intent', {price: totalPrice})
     .then(res => {
      console.log(res.data.clientSecret);
      setClientSecret(res.data.clientSecret);
     })
     }

    }, [axiosSecure, totalPrice])



    const handleSubmite = async (event) =>{
        event.preventDefault();
        if(!stripe || !elements){
            return;
        }

        const card = elements.getElement(CardElement)

        if(card === null){
            return;
        }

        const {error, paymentMethod} = await stripe.createPaymentMethod({
          type: 'card',
          card
        })

        if(error){
          console.log('payment error', error);
          setError(error.message);
        }
        else{
          console.log('payment methode', paymentMethod);
          setError('');
        }

        // Confrm Payment
        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret,{
          payment_method: {
            card: card,
            billing_details: {
              email: user?.email || 'anonymous',
              name: user?.displayName || 'anonymous'
            }
          }
        })
        if(confirmError){
          console.log('confirm Error');
        }
        else{
          console.log('Payment Success', paymentIntent);
          if(paymentIntent.status === 'succeeded'){
            // console.log('Transaction id', paymentIntent.id);
            setTransactionId(paymentIntent.id);

            // now save the payment in the database
            const payment = {
              email: user.email,
              price: totalPrice,
              transactionId: paymentIntent.id,
              date: new Date(),
              cartIds: cart.map(item => item._id),
              menuItemIds: cart.map(item => item.menuId),
              status: 'pending'
            }
            const res = await axiosSecure.post('/payments', payment);
            console.log('payment save',res.data);
            refetch();
            if(res.data?.paymentResult?.insertedId){
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Successfully Payment",
                showConfirmButton: false,
                timer: 1500
              });
              navigate('/dashboard/paymentHistory');
            }
          }
        }
    }
    return (
        <form className='mx-5 border 2px p-4 w-full mx-auto' onSubmit={handleSubmite}>
            <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      <button className='btn mt-5 text-center' type="submit" disabled={!stripe || !clientSecret}> <FaBangladeshiTakaSign></FaBangladeshiTakaSign>
        Pay
      </button>
        <p className='text-red-600'>{error}</p>
        {
          transactionId && <p className='text-green-500'>Your Tranjection Id: <span className='text-red-600'>{transactionId}</span></p>
        }
        
        </form>
    );
};

export default CheckoutForm ;