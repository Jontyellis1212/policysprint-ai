import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow PDFKit to be used in App Router server routes
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
