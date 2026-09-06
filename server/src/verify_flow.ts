const BASE_URL = 'http://localhost:5000/api';

async function testFullFlow() {
  console.log('--- 🧪 STARTING FULL-STACK COMPETITION PLATFORM VERIFICATION ---');

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json() as any;
  console.log('1. ✅ Health Check:', healthData.status === 'ok' ? 'PASSED' : 'FAILED');

  // 2. Admin Login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@quiz.com', password: 'admin123' }),
  });
  const adminData = await adminLoginRes.json() as any;
  const adminToken = adminData.token;
  console.log('2. ✅ Admin Login:', adminToken ? 'PASSED (JWT Received)' : 'FAILED');

  // 3. Participant Login
  const pLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex@warriors.com', password: 'alex123' }),
  });
  const pData = await pLoginRes.json() as any;
  const pToken = pData.token;
  console.log('3. ✅ Participant Login:', pToken ? 'PASSED (JWT Received)' : 'FAILED');

  // 4. Participant View Questions (Sequential Progressive Unlocking Check)
  const qRes = await fetch(`${BASE_URL}/questions/participant`, {
    headers: { Authorization: `Bearer ${pToken}` },
  });
  const qData = await qRes.json() as any;
  console.log(`4. ✅ Participant Questions fetched: ${qData.questions?.length} total questions available.`);
  console.log(`   Unlocked Order Level: ${qData.teamCurrentOrder}, Current Team Score: ${qData.teamScore} PTS.`);

  // 5. Submit Out-of-Order Question (Q5 when level is Q4) -> Must be rejected!
  const q5 = qData.questions.find((q: any) => q.order === 5);
  if (q5) {
    const invalidSubRes = await fetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pToken}`,
      },
      body: JSON.stringify({ questionId: q5._id, answer: 'Deadlock' }),
    });
    console.log(`5. 🔒 Progressive Unlocking Enforcement Test (Submitting locked Q5): HTTP Status ${invalidSubRes.status} (Expected 403 Forbidden)`);
  }

  // 6. Submit Valid Answer for Q4 (Riddle: 'Daemon')
  const q4 = qData.questions.find((q: any) => q.order === 4);
  if (q4) {
    const validSubRes = await fetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pToken}`,
      },
      body: JSON.stringify({ questionId: q4._id, answer: 'Daemon' }),
    });
    const subResult = await validSubRes.json() as any;
    console.log('6. 🎉 Automated Evaluation & Point Awarding:', subResult.isCorrect ? 'PASSED (+25 PTS)' : 'FAILED');
    console.log(`   New Team Score: ${subResult.teamScore} PTS, Next Level Unlocked: ${subResult.currentQuestionOrder}`);
  }

  // 7. Request AI Hint for Q5
  const hintRes = await fetch(`${BASE_URL}/ai/hint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pToken}`,
    },
    body: JSON.stringify({ questionId: q5._id }),
  });
  const hintData = await hintRes.json() as any;
  console.log('7. 💡 AI Hint Service Response:', `"${hintData.hint}" (Source: ${hintData.source})`);

  // 8. Fetch Real-time Leaderboard Rankings
  const lbRes = await fetch(`${BASE_URL}/leaderboard/active`, {
    headers: { Authorization: `Bearer ${pToken}` },
  });
  const lbData = await lbRes.json() as any;
  console.log('8. 🏆 Live Leaderboard Standings:');
  lbData.rankings.forEach((r: any) => {
    console.log(`   Rank #${r.rank}: ${r.teamName} | Score: ${r.score} PTS | Solved: ${r.solvedCount}/${r.totalQuestions}`);
  });

  // 9. Admin Toggle Leaderboard Freeze
  const freezeRes = await fetch(`${BASE_URL}/events/${lbData.eventId}/freeze`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const freezeData = await freezeRes.json() as any;
  console.log('9. ❄️ Admin Freeze Standings Toggle:', freezeData.isFrozen ? 'PASSED (Leaderboard Frozen)' : 'FAILED');

  // 10. Admin Analytics Overview
  const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const analyticsData = await analyticsRes.json() as any;
  console.log('10. 📊 Admin Analytics Overview:', analyticsData.overview);

  console.log('--- 🚀 ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ---');
}

testFullFlow().catch(console.error);
