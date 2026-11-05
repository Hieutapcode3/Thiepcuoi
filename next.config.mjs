/** @type {import('next').NextConfig} */
// three/examples/jsm là ES module thuần → để Next biên dịch cùng
const nextConfig = { reactStrictMode: true, transpilePackages: ["three"] };
export default nextConfig;
