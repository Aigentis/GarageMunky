import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/vehicle-enquiry': {
        target: 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        changeOrigin: true,
        rewrite: () => '',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the API key from the original request
            const apiKey = req.headers['x-api-key'];
            if (apiKey) {
              proxyReq.setHeader('x-api-key', apiKey);
            } else if (process.env.VITE_DVLA_API_KEY) {
              // Use environment variable as fallback
              proxyReq.setHeader('x-api-key', process.env.VITE_DVLA_API_KEY);
            }
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
