import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@opencalc/database", "@opencalc/feature-flags", "@opencalc/ui-shared"],
};

export default nextConfig;
