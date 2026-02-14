module.exports = {
  apps: [
    {
      name: "myfuel",
      script: "api/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
