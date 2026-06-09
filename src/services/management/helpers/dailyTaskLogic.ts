/**
 * منطق دالّي خالص للمهام اليومية الثابتة — معزول عن قاعدة البيانات لسهولة اختباره.
 * يعكس بدقّة دلالات استعلامات الموديل/الـ KPI (اشتقاق القائمة، الحساب التراكمي).
 */

export interface PureTemplate {
  id: string;
  title: string;
  sequence_order: number;
  is_active: boolean;
  deleted_at?: string | null;
  /** عدد الأيام التشغيلية المنقضية منذ إنشاء/تفعيل القالب حتى اليوم (شامل) */
  elapsed_business_days: number;
}

export interface PureCompletion {
  template_id: string;
  business_day: string;
  is_completed: boolean;
}

export interface PureChecklistItem {
  template_id: string;
  title: string;
  sequence_order: number;
  is_completed: boolean;
}

/**
 * اشتقاق قائمة التحقق ليوم تشغيلي:
 * عنصر واحد لكل قالب مُفعّل (غير محذوف) لموظف نشط، مرتّب بـ sequence_order،
 * وحالته من سجل إنجاز ذلك اليوم (أو "غير مُنجز" عند الغياب).
 * Mirrors DailyTaskCompletionModel.getChecklist.
 */
export function deriveChecklist(
  templates: PureTemplate[],
  completions: PureCompletion[],
  businessDay: string,
  userActive: boolean
): PureChecklistItem[] {
  if (!userActive) return [];

  const dayCompletions = new Map<string, boolean>();
  for (const c of completions) {
    if (c.business_day === businessDay) {
      dayCompletions.set(c.template_id, c.is_completed);
    }
  }

  return templates
    .filter((t) => t.is_active && !t.deleted_at)
    .sort((a, b) => a.sequence_order - b.sequence_order || a.id.localeCompare(b.id))
    .map((t) => ({
      template_id: t.id,
      title: t.title,
      sequence_order: t.sequence_order,
      is_completed: dayCompletions.get(t.id) === true,
    }));
}

/**
 * مساهمة المهام اليومية التراكمية في KPI.
 * completed = إجمالي علامات الإنجاز عبر كل الأيام لقوالب غير محذوفة.
 * expected  = مجموع الأيام المنقضية لكل قالب نشط (غير محذوف) لموظف نشط.
 * Mirrors countCompletedForUser + countExpectedItemsForUser.
 */
export function computeDailyKpiContribution(
  templates: PureTemplate[],
  completions: PureCompletion[],
  userActive: boolean
): { completed: number; expected: number; pending: number } {
  if (!userActive) return { completed: 0, expected: 0, pending: 0 };

  // العناصر تُحتسب فقط للقوالب النشطة غير المحذوفة — بسطاً ومقاماً معاً للحفاظ على completed ≤ expected.
  const countedTemplateIds = new Set(
    templates.filter((t) => t.is_active && !t.deleted_at).map((t) => t.id)
  );
  const completed = completions.filter(
    (c) => c.is_completed && countedTemplateIds.has(c.template_id)
  ).length;

  const expected = templates
    .filter((t) => t.is_active && !t.deleted_at)
    .reduce((sum, t) => sum + Math.max(t.elapsed_business_days, 0), 0);

  const pending = Math.max(expected - completed, 0);
  return { completed, expected, pending };
}

/**
 * دمج مساهمة المهام اليومية مع أعداد المصادر القائمة (إضافة لا استبدال)
 * وحساب نسبة الإنجاز المحصورة في [0,100].
 */
export function combineKpiTotals(
  base: { total: number; completed: number; pending: number },
  daily: { completed: number; expected: number; pending: number }
): { total: number; completed: number; pending: number; percentage: number } {
  const total = base.total + daily.expected;
  const completed = base.completed + daily.completed;
  const pending = base.pending + daily.pending;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending, percentage };
}

/**
 * هل اليوم التشغيلي المطلوب في المستقبل بالنسبة لليوم الحالي؟ (مقارنة نصية YYYY-MM-DD آمنة)
 */
export function isFutureBusinessDay(requestedDay: string, todayDay: string): boolean {
  return requestedDay > todayDay;
}
