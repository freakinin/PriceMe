import { useTour } from './TourContext';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';

export function AppTour() {
  const { isActive, currentStep, activeSteps } = useTour();

  if (!isActive) return null;

  const step = activeSteps[currentStep];

  return (
    <TourSpotlight targetId={step?.targetId ?? null}>
      <TourTooltip />
    </TourSpotlight>
  );
}
