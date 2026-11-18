const BASE_URL = 'http://localhost:3000';

async function testGatekeeperRejection() {
  console.log('Testing Gatekeeper screening with non-civic input...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@demo.com', password: 'Demo1234' }),
  });
  const cookie = loginRes.headers.get('set-cookie');

  const analyzeRes = await fetch(`${BASE_URL}/api/issues/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
    body: JSON.stringify({
      imageBase64: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
      zoneId: 'adyar',
      note: 'Testing selfie / cat photo',
    }),
  });

  const data = await analyzeRes.json();
  console.log('Valid:', data.analysis?.valid);
  console.log('Issue Type:', data.analysis?.issue_type);
  console.log('Reasoning:', data.analysis?.reasoning);
  console.log('Priority Score:', data.analysis?.priority_score);

  if (data.analysis?.valid === false && data.analysis?.issue_type === 'invalid') {
    console.log('✅ GATEKEEPER REJECTION VERIFIED!');
  } else {
    console.error('❌ GATEKEEPER REJECTION FAILED');
    process.exit(1);
  }
}

testGatekeeperRejection();
