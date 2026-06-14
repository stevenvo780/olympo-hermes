
const mod = require('./src/utils/axiosWompiInstance');
console.log('Exports:', Object.keys(mod));
if (mod.createAxiosInstance) console.log('createAxiosInstance exists');
else console.log('createAxiosInstance MISSING');
