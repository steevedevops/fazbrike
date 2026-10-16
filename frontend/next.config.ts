import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontido para a imagem Docker de produção (docker/site/Dockerfile).
  output: "standalone",
};

export default nextConfig;
