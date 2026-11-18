const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting UrbanMind AI Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Unauthenticated /api/auth/me should return 401
    const unauthMe = await fetch(`${BASE_URL}/api/auth/me`);
    assert(unauthMe.status === 401, 'Unauthenticated user rejected with 401');

    // Test 2: Login with seeded Demo Citizen account
    const citizenLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@demo.com', password: 'Demo1234' }),
    });
    const citizenLoginData = await citizenLoginRes.json();
    const citizenCookie = citizenLoginRes.headers.get('set-cookie');

    assert(citizenLoginRes.status === 200, 'Citizen demo login returns 200');
    assert(citizenLoginData.user?.role === 'citizen', 'Citizen role verified');
    assert(!citizenLoginData.user?.password_hash, 'Password hash is strictly omitted from user response');
    assert(citizenCookie && citizenCookie.includes('um_session='), 'HTTP-only um_session cookie is set');

    // Test 3: Authenticated /api/auth/me with Citizen cookie
    const citizenMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { cookie: citizenCookie },
    });
    const citizenMeData = await citizenMe.json();
    assert(citizenMeData.user?.email === 'citizen@demo.com', 'Session persists and returns current user');

    // Test 4: Citizen fetches own reports
    const citizenIssuesRes = await fetch(`${BASE_URL}/api/issues`, {
      headers: { cookie: citizenCookie },
    });
    const citizenIssues = await citizenIssuesRes.json();
    assert(citizenIssuesRes.status === 200 && Array.isArray(citizenIssues.issues), 'Citizen can fetch own reports');

    // Test 5: Analyze Urban Issue via Multi-Agent pipeline
    console.log('\n🤖 Testing Multi-Agent Analysis Pipeline (Gatekeeper, Specialists, Decision)...');
    const sampleImage = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
    const analyzeRes = await fetch(`${BASE_URL}/api/issues/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: citizenCookie,
      },
      body: JSON.stringify({
        imageBase64: sampleImage,
        zoneId: 't_nagar',
        note: 'Severe asphalt road pothole near junction',
      }),
    });
    const analyzeData = await analyzeRes.json();
    assert(analyzeRes.status === 200, 'Issue analysis endpoint returns 200');
    assert(analyzeData.analysis?.valid === true, 'Gatekeeper accepted valid urban infrastructure');
    assert(analyzeData.analysis?.issue_type === 'road', 'Dominant issue identified as Road');
    assert(analyzeData.analysis?.priority_score > 0, `Priority score computed: ${analyzeData.analysis?.priority_score}/100`);
    assert(analyzeData.analysis?.priority_breakdown?.formula.includes('0.5*'), 'Priority formula breakdown present');
    assert(analyzeData.analysis?.specialist_findings?.road && analyzeData.analysis?.specialist_findings?.waste && analyzeData.analysis?.specialist_findings?.water, 'Parallel findings recorded for Road, Waste, and Water agents');

    // Test 6: Citizen saves analyzed issue
    const createRes = await fetch(`${BASE_URL}/api/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: citizenCookie,
      },
      body: JSON.stringify({
        zone: 't_nagar',
        image_url: sampleImage,
        note: 'Severe asphalt road pothole near junction',
        issue_type: analyzeData.analysis.issue_type,
        severity: analyzeData.analysis.severity,
        confidence: analyzeData.analysis.confidence,
        priority_score: analyzeData.analysis.priority_score,
        priority_breakdown: analyzeData.analysis.priority_breakdown,
        reasoning: analyzeData.analysis.reasoning,
        recommended_actions: analyzeData.analysis.recommended_actions,
        needs_human_review: analyzeData.analysis.needs_human_review,
        specialist_findings: analyzeData.analysis.specialist_findings,
        is_demo: true,
      }),
    });
    const createdData = await createRes.json();
    const createdIssueId = createdData.issue?.id;
    assert(createRes.status === 201 && !!createdIssueId, `Issue report created with ID: ${createdIssueId}`);

    // Test 7: Citizen attempts to review issue -> Must receive 403 Forbidden
    const citizenReviewAttempt = await fetch(`${BASE_URL}/api/issues/${createdIssueId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: citizenCookie,
      },
      body: JSON.stringify({
        action: 'approve',
        decision_notes: 'Unauthorized approval attempt by citizen',
      }),
    });
    assert(citizenReviewAttempt.status === 403, 'Citizens are strictly forbidden (403) from approving issues');

    // Test 8: Login with Demo City Official account
    console.log('\n🏛️ Testing Authority Operations & Role Verification...');
    const officialLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'official@demo.com', password: 'Demo1234' }),
    });
    const officialLoginData = await officialLoginRes.json();
    const officialCookie = officialLoginRes.headers.get('set-cookie');
    assert(officialLoginRes.status === 200 && officialLoginData.user?.role === 'authority', 'Authority login successful with role authority');

    // Test 9: City Official reviews and approves the issue
    const officialReviewRes = await fetch(`${BASE_URL}/api/issues/${createdIssueId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: officialCookie,
      },
      body: JSON.stringify({
        action: 'approve',
        decision_notes: 'Approved for GCC Zone 10 emergency cold-mix dispatch within 4 hours.',
      }),
    });
    const officialReviewData = await officialReviewRes.json();
    assert(officialReviewRes.status === 200, 'Authority review returns 200');
    assert(officialReviewData.issue?.status === 'approved', 'Issue status updated to approved');
    assert(officialReviewData.issue?.decided_by === 'official@demo.com', 'Decision auditor recorded');

    // Test 10: Geospatial Digital Twin Telemetry & Predictive Air Quality
    console.log('\n🗺️ Testing Geospatial Digital Twin & Predictive AQI Module...');
    const twinRes = await fetch(`${BASE_URL}/api/twin/data`, {
      headers: { cookie: officialCookie },
    });
    const twinData = await twinRes.json();
    assert(twinRes.status === 200 && Array.isArray(twinData.zones), 'Digital Twin data returned 6 Chennai zones');
    assert(twinData.air_quality_forecasts?.length === 6, 'Predictive air quality calculated for all 6 zones');
    const tNagarForecast = twinData.air_quality_forecasts.find((f) => f.zone_id === 't_nagar');
    assert(tNagarForecast && tNagarForecast.predicted_24h_aqi > 0, `T. Nagar predicted 24h AQI: ${tNagarForecast?.predicted_24h_aqi} (${tNagarForecast?.risk_level} Risk)`);
    assert(tNagarForecast.mitigation_recommendation.length > 10, 'Actionable GCC mitigation recommendation provided');

    // Test 11: AI Evaluation Dataset
    console.log('\n📊 Testing Model Evaluation Suite & Backtest Dataset...');
    const evalRes = await fetch(`${BASE_URL}/api/eval`, {
      headers: { cookie: officialCookie },
    });
    const evalData = await evalRes.json();
    assert(evalRes.status === 200, 'Evaluation endpoint returns 200 for authority');
    assert(evalData.summary?.accuracy_pct > 80, `Model evaluation accuracy: ${evalData.summary?.accuracy_pct}%`);
    assert(evalData.air_quality_backtest?.length === 14, '14-day air quality backtest historical dataset loaded');

    // Test 12: Authority Signup Protection with AUTHORITY_INVITE_CODE
    console.log('\n🔒 Testing Authority Invite Code Security...');
    const badSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Official',
        email: 'imposter@test.com',
        password: 'Password123',
        role: 'authority',
        invite_code: 'WRONG_CODE',
      }),
    });
    assert(badSignup.status === 403, 'Authority signup without valid invite code rejected with 403');

    const goodSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verified Official',
        email: 'verified.official@chennaicorp.gov.in',
        password: 'Password123',
        role: 'authority',
        invite_code: 'CHENNAI_GCC_2026',
      }),
    });
    assert(goodSignup.status === 201, 'Authority signup with valid invite code accepted with 201');

    console.log(`\n========================================`);
    console.log(`🎉 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
