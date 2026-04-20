/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Raises the body size limit for Server Actions AND route handler formData()
    // reads to 50 MB. This is the correct fix for 413 errors when uploading
    // large Excel/CSV files through App Router API routes.
    // Docs: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
}

module.exports = nextConfig