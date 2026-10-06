const fs = require('fs');
let file = fs.readFileSync('/home/ash/personal/clinic_backend/config/passport.js', 'utf8');

file = file.replace('callbackURL: process.env.GOOGLE_CALLBACK_URL,', 'callbackURL: process.env.GOOGLE_CALLBACK_URL,\n      proxy: true,');

fs.writeFileSync('/home/ash/personal/clinic_backend/config/passport.js', file);
