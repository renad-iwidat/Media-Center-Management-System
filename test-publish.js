// تست النشر على الموقع الخارجي — لتشخيص مشكلة 500

async function test() {
  const token = process.env.HGAZA_API_TOKEN || '<HGAZA_API_TOKEN>';  // لا ترفع التوكن الحقيقي على git
  const apiUrl = 'https://hgaza.nn.ps/api/v1/automation/news';
  
  // تست: محتوى طويل مع image_url (مثل الأخبار الحقيقية)
  console.log('\n--- Test: Long content + image_url ---');
  const longContent = 'مونديال 2026: الإيرانيون يودعون لاعبي المنتخب.. تأهل تاريخي. ' + 'هذا محتوى طويل يحاكي الأخبار الحقيقية. '.repeat(50);
  
  const formData = new FormData();
  formData.append('title', 'مونديال 2026: الإيرانيون يودعون لاعبي المنتخب.. تأهل تاريخي');
  formData.append('content', longContent);
  formData.append('category_id', '7');
  formData.append('tags', 'رياضة,مونديال,إيران');
  formData.append('keywords', 'رياضة,مونديال,إيران');
  formData.append('image_url', 'https://example.com/image.jpg');
  
  const res1 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  console.log('Status:', res1.status);
  console.log('Body:', await res1.text());

  // تست: محتوى مع أحرف خاصة (quotes, newlines)
  console.log('\n--- Test: Special chars ---');
  const formData2 = new FormData();
  formData2.append('title', 'قضيّة "أوبن إيه آي": هيئة المحلّفين تقترب من حسم نزاع');
  formData2.append('content', 'محتوى يحتوي على "علامات تنصيص" و\nأسطر جديدة\nوأحرف خاصة: <>&');
  formData2.append('category_id', '6');
  formData2.append('tags', 'تكنولوجيا');
  formData2.append('keywords', 'تكنولوجيا');
  
  const res2 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: formData2,
  });
  console.log('Status:', res2.status);
  console.log('Body:', await res2.text());

  // تست: image_url حقيقي (رابط صورة فعلي)
  console.log('\n--- Test: Real image URL ---');
  const formData3 = new FormData();
  formData3.append('title', 'تست مع صورة حقيقية');
  formData3.append('content', 'محتوى تجريبي مع رابط صورة حقيقي من الإنترنت');
  formData3.append('category_id', '7');
  formData3.append('tags', 'تست');
  formData3.append('keywords', 'تست');
  formData3.append('image_url', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg');
  
  const res3 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: formData3,
  });
  console.log('Status:', res3.status);
  console.log('Body:', await res3.text());

  // تست: بدون image_url بس مع image_url فاضي
  console.log('\n--- Test: Empty image_url ---');
  const formData4 = new FormData();
  formData4.append('title', 'تست بدون صورة');
  formData4.append('content', 'محتوى بدون صورة');
  formData4.append('category_id', '7');
  formData4.append('tags', 'تست');
  formData4.append('keywords', 'تست');
  formData4.append('image_url', '');
  
  const res4 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: formData4,
  });
  console.log('Status:', res4.status);
  console.log('Body:', await res4.text());
}

test().catch(e => console.error('Error:', e.message));
