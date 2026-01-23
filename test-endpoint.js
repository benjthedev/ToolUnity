const userId = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e';

fetch('http://localhost:3000/api/subscriptions/check-tool-count', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
})
.then(r => r.json())
.then(data => {
  console.log('Endpoint response:', JSON.stringify(data, null, 2));
  
  // Now check database to verify update
  setTimeout(() => {
    require('./check-user-status.js');
  }, 1000);
});
