/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    GMAIL_USER: process.env.GMAIL_USER,
    PASSWORD: process.env.PASSWORD,
    APP_PASSWORD: process.env.APP_PASSWORD,

    CLIENT_EMAIL: process.env.CLIENT_EMAIL,
    private_key: process.env.private_key,
    

   },
}
