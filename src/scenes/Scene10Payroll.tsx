import { SceneFrame } from '@/components/scene';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { PayrollView } from './s10/PayrollView';

/**
 * 10 · Payroll & HR Budget — плановый HR-бюджет этапа 1 (src/data/hr.ts):
 * кольцевая диаграмма статей с переключателем «Месяц / Год», карточки статей,
 * состав дополнительных HR-расходов и допущения расчёта.
 */
export default function Scene10Payroll() {
  const compact = useIsCompact();
  return (
    <SceneFrame justify="center">
      <PayrollView compact={compact} />
    </SceneFrame>
  );
}
