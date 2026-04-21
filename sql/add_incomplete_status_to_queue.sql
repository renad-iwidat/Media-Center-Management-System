-- ═══════════════════════════════════════════════════════════════════════
-- لا حاجة لأي migration!
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- editorial_queue.status هو من نوع TEXT (مش enum)
-- يعني نقدر نحط أي قيمة مباشرة بدون تعديل على الداتابيس
--
-- الحالات الجديدة:
--   'pending'    — وصل للطابور، بانتظار قرار
--   'incomplete' — الخبر ناقص، محتاج تدخل المحرر  ← جديد
--   'in_review'  — المحرر شغّال عليه
--   'approved'   — موافق، جاهز للنشر
--   'rejected'   — مرفوض
--
-- ═══════════════════════════════════════════════════════════════════════

-- (اختياري) تحديث الأخبار الناقصة الموجودة حالياً في raw_data
-- لإدخالها في editorial_queue بحالة 'incomplete'
-- يمكن تشغيل الفلو من جديد بدلاً من هذا الـ query

-- عرض الأخبار الناقصة الحالية التي لم تدخل الطابور بعد
SELECT 
  rd.id,
  rd.title,
  rd.is_incomplete,
  rd.fetch_status,
  COUNT(eq.id) as queue_entries
FROM raw_data rd
LEFT JOIN editorial_queue eq ON rd.id = eq.raw_data_id
WHERE rd.is_incomplete = true
GROUP BY rd.id, rd.title, rd.is_incomplete, rd.fetch_status
ORDER BY rd.id;
