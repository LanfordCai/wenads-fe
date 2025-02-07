import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { Inter } from "next/font/google";
import Providers from "./providers";
import { NotificationProvider } from './contexts/NotificationContext';
import Header from './components/Header';

const inter = Inter({ subsets: ["latin"] });

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
            <Header />
            {children}
          </Providers>
        </NotificationProvider>
      </body>
    </html>
  );
}