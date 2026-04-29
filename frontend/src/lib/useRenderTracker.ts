/**
 * useRenderTracker - Hook لمراقبة إعادة التصيير في وضع التطوير
 * يساعد في تشخيص مشاكل الأداء وإعادة التصيير اللانهائي
 */
import { useEffect, useRef } from 'react';

export function useRenderTracker(componentName: string, props?: any) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [RENDER-TRACKER] ${componentName} rendered ${renderCount.current} times`);
      
      // تحذير إذا تم إعادة التصيير أكثر من 10 مرات
      if (renderCount.current > 10) {
        console.warn(`⚠️ [RENDER-TRACKER] ${componentName} has rendered ${renderCount.current} times - possible infinite loop!`);
      }
      
      // مقارنة الـ props إذا تم تمريرها
      if (props && prevProps.current) {
        const propsChanged = JSON.stringify(props) !== JSON.stringify(prevProps.current);
        if (propsChanged) {
          console.log(`📝 [RENDER-TRACKER] ${componentName} props changed:`, {
            previous: prevProps.current,
            current: props
          });
        }
      }
      
      prevProps.current = props;
    }
  });

  // إعادة تعيين العداد كل 30 ثانية لتجنب التراكم
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (renderCount.current > 0) {
        console.log(`🔄 [RENDER-TRACKER] Resetting render count for ${componentName} (was ${renderCount.current})`);
        renderCount.current = 0;
      }
    }, 30000);

    return () => clearInterval(resetInterval);
  }, [componentName]);

  return renderCount.current;
}

/**
 * Hook لمراقبة useEffect وتشخيص المشاكل
 */
export function useEffectTracker(effectName: string, dependencies: any[]) {
  const runCount = useRef(0);
  const prevDeps = useRef(dependencies);

  useEffect(() => {
    runCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 [EFFECT-TRACKER] ${effectName} ran ${runCount.current} times`);
      
      // تحذير إذا تم تشغيل useEffect أكثر من 5 مرات
      if (runCount.current > 5) {
        console.warn(`⚠️ [EFFECT-TRACKER] ${effectName} has run ${runCount.current} times - check dependencies!`);
      }
      
      // مقارنة الـ dependencies
      if (prevDeps.current) {
        const depsChanged = JSON.stringify(dependencies) !== JSON.stringify(prevDeps.current);
        if (depsChanged) {
          console.log(`📝 [EFFECT-TRACKER] ${effectName} dependencies changed:`, {
            previous: prevDeps.current,
            current: dependencies
          });
        }
      }
      
      prevDeps.current = dependencies;
    }
  }, dependencies);

  return runCount.current;
}