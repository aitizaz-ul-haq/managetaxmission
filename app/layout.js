import './globals.css';
import { Tilt_Neon } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';

const tiltNeon = Tilt_Neon({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
});

export const metadata = {
  title: 'Manage Taxmission',
  description: 'Sales Tax / FED Invoice Submission Preparation Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={tiltNeon.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
