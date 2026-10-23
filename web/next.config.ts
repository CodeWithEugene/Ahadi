import type { NextConfig } from "next"

// The browser only talks to this origin. /api/* is proxied to the Ahadi bridge (FastAPI):
// locally uvicorn on :8000, in production the bridge's public URL.
const API_ORIGIN = process.env.AHADI_API_ORIGIN ?? "http://127.0.0.1:8000"

const nextConfig: NextConfig = {
  // The live event stream (server-sent events) must not be gzipped, or browsers see nothing until it ends.
  compress: false,
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }]
  },
}

export default nextConfig
