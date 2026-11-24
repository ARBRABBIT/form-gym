"use client";
import OnboardingScale from "./onboarding-scale";
export type OnboardingArtwork =
  | "goals"
  | "challenge"
  | "weight"
  | "habits"
  | "wearable"
  | "profile"
  | "complete"
  | "signup"
  | "login";
export const setupArtwork: OnboardingArtwork[] = [
  "goals",
  "challenge",
  "weight",
  "habits",
  "wearable",
  "profile",
];

/** Shared mobile sizing/material treatment, with a distinct object for each task. */
export default function OnboardingIllustration({
  variant,
  weight = "",
}: {
  variant: OnboardingArtwork;
  weight?: string;
}) {
  if (variant === "weight")
    return (
      <OnboardingScale
        weight={weight}
        className="onboarding-illustration illustration-weight"
      />
    );
  return (
    <div
      className={`onboarding-illustration illustration-${variant}`}
      aria-hidden="true"
      data-illustration={variant}
    >
      <img
        src={`/images/onboarding-${variant === "login" ? "login-v2" : variant}.webp`}
        width={480}
        height={480}
        alt=""
        draggable={false}
      />
    </div>
  );
}
