const https = require('https');

https.get('https://private-clinic-management-system.onrender.com/api/auth/me', (res) => {
  console.log('HEADERS:', res.headers);
});
