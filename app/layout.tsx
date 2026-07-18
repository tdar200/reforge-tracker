import "./globals.css";
export const metadata = { title: "Reforge", description: "Personal fitness tracker" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
