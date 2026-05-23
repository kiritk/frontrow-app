import React, { useState } from 'react';
import EventTypeStep, { EventTypeValue } from './EventTypeStep';
import DetailsStep, { DetailsData } from './DetailsStep';

export interface OnboardingData {
  eventType: EventTypeValue | null;
  details: DetailsData;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

const emptyDetails: DetailsData = {
  sportType: null,
  homeTeam: null,
  awayTeam: null,
  eventName: '',
  venue: '',
  selectedCity: null,
  eventDate: null,
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventTypeValue | null>(null);
  const [details, setDetails] = useState<DetailsData>(emptyDetails);

  if (step === 0) {
    return (
      <EventTypeStep
        value={eventType}
        onChange={setEventType}
        onContinue={() => setStep(1)}
      />
    );
  }

  if (step === 1 && eventType) {
    return (
      <DetailsStep
        eventType={eventType}
        value={details}
        onChange={setDetails}
        onBack={() => setStep(0)}
        onContinue={() => {
          onComplete({ eventType, details });
        }}
      />
    );
  }

  return null;
}
