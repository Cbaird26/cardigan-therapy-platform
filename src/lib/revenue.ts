export const starterDeposit = {
  amount: "$50",
  label: "Reserve starter deposit",
  paymentUrl:
    process.env.NEXT_PUBLIC_CARDIGAN_PAYMENT_LINK ??
    "https://buy.stripe.com/5kQ7sL1OS2lP7r12v6aAw00",
  productName: "Cardigan Starter Deposit",
};
