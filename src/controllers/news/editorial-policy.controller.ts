/**
 * Editorial Policy Controller
 * التحكم بتطبيق سياسات التحرير على الأخبار
 */

import { Request, Response } from 'express';
import { editorialPolicyService } from '../../services/news/editorial-policy.service';
import * as db from '../../config/database';

/**
 * كل السياسات بتستخدم /generate endpoint
 */
function getEndpointForPolicy(_taskType: string): string {
  return 'generate';
}

/**
 * تطبيق سياسة واحدة على نص
 * حالة 1: إرسال queueId + policyId → يجلب الخبر من الداتابيس ويطبق السياسة
 * حالة 2: إرسال text + policyName/policyId → يطبق السياسة على النص مباشرة (بدون تخزين)
 */
export async function applyPolicy(req: Request, res: Response) {
  try {
    const { policyName, policyId, text, queueId, appliedPolicies: previousPolicies } = req.body;

    if (!policyName && !policyId) {
      return res.status(400).json({
        error: 'policyName أو policyId مطلوب',
      });
    }

    if (!text && !queueId) {
      return res.status(400).json({
        error: 'text أو queueId مطلوب',
      });
    }

    // 1. جلب السياسة
    let policyResult;
    if (policyId) {
      policyResult = await db.query(
        'SELECT * FROM editorial_policies WHERE id = $1 AND is_active = TRUE',
        [policyId]
      );
    } else {
      policyResult = await db.query(
        'SELECT * FROM editorial_policies WHERE name = $1 AND is_active = TRUE',
        [policyName]
      );
    }

    if (policyResult.rows.length === 0) {
      return res.status(404).json({
        error: 'السياسة غير موجودة أو غير مفعّلة',
      });
    }

    const policy = policyResult.rows[0];
    const endpoint = getEndpointForPolicy(policy.task_type);
    const isModifying = !!policy.is_modifying;
    const isInspection = !policy.is_modifying;

    // 2. تحديد النص المراد معالجته
    let articleText = text;
    let articleTitle = '';
    let sourceInfo: any = null;

    if (queueId) {
      const queueResult = await db.query(
        `SELECT 
          eq.id as queue_id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.status,
          rd.title,
          rd.content,
          rd.image_url,
          rd.url,
          c.name as category_name,
          mu.name as media_unit_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        WHERE eq.id = $1`,
        [queueId]
      );

      if (queueResult.rows.length === 0) {
        return res.status(404).json({
          error: `الخبر ${queueId} غير موجود في الطابور`,
        });
      }

      const article = queueResult.rows[0];

      if (policy.media_unit_id && parseInt(policy.media_unit_id) !== parseInt(article.media_unit_id)) {
        return res.status(400).json({
          error: `السياسة "${policy.name}" تابعة لوحدة إعلام أخرى (media_unit_id: ${policy.media_unit_id})، الخبر تابع لـ "${article.media_unit_name}" (media_unit_id: ${article.media_unit_id})`,
        });
      }

      // لو الفرونت بعث text (مثلاً بعد تعديل سابق) نستخدمه، وإلا نستخدم محتوى الـ queue
      if (!articleText) {
        articleText = article.content;
      }
      articleTitle = article.title;
      sourceInfo = {
        queueId: article.queue_id,
        rawDataId: article.raw_data_id,
        mediaUnitId: article.media_unit_id,
        title: article.title,
        category: article.category_name,
        mediaUnit: article.media_unit_name,
        status: article.status,
      };
    }

    // 3. تطبيق السياسة
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 [applyPolicy] السياسة المختارة من الداتابيس:`);
    console.log(`  id: ${policy.id}`);
    console.log(`  name: ${policy.name}`);
    console.log(`  task_type: ${policy.task_type}`);
    console.log(`  editor_instructions: ${policy.editor_instructions?.substring(0, 100)}...`);
    console.log(`  injected_vars: ${JSON.stringify(policy.injected_vars)?.substring(0, 200)}...`);
    console.log(`  output_schema: ${JSON.stringify(policy.output_schema)}`);
    console.log(`  prompt_template: ${policy.prompt_template ? 'من الداتابيس' : 'الافتراضي (من الكود)'}`);
    console.log(`  text length: ${articleText?.length}`);
    console.log(`${'='.repeat(80)}\n`);
    const aiResult = await editorialPolicyService.applyPolicy(
      policy.name,
      policy.task_type,
      policy.editor_instructions,
      articleText,
      policy.injected_vars,
      policy.output_schema,
      endpoint,
      policy.prompt_template,
      isModifying
    );

    // 4. بناء الـ response حسب نوع السياسة
    const response: any = {
      policy: {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        taskType: policy.task_type,
        isModifying,
        isInspection,
      },
      executionTime: aiResult.executionTime,
    };

    // معلومات الخبر الأصلي
    if (sourceInfo) {
      response.source = sourceInfo;
    }
    response.originalText = articleText;
    if (articleTitle) {
      response.originalTitle = articleTitle;
    }

    // تتبع السياسات المطبقة — الفرونت يبعثها مع كل طلب تالي
    const appliedPolicies: Array<{ name: string; taskType: string; timestamp: string }> = Array.isArray(previousPolicies) ? [...previousPolicies] : [];
    appliedPolicies.push({
      name: policy.name,
      taskType: policy.task_type,
      timestamp: new Date().toISOString(),
    });
    response.appliedPolicies = appliedPolicies;

    if (isModifying) {
      // سياسة بتعدّل النص → رجّع النص المعدّل
      response.modifiedText = aiResult.modifiedText;
      response.hasChanges = aiResult.hasChanges;

      // بناء معلومات التغييرات من الـ result (بس إذا في بيانات فعلية)
      const r = aiResult.result || {};
      const changesMade = r.changes_made || r.removed_terms || r.replacements || [];
      const totalChanges = r.total_changes || r.total_removals || r.total_replacements
        || (Array.isArray(changesMade) && changesMade.length > 0 ? changesMade.length : 0);

      if (totalChanges > 0 || aiResult.hasChanges) {
        response.changes = {
          changesMade,
          totalChanges,
          disclaimerAdded: r.disclaimer_added || undefined,
          paragraphCount: r.paragraph_count || undefined,
        };
      }
    } else {
      // سياسة فحص بس → رجّع نتيجة الفحص
      response.inspection = aiResult.result || {};
    }

    // دائماً رجّع الـ result الكامل من الـ AI
    response.result = aiResult.result || {};

    res.json(response);
  } catch (error) {
    console.error('❌ خطأ في تطبيق السياسة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * تطبيق سياسات بشكل متسلسل (Sequential Transformation) على الـ Backend
 * السياسة 1 → output1 → السياسة 2 تطبّق على output1 → output2
 * الناتج النهائي يرجع للمحرر ليعدّل عليه ويحفظه
 */
export async function applyPoliciesSequential(req: Request, res: Response) {
  try {
    const { text, queueId, policyIds } = req.body;

    if (!policyIds || !Array.isArray(policyIds) || policyIds.length === 0) {
      return res.status(400).json({
        error: 'policyIds (array) مطلوبة وغير فارغة',
      });
    }

    if (!text && !queueId) {
      return res.status(400).json({
        error: 'text أو queueId مطلوب',
      });
    }

    // 1. تحديد النص الأصلي
    let currentText = text;
    let articleTitle = '';
    let sourceInfo: any = null;

    if (queueId) {
      const queueResult = await db.query(
        `SELECT 
          eq.id as queue_id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.status,
          rd.title,
          rd.content,
          rd.image_url,
          rd.url,
          c.name as category_name,
          mu.name as media_unit_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        WHERE eq.id = $1`,
        [queueId]
      );

      if (queueResult.rows.length === 0) {
        return res.status(404).json({
          error: `الخبر ${queueId} غير موجود في الطابور`,
        });
      }

      const article = queueResult.rows[0];
      if (!currentText) {
        currentText = article.content;
      }
      articleTitle = article.title;
      sourceInfo = {
        queueId: article.queue_id,
        rawDataId: article.raw_data_id,
        mediaUnitId: article.media_unit_id,
        title: article.title,
        category: article.category_name,
        mediaUnit: article.media_unit_name,
        status: article.status,
      };
    }

    // 2. جلب السياسات المعدّلة فقط (is_modifying = true) بالترتيب المطلوب
    const policiesResult = await db.query(
      'SELECT * FROM editorial_policies WHERE id = ANY($1) AND is_active = TRUE AND is_modifying = TRUE',
      [policyIds]
    );

    if (policiesResult.rows.length === 0) {
      return res.status(404).json({
        error: 'لم يتم العثور على سياسات تعديل مفعّلة — التطبيق المتسلسل متاح فقط للسياسات المعدّلة (is_modifying)',
      });
    }

    // ترتيب السياسات حسب الترتيب المرسل من الفرونت (مع تجاهل اللي مش modifying)
    const policyMap = new Map(policiesResult.rows.map((p: any) => [p.id, p]));
    const orderedPolicies: any[] = [];
    const skippedIds: number[] = [];
    for (const id of policyIds) {
      const policy = policyMap.get(id);
      if (policy) {
        orderedPolicies.push(policy);
      } else {
        skippedIds.push(id);
      }
    }

    if (orderedPolicies.length === 0) {
      return res.status(404).json({
        error: 'لم يتم العثور على أي سياسات تعديل مفعّلة بالـ IDs المرسلة',
      });
    }

    // 3. تطبيق السياسات بشكل متسلسل
    const originalText = currentText;
    const steps: Array<{
      policyId: number;
      policyName: string;
      taskType: string;
      inputText: string;
      outputText: string;
      hasChanges: boolean;
      executionTime: number;
      status: 'success' | 'error';
      error?: string;
      result?: any;
    }> = [];

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔗 [Sequential] بدء تطبيق ${orderedPolicies.length} سياسة بشكل متسلسل`);
    console.log(`${'='.repeat(80)}\n`);

    for (let i = 0; i < orderedPolicies.length; i++) {
      const policy = orderedPolicies[i];
      const endpoint = getEndpointForPolicy(policy.task_type);

      console.log(`\n🔗 [Sequential ${i + 1}/${orderedPolicies.length}] تطبيق "${policy.name}" على النص...`);

      const aiResult = await editorialPolicyService.applyPolicy(
        policy.name,
        policy.task_type,
        policy.editor_instructions,
        currentText,
        policy.injected_vars,
        policy.output_schema,
        endpoint,
        policy.prompt_template,
        true // sequential = always modifying
      );

      const step = {
        policyId: policy.id,
        policyName: policy.name,
        taskType: policy.task_type,
        inputText: currentText,
        outputText: aiResult.modifiedText,
        hasChanges: aiResult.hasChanges,
        executionTime: aiResult.executionTime,
        status: aiResult.status,
        error: aiResult.error,
        result: aiResult.result || {},
      };
      steps.push(step);

      // السياسة نجحت — نستخدم الـ output كـ input للسياسة التالية
      if (aiResult.status === 'success' && aiResult.hasChanges) {
        currentText = aiResult.modifiedText;
        console.log(`  ✅ تم التعديل — النص الجديد سيُمرر للسياسة التالية`);
      } else if (aiResult.status === 'error') {
        console.log(`  ⚠️ خطأ في السياسة "${policy.name}" — نكمل بالنص الحالي`);
      } else {
        console.log(`  ℹ️ السياسة "${policy.name}" لم تعدّل النص — نكمل بنفس النص`);
      }
    }

    const totalExecutionTime = steps.reduce((sum, s) => sum + s.executionTime, 0);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔗 [Sequential] انتهى — ${steps.length} سياسة في ${totalExecutionTime}ms`);
    console.log(`${'='.repeat(80)}\n`);

    // 4. بناء الـ response
    const response: any = {
      status: 'success',
      originalText,
      finalText: currentText,
      hasChanges: currentText !== originalText,
      totalExecutionTime,
      policiesApplied: steps.length,
      skippedPolicyIds: skippedIds.length > 0 ? skippedIds : undefined,
      steps: steps.map(s => ({
        policyId: s.policyId,
        policyName: s.policyName,
        taskType: s.taskType,
        hasChanges: s.hasChanges,
        executionTime: s.executionTime,
        status: s.status,
        error: s.error,
        result: s.result,
      })),
    };

    if (sourceInfo) {
      response.source = sourceInfo;
    }
    if (articleTitle) {
      response.originalTitle = articleTitle;
    }

    res.json(response);
  } catch (error) {
    console.error('❌ خطأ في تطبيق السياسات المتسلسلة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * حفظ النص المعدّل بعد التحرير اليدوي من المحرر
 * المحرر يعدّل الـ finalText ويبعثه هنا للحفظ
 */
export async function saveEditedText(req: Request, res: Response) {
  try {
    const { queueId, editedText, appliedPolicies } = req.body;

    if (!queueId || !editedText) {
      return res.status(400).json({
        error: 'queueId و editedText مطلوبة',
      });
    }

    // تحديث الخبر في editorial_queue بالنص المعدّل
    const result = await db.query(
      `UPDATE editorial_queue 
       SET edited_content = $1, 
           status = 'edited', 
           applied_policies = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [editedText, JSON.stringify(appliedPolicies || []), queueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `الخبر ${queueId} غير موجود في الطابور`,
      });
    }

    res.json({
      status: 'success',
      message: 'تم حفظ النص المعدّل بنجاح',
      queueId,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (error) {
    console.error('❌ خطأ في حفظ النص المعدّل:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * تطبيق سلسلة من السياسات (Pipeline) - من جهة الـ Frontend
 * المحرر يختار السياسات بالترتيب، والـ Frontend يطبقها واحدة تلو الأخرى
 */
export async function applyPoliciesPipeline(req: Request, res: Response) {
  try {
    const { text, policyNames } = req.body;

    if (!text || !policyNames || !Array.isArray(policyNames)) {
      return res.status(400).json({
        error: 'text و policyNames (array) مطلوبة',
      });
    }

    // جلب السياسات من الـ database
    const policiesResult = await db.query(
      'SELECT * FROM editorial_policies WHERE name = ANY($1) AND is_active = TRUE ORDER BY name',
      [policyNames]
    );

    if (policiesResult.rows.length === 0) {
      return res.status(404).json({
        error: 'لم يتم العثور على أي سياسات مفعّلة',
      });
    }

    // تحويل السياسات للصيغة المطلوبة مع الـ endpoint الصحيح
    const policies = policiesResult.rows.map((policy: any) => ({
      name: policy.name,
      taskType: policy.task_type,
      editorInstructions: policy.editor_instructions,
      injectedVars: policy.injected_vars,
      outputSchema: policy.output_schema,
      endpoint: getEndpointForPolicy(policy.task_type),
    }));

    // إرجاع السياسات مع معلومات الـ endpoints
    // الـ Frontend هو اللي يطبقها واحدة تلو الأخرى
    res.json({
      status: 'success',
      message: 'السياسات جاهزة للتطبيق من جهة الـ Frontend',
      originalText: text,
      policies: policies.map((p: any) => ({
        name: p.name,
        taskType: p.taskType,
        endpoint: p.endpoint,
        description: `تطبيق سياسة ${p.name}`,
      })),
      instructions: {
        step1: 'طبّق السياسات بالترتيب المطلوب',
        step2: 'استخدم النص المعدّل من السياسة السابقة كـ input للسياسة التالية',
        step3: 'احفظ النص النهائي بعد تطبيق جميع السياسات',
      },
    });
  } catch (error) {
    console.error('❌ خطأ في جلب السياسات:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * جلب جميع السياسات المفعّلة
 */
export async function getPolicies(req: Request, res: Response) {
  try {
    const mediaUnitId = req.query.media_unit_id;
    
    let sql = 'SELECT id, name, description, task_type, media_unit_id, is_active, is_modifying FROM editorial_policies WHERE is_active = TRUE';
    const params: any[] = [];
    
    if (mediaUnitId) {
      params.push(parseInt(mediaUnitId as string));
      sql += ` AND media_unit_id = $${params.length}`;
    }
    sql += ' ORDER BY name';
    
    const result = await db.query(sql, params);

    const policies = result.rows.map((p: any) => ({
      ...p,
      isModifying: !!p.is_modifying,
    }));

    res.json({
      status: 'success',
      count: policies.length,
      policies,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب السياسات:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * جلب سياسة واحدة بالتفاصيل
 */
export async function getPolicyDetails(req: Request, res: Response) {
  try {
    const { policyName } = req.params;

    const result = await db.query(
      'SELECT * FROM editorial_policies WHERE name = $1',
      [policyName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `السياسة ${policyName} غير موجودة`,
      });
    }

    res.json({
      status: 'success',
      policy: result.rows[0],
    });
  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل السياسة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * تحديث سياسة (editor_instructions و injected_vars)
 */
export async function updatePolicy(req: Request, res: Response) {
  try {
    const { policyName } = req.params;
    const { editorInstructions, injectedVars } = req.body;

    if (!editorInstructions && !injectedVars) {
      return res.status(400).json({
        error: 'يجب تحديد editorInstructions أو injectedVars على الأقل',
      });
    }

    // تحديث السياسة
    const updateQuery = `
      UPDATE editorial_policies 
      SET 
        ${editorInstructions ? 'editor_instructions = $2,' : ''}
        ${injectedVars ? 'injected_vars = $3,' : ''}
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE name = $1
      RETURNING *
    `;

    const params = [policyName];
    if (editorInstructions) params.push(editorInstructions);
    if (injectedVars) params.push(JSON.stringify(injectedVars));

    const result = await db.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `السياسة ${policyName} غير موجودة`,
      });
    }

    res.json({
      status: 'success',
      message: 'تم تحديث السياسة بنجاح',
      policy: result.rows[0],
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث السياسة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * إنشاء سياسة جديدة
 * 
 * المطلوب: name, editorInstructions
 * اختياري: description, taskType, isModifying, injectedVars, mediaUnitId
 * 
 * - output_schema يتحدد تلقائياً حسب isModifying (الموحد)
 * - prompt_template يستخدم الافتراضي من الـ service
 * - injectedVars لازم يكون JSON object صحيح إذا تم إرساله
 */
export async function createPolicy(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      taskType,
      editorInstructions,
      injectedVars,
      isModifying,
      mediaUnitId,
    } = req.body;

    // --- Validation ---
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'name مطلوب (string غير فارغ)',
      });
    }

    if (!editorInstructions || typeof editorInstructions !== 'string' || !editorInstructions.trim()) {
      return res.status(400).json({
        error: 'editorInstructions مطلوب (string غير فارغ) — تعليمات المحرر للـ AI',
      });
    }

    // التحقق من injectedVars — لازم يكون JSON object إذا تم إرساله
    if (injectedVars !== undefined && injectedVars !== null) {
      if (typeof injectedVars !== 'object' || Array.isArray(injectedVars)) {
        return res.status(400).json({
          error: 'injectedVars لازم يكون JSON object (مثال: {"banned_words": ["كلمة1", "كلمة2"], "replacement_map": {"قديم": "جديد"}})',
        });
      }

      // التحقق إنو القيم داخل الـ object صالحة (string, array, object, number, boolean)
      for (const [key, value] of Object.entries(injectedVars)) {
        if (value === undefined || value === '') {
          return res.status(400).json({
            error: `injectedVars["${key}"] قيمة فارغة — كل مفتاح لازم يكون عنده قيمة`,
          });
        }
      }
    }

    // تحديد isModifying — افتراضي true
    const policyIsModifying = isModifying !== undefined ? !!isModifying : true;

    // output_schema الموحد حسب النوع — تلقائي
    const outputSchema = policyIsModifying
      ? { modified_text: 'string', changes: 'array', total_changes: 'number', notes: 'string' }
      : { status: 'string', issues: 'array', summary: 'string', details: 'object' };

    const DEFAULT_PROMPT = `أنت محرر صحفي محترف . نفّذ التعليمات التالية بدقة على النص المعطى.## التعليمات:{{editor_instructions}}## البيانات المرجعية:{{injected_vars}}## النص:{{text}}## صيغة الإخراج:{{output_schema}}`;

    const result = await db.query(
      `INSERT INTO editorial_policies 
        (media_unit_id, name, description, task_type, editor_instructions, prompt_template, injected_vars, output_schema, is_active, is_modifying, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, 1)
       RETURNING *`,
      [
        mediaUnitId || null,
        name.trim(),
        description || null,
        taskType || 'custom',
        editorInstructions.trim(),
        DEFAULT_PROMPT,
        injectedVars ? JSON.stringify(injectedVars) : null,
        JSON.stringify(outputSchema),
        policyIsModifying,
      ]
    );

    res.status(201).json({
      status: 'success',
      message: 'تم إنشاء السياسة بنجاح',
      policy: result.rows[0],
    });
  } catch (error) {
    console.error('❌ خطأ في إنشاء السياسة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}


/**
 * حذف سياسة تحريرية
 */
export async function deletePolicy(req: Request, res: Response) {
  try {
    const { policyName } = req.params;

    if (!policyName || typeof policyName !== 'string' || !policyName.trim()) {
      return res.status(400).json({
        error: 'policyName مطلوب',
      });
    }

    // التحقق من وجود السياسة
    const checkResult = await db.query(
      'SELECT id, name FROM editorial_policies WHERE name = $1',
      [policyName]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'السياسة غير موجودة',
      });
    }

    // حذف السياسة
    const deleteResult = await db.query(
      'DELETE FROM editorial_policies WHERE name = $1 RETURNING id, name',
      [policyName]
    );

    res.json({
      status: 'success',
      message: 'تم حذف السياسة بنجاح',
      policy: deleteResult.rows[0],
    });
  } catch (error) {
    console.error('❌ خطأ في حذف السياسة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}
