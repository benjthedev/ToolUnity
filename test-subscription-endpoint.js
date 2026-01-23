const https = require('https');

const data = JSON.stringify({ userId: '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/subscriptions/check-tool-count',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
