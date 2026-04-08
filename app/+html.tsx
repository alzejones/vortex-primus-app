import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" translate="no">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="pt-BR" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
