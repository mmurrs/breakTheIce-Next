/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
  
    webpack: (config, { isServer }) => {
      
        config.resolve.fallback = {
          fs: false,
          crypto: false,
          net: false,
          tls: false,
        };
    
  
      return config;
    },
  };
  
export default nextConfig
