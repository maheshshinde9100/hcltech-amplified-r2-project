import './globals.css';

export const metadata = {
  title: 'Learning Path Recommender',
  description: 'AI-powered learning path recommender',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
