/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que Turbopack intente bundlear packages con binarios nativos/WASM
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "ia.media-imdb.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
