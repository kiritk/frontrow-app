import React, { useState } from 'react';
import EventTypeStep, { EventTypeValue } from './EventTypeStep';
import DetailsStep, { DetailsData } from './DetailsStep';
import PhotosStep from './PhotosStep';
import ConfirmationStep from './ConfirmationStep';

export interface OnboardingData {
  eventType: EventTypeValue | null;
  details: DetailsData;
  photos: string[];
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
  const [photos, setPhotos] = useState<string[]>([]);

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
        onContinue={() => setStep(2)}
      />
    );
  }

  if (step === 2 && eventType) {
    return (
      <PhotosStep
        photos={photos}
        eventType={eventType}
        sportType={details.sportType}
        homeStadiumImage={details.homeTeam?.stadiumImage}
        onChange={setPhotos}
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
        onSkip={() => {
          setPhotos([]);
          setStep(3);
        }}
      />
    );
  }

  if (step === 3 && eventType) {
    return (
      <ConfirmationStep
        eventType={eventType}
        details={details}
        photos={photos}
        onBack={() => setStep(2)}
        onAddExperience={() => onComplete({ eventType, details, photos })}
      />
    );
  }

  return null;
}
