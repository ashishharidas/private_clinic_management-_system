const https = require('https');

https.get('https://private-clinic-management-system.onrender.com/api/health', (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  res.on('data', (d) => process.stdout.write(d));
});
