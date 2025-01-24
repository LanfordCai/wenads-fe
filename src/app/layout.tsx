import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { Inter, Permanent_Marker } from "next/font/google";
import Providers from "./providers";
import { NotificationProvider } from './contexts/NotificationContext';

const inter = Inter({ subsets: ["latin"] });
const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          <Providers>
            {children}
          </Providers>
        </NotificationProvider>
      </body>
    </html>
  );
}