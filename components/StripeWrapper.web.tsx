import React from 'react';

// Este ficheiro é lido exclusivamente pela Vercel/Web.
// Ele impede o erro ignorando a importação do Stripe nativo.
export default function StripeWrapper({ children }: { children: React.ReactNode, publishableKey?: string }) {
  return <>{children}</>;
}