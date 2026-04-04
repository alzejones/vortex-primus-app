import { StripeProvider } from '@stripe/stripe-react-native';
import React from 'react';

export default function StripeWrapper({ children, publishableKey }: { children: any, publishableKey: string }) {
  return (
    <StripeProvider publishableKey={publishableKey}>
      <>{children}</>
    </StripeProvider>
  );
}
