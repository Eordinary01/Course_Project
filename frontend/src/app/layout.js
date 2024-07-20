import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth/AuthContext";
import Header from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LearnHub",
  description: "A application to view various course",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
        <Header/>
        {children}
        </AuthProvider>
        </body>
    </html>
  );
}
