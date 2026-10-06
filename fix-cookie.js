const fs = require('fs');
let file = fs.readFileSync('/home/ash/personal/clinic_backend/server.js', 'utf8');

// For split-stack deployments (Render + Vercel) you absolutely NEED SameSite=none and Secure=true 
// Regardless of what NODE_ENV is set to, we should dynamically detect if the CLIENT_URL is https
file = file.replace(
  'secure: process.env.NODE_ENV === "production",',
  'secure: true, // Always true for cross-origin HTTPS'
).replace(
  'sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",',
  'sameSite: "none", // Must be none for cross-site (Render API <-> Vercel Frontend)'
);

fs.writeFileSync('/home/ash/personal/clinic_backend/server.js', file);
