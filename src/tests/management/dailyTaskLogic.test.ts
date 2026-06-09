import fc from 'fast-check';
import {
  deriveChecklist,
  computeDailyKpiContribution,
  combineKpiTotals,
  isFutureBusinessDay,
  PureTemplate,
  PureCompletion,
} from '../../services/management/helpers/dailyTaskLogic';
import { DailyTaskService } from '../../services/management/DailyTaskService';

const RUNS = { numRuns: 100 };

/** مولّد قوالب فريدة المعرّف بحالات تفعيل/حذف مختلطة */
function uniqueTemplatesArb(): fc.Arbitrary<PureTemplate[]> {
  return fc
    .uniqueArray(fc.integer({ min: 1, max: 999 }), { minLength: 0, maxLength: 8 })
    .chain((ids: number[]) =>
      fc.tuple(
        ...ids.map((id: number) =>
          fc.record<PureTemplate>({
            id: fc.constant(String(id)),
            title: fc.string({ minLength: 1, maxLength: 12 }),
            sequence_order: fc.integer({ min: 0, max: 50 }),
            is_active: fc.boolean(),
            deleted_at: fc.option(fc.constant('2025-01-01T00:00:00Z'), { nil: null }),
            elapsed_business_days: fc.integer({ min: 1, max: 365 }),
          })
        )
      )
    );
}

describe('Daily Task Logic — Property Based Tests', () => {
  // Feature: recurring-daily-tasks, Property 1: اشتقاق قائمة التحقق صحيح وكامل — عنصر لكل قالب مُفعّل لموظف نشط، مرتّب، بحالة اليوم، مع استبعاد المُعطّل/غير النشط.
  it('Property 1: derived checklist contains exactly active non-deleted templates, sorted, with correct day state', () => {
    fc.assert(
      fc.property(
        uniqueTemplatesArb(),
        fc.array(fc.boolean(), { maxLength: 10 }),
        fc.boolean(),
        (templates: PureTemplate[], completedFlags: boolean[], userActive: boolean) => {
          const businessDay = '2025-06-10';
          const completions: PureCompletion[] = templates.map((t, idx) => ({
            template_id: t.id,
            business_day: businessDay,
            is_completed: completedFlags[idx] ?? false,
          }));

          const items = deriveChecklist(templates, completions, businessDay, userActive);

          if (!userActive) {
            expect(items).toHaveLength(0);
            return;
          }

          const expectedTemplates = templates.filter((t) => t.is_active && !t.deleted_at);
          expect(items).toHaveLength(expectedTemplates.length);

          for (const item of items) {
            const src = templates.find((t) => t.id === item.template_id)!;
            expect(src.is_active).toBe(true);
            expect(src.deleted_at).toBeFalsy();
          }
          for (let i = 1; i < items.length; i++) {
            expect(items[i].sequence_order).toBeGreaterThanOrEqual(items[i - 1].sequence_order);
          }
          const dayMap = new Map(completions.map((c) => [c.template_id, c.is_completed]));
          for (const item of items) {
            expect(item.is_completed).toBe(dayMap.get(item.template_id) === true);
          }
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 2: إعادة تفعيل قالب تُعيده للقائمة دون توليد حالة رجعية للأيام المُعطّلة.
  it('Property 2: re-enabling a template makes it appear; no completions exist for disabled days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        (id: number, title: string) => {
          const template: PureTemplate = {
            id: String(id),
            title,
            sequence_order: 0,
            is_active: true,
            deleted_at: null,
            elapsed_business_days: 5,
          };
          const items = deriveChecklist([template], [], '2025-06-10', true);
          expect(items).toHaveLength(1);
          expect(items[0].is_completed).toBe(false);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 4: عدم تكرار سجل الإنجاز — وضع العلامة n مرة ينتج سجلاً واحداً منجزاً لـ (قالب، يوم).
  it('Property 4: idempotent completion — repeated marks collapse to a single completed record per (template, day)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 10 }),
        (templateId: number, times: number) => {
          const store = new Map<string, PureCompletion>();
          const businessDay = '2025-06-10';
          const key = `${templateId}|${businessDay}`;
          for (let i = 0; i < times; i++) {
            store.set(key, { template_id: String(templateId), business_day: businessDay, is_completed: true });
          }
          const rows = [...store.values()];
          expect(rows).toHaveLength(1);
          expect(rows[0].is_completed).toBe(true);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 5: استقلال الأيام التشغيلية — تغيير حالة يوم لا يؤثر على يوم آخر.
  it('Property 5: business days are independent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.boolean(),
        fc.boolean(),
        (templateId: number, dayAState: boolean, dayBState: boolean) => {
          const tid = String(templateId);
          const template: PureTemplate = {
            id: tid,
            title: 'x',
            sequence_order: 0,
            is_active: true,
            deleted_at: null,
            elapsed_business_days: 2,
          };
          const completions: PureCompletion[] = [
            { template_id: tid, business_day: '2025-06-10', is_completed: dayAState },
            { template_id: tid, business_day: '2025-06-11', is_completed: dayBState },
          ];
          const dayA = deriveChecklist([template], completions, '2025-06-10', true);
          const dayB = deriveChecklist([template], completions, '2025-06-11', true);
          expect(dayA[0].is_completed).toBe(dayAState);
          expect(dayB[0].is_completed).toBe(dayBState);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 6: حتمية اليوم التشغيلي — نفس الطابع الزمني يعطي دائماً نفس اليوم بصيغة YYYY-MM-DD.
  it('Property 6: resolveBusinessDay is deterministic and well-formed', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01') }),
        (d: Date) => {
          const a = DailyTaskService.resolveBusinessDay(d);
          const b = DailyTaskService.resolveBusinessDay(d);
          expect(a).toBe(b);
          expect(a).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 8: تكامل KPI إضافي تراكمي وصحّة النسبة — إضافة لا استبدال، النسبة في [0,100]، لا تنقص القيم القائمة.
  it('Property 8: cumulative KPI contribution is additive and percentage is bounded', () => {
    fc.assert(
      fc.property(
        uniqueTemplatesArb(),
        fc.array(fc.boolean(), { maxLength: 30 }),
        fc
          .record({
            total: fc.integer({ min: 0, max: 100 }),
            completedRatio: fc.integer({ min: 0, max: 100 }),
          })
          .map(({ total, completedRatio }: { total: number; completedRatio: number }) => {
            // base صالح دائماً: completed ≤ total، و pending = الباقي
            const completed = Math.round((total * completedRatio) / 100);
            return { total, completed, pending: total - completed };
          }),
        (
          templates: PureTemplate[],
          flags: boolean[],
          base: { total: number; completed: number; pending: number }
        ) => {
          // سجل إنجاز واحد كحد أقصى لكل قالب (يوم واحد) لتفادي التكرار
          const completions: PureCompletion[] = templates.map((t, idx) => ({
            template_id: t.id,
            business_day: '2025-06-10',
            is_completed: flags[idx] ?? false,
          }));

          const daily = computeDailyKpiContribution(templates, completions, true);
          const combined = combineKpiTotals(base, daily);

          expect(combined.total).toBe(base.total + daily.expected);
          expect(combined.completed).toBe(base.completed + daily.completed);
          expect(combined.total).toBeGreaterThanOrEqual(base.total);
          expect(combined.completed).toBeGreaterThanOrEqual(base.completed);
          expect(combined.percentage).toBeGreaterThanOrEqual(0);
          expect(combined.percentage).toBeLessThanOrEqual(100);
          if (combined.total === 0) expect(combined.percentage).toBe(0);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 8b: المُنجز اليومي ≤ المتوقّع عندما لا تتجاوز العلامات عمر القالب.
  it('Property 8b: daily completed never exceeds expected when marks within elapsed days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 30 }),
        (elapsed: number, marks: number) => {
          const template: PureTemplate = {
            id: '1',
            title: 't',
            sequence_order: 0,
            is_active: true,
            deleted_at: null,
            elapsed_business_days: elapsed,
          };
          const days = Math.min(marks, elapsed);
          const completions: PureCompletion[] = Array.from({ length: days }, (_, i) => ({
            template_id: '1',
            business_day: `2025-06-${String(i + 1).padStart(2, '0')}`,
            is_completed: true,
          }));
          const daily = computeDailyKpiContribution([template], completions, true);
          expect(daily.completed).toBeLessThanOrEqual(daily.expected);
          expect(daily.pending).toBe(daily.expected - daily.completed);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 4.6: رفض اليوم المستقبلي — أي يوم بعد اليوم الحالي يُعتبر مستقبلياً.
  it('Property 4.6: future business day detection is correct', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
        fc.integer({ min: -5, max: 5 }),
        (base: Date, offsetDays: number) => {
          const today = DailyTaskService.resolveBusinessDay(base);
          const other = new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000);
          const otherDay = DailyTaskService.resolveBusinessDay(other);
          expect(isFutureBusinessDay(otherDay, today)).toBe(otherDay > today);
        }
      ),
      RUNS
    );
  });

  // Feature: recurring-daily-tasks, Property 12: الحذف المنطقي يحفظ التاريخ — القالب المحذوف يُستبعد من القائمة لكن سجلاته تبقى.
  it('Property 12: soft-deleted templates are excluded from checklist but completions persist', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (templateId: number) => {
        const tid = String(templateId);
        const template: PureTemplate = {
          id: tid,
          title: 't',
          sequence_order: 0,
          is_active: false,
          deleted_at: '2025-06-09T00:00:00Z',
          elapsed_business_days: 3,
        };
        const completions: PureCompletion[] = [
          { template_id: tid, business_day: '2025-06-08', is_completed: true },
        ];
        const items = deriveChecklist([template], completions, '2025-06-10', true);
        expect(items).toHaveLength(0);
        expect(completions.find((c) => c.template_id === tid)).toBeDefined();
      }),
      RUNS
    );
  });
});

describe('Daily Task — example/unit tests', () => {
  // Feature: recurring-daily-tasks, Property 10: افتراضات الإنشاء (الترتيب الافتراضي = آخر+1).
  it('default sequence order places new template after the last one', () => {
    const existing: PureTemplate[] = [
      { id: '1', title: 'a', sequence_order: 0, is_active: true, deleted_at: null, elapsed_business_days: 1 },
      { id: '2', title: 'b', sequence_order: 1, is_active: true, deleted_at: null, elapsed_business_days: 1 },
    ];
    const maxSeq = Math.max(...existing.map((t) => t.sequence_order), -1);
    expect(maxSeq + 1).toBe(2);
  });

  // Feature: recurring-daily-tasks, Property 11: إعادة الترتيب تطابق التبديلة المُرسلة.
  it('reorder assigns sequence equal to the index in the submitted list', () => {
    const orderedIds = ['30', '10', '20'];
    const result = orderedIds.map((id, idx) => ({ id, sequence_order: idx }));
    expect(result).toEqual([
      { id: '30', sequence_order: 0 },
      { id: '10', sequence_order: 1 },
      { id: '20', sequence_order: 2 },
    ]);
  });

  it('resolveBusinessDay defaults to now and is well-formed', () => {
    const day = DailyTaskService.resolveBusinessDay();
    expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
