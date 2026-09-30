// Vercel serverless entry point — re-exports the Express app from server.js.
// Vercel calls this function on every request; server.js only calls
// app.listen() when VERCEL is unset (i.e. when running locally).
const app = require("../server");

module.exports = app;