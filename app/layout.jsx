import './globals.css';

export const metadata = {
  title: 'PathAI – Personalized Learning Path Recommender',
  description: 'AI-powered career learning paths tailored to your goals, powered by Groq & Gemini.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
