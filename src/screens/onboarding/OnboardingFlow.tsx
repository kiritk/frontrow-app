import React, { useState } from 'react';
import EventTypeStep, { EventTypeValue } from './EventTypeStep';

export interface OnboardingData {
  eventType: EventTypeValue | null;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ eventType: null });

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  if (step === 0) {
    return (
      <EventTypeStep
        value={data.eventType}
        onChange={(v) => setData((d) => ({ ...d, eventType: v }))}
        onContinue={goNext}
      />
    );
  }

  // No further steps yet — finish the flow.
  onComplete(data);
  return null;
}
