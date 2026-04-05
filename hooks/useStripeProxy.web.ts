// hooks/useStripeProxy.web.ts
export const useStripeProxy = () => {
  return {
    initPaymentSheet: async (params: any) => ({ 
      error: { message: 'Pagamentos via Stripe ainda não suportados na versão Web.' } 
    }),
    presentPaymentSheet: async () => ({ 
      error: { message: 'Pagamentos via Stripe ainda não suportados na versão Web.' } 
    }),
  };
};