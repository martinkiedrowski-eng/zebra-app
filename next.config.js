/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA-Icons/Manifest liegen in /public und werden von app/layout.tsx referenziert.
  // Ein echtes Service-Worker-/Caching-Setup (z.B. via next-pwa oder Workbox)
  // folgt bewusst erst, wenn die App-Shell inhaltlich steht.
};

module.exports = nextConfig;
