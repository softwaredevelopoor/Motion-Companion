import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Motion Companion Treasury Dashboard',
  description: 'Transparent, rule-based treasury automation on Solana',
  keywords: ['Solana', 'Treasury', 'Automation', 'DeFi'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Motion Companion</h1>
                <p className="text-gray-600 mt-1">Autonomous Treasury Management on Solana</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Transparent • Rule-Based • Automated</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
            <p>Motion Companion • Autonomous Treasury on Solana</p>
            <p className="mt-2">
              <a
                href="https://github.com/softwaredevelopoor/Motion-Companion"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
