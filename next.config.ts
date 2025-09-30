import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'augusta-rule-dev.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // webpack: (config, { isServer }) => {
  //   if (isServer) {
  //     // Fix for DocuSign module resolution issues
  //     config.resolve.alias = {
  //       ...config.resolve.alias,
  //       'docusign-esign': require.resolve('docusign-esign'),
  //     };
  //   }
  //   return config;
  // },
  // serverExternalPackages: ['docusign-esign'],
};

export default nextConfig;
