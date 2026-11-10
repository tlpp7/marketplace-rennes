import type {NextConfig} from "next";

// Server rendering and Route Handlers require a Node.js runtime.
const securityHeaders=[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Referrer-Policy",value:"no-referrer"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
 {key:"Strict-Transport-Security",value:"max-age=15552000"},
];

const nextConfig:NextConfig={
 poweredByHeader:false,
 trailingSlash:true,
 images:{unoptimized:true},
 async headers(){
  return [
   {source:"/:path*",headers:securityHeaders},
   {source:"/api/:path*",headers:[{key:"Cache-Control",value:"private, no-store, max-age=0"}]}
  ];
 }
};
export default nextConfig;
