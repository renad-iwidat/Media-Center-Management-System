// Test to verify date formatting works correctly
const testDates = [
  "2026-05-07T00:00:00.000Z",
  "2026-04-28T08:57:21.267154Z",
  "2026-04-29T09:47:12.110981Z",
  new Date("2026-05-07T00:00:00.000Z"),
  new Date("2026-04-28T08:57:21.267154Z"),
];

console.log('🔍 اختبار تنسيق التواريخ في الـ Frontend...\n');

testDates.forEach((date, idx) => {
  try {
    const d = new Date(date);
    const formatted = d.toLocaleDateString('en-CA'); // yyyy-MM-dd format
    console.log(`${idx + 1}. ${date}`);
    console.log(`   ✅ Formatted: ${formatted}\n`);
  } catch (error) {
    console.log(`${idx + 1}. ${date}`);
    console.log(`   ❌ Error: ${error}\n`);
  }
});

console.log('✅ انتهى الاختبار!');
