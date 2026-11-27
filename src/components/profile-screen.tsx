"use client";

import { useState } from "react";
import type { ScreenProps } from "./journal-app";
import { TODAY } from "@/lib/model";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  Flag,
  Scale,
  Settings2,
  ShieldCheck,
  Target,
  Watch,
} from "./icons";
import { Button, Field, PageHeading, Section, Sheet } from "./ui";
import WearableConnect from "./wearable-connect";
import { MorningReminders } from "./health-checkins";
import {useUnsavedGuard} from "./workflow-ui";
import {MeasurementSharing} from "./member-studio";

const goals = ["Lose weight", "Maintain weight", "Gain weight"];

export default function ProfileScreen({
  data,
  update,
  navigate,
  onSignOut,
  persistent = false,
}: ScreenProps & { onSignOut: () => void; persistent?: boolean }) {
  const [dialog, setDialog] = useState<"edit" | "devices" | "reminders" | null>(
    null,
  );
  const [draft, setDraft] = useState(data.profile);
  const [error, setError] = useState("");
  const name = data.profile.Name?.trim() || "Your profile";
  const initials =
    data.profile.Name?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "You";
  const latestWeight =
    [...data.weights]
      .filter((entry) => entry.date <= TODAY && Number(entry.weight) > 0)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight ||
    data.profile["Starting weight (kg)"];
  const workouts = Object.keys(data.logs).filter(
    (key) => key.startsWith("alex:") && key.slice(5) <= TODAY,
  ).length;
  const close = () => setDialog(null);
  const unsavedProfile=useUnsavedGuard(dialog === "edit" && JSON.stringify(draft)!==JSON.stringify(data.profile));

  return (
    <div className="profile-page">
      {unsavedProfile}
      <PageHeading
        title="My profile"
        description="Your details, goals, and connected services."
        back={() => navigate("overview")}
      />
      <section className="profile-hero" aria-label="Your profile">
        <div className="profile-cover" aria-hidden="true" />
        <div className="profile-identity">
          <span className="profile-portrait" aria-hidden="true">
            {initials}
          </span>
          <span className="profile-mode">
            {data.sampleData ? "Sample journal" : "Personal journal"}
          </span>
          <h2>{name}</h2>
          <p>{data.account?.email || "Your training & wellness journal"}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft({ ...data.profile });
              setError("");
              setDialog("edit");
            }}
          >
            <Settings2 size={16} /> Edit profile
          </Button>
        </div>
        <dl className="profile-vitals">
          <div>
            <dt>Latest weight</dt>
            <dd>
              {latestWeight || "—"}
              {latestWeight && <small>kg</small>}
            </dd>
          </div>
          <div>
            <dt>Height</dt>
            <dd>
              {data.profile["Height (cm)"] || "—"}
              {data.profile["Height (cm)"] && <small>cm</small>}
            </dd>
          </div>
          <div>
            <dt>My goal</dt>
            <dd className="profile-goal-value">
              {data.profile["My Goal"] || "Not set"}
            </dd>
          </div>
        </dl>
      </section>

    <Section title="Your studio">
      <div className="studio-flows workflow-actions">
        <button className="workflow-secondary" onClick={()=>navigate("membership")}>Membership & receipts</button>
        <button className="workflow-secondary" onClick={()=>navigate("classes")}>Classes & bookings</button>
        <button className="workflow-secondary" onClick={()=>navigate("attendance")}>Studio pass</button>
        <button className="workflow-secondary" onClick={()=>navigate("meal-plan")}>Nutrition plan & sharing</button>
        <button className="workflow-secondary" onClick={()=>navigate("feedback")}>Coach feedback</button>
        <button className="workflow-secondary" onClick={()=>navigate("inbox")}>Notifications</button>
      </div>
    </Section>
    <MeasurementSharing data={data} update={update} navigate={navigate} date={TODAY} setDate={()=>{}}/>
      <div className="profile-sections">
        <div>
          <Section title="Your practice" className="profile-practice">
            <div className="profile-practice-grid">
              <div>
                <BookOpen size={19} />
                <strong>{workouts}</strong>
                <span>Workout logs</span>
              </div>
              <div>
                <Target size={19} />
                <strong>{data.habits.length}</strong>
                <span>Habits tracked</span>
              </div>
              <div>
                <Flag size={19} />
                <strong>
                  {data.challenge.length}
                  <small>/100</small>
                </strong>
                <span>Challenge days</span>
              </div>
            </div>
          </Section>
          <Section title="Your progress">
            <div className="profile-links">
              <button onClick={() => navigate("results")}>
                <span className="profile-link-icon">
                  <Target />
                </span>
                <span>
                  <strong>Starting point & results</strong>
                  <small>Measurements and body comparisons</small>
                </span>
                <ArrowUpRight />
              </button>
              <button onClick={() => navigate("weight")}>
                <span className="profile-link-icon">
                  <Scale />
                </span>
                <span>
                  <strong>Weight history</strong>
                  <small>Your dated check-ins</small>
                </span>
                <ArrowUpRight />
              </button>
              <button onClick={() => navigate("review")}>
                <span className="profile-link-icon">
                  <BookOpen />
                </span>
                <span>
                  <strong>Monthly review</strong>
                  <small>Reflect on your progress</small>
                </span>
                <ArrowUpRight />
              </button>
            </div>
          </Section>
        </div>
        <div>
          <Section title="Connections & reminders">
            <div className="profile-links">
              <button onClick={() => setDialog("devices")}>
                <span className="profile-link-icon">
                  <Watch />
                </span>
                <span>
                  <strong>Connected devices</strong>
                  <small>Manage your WHOOP connection</small>
                </span>
                <ArrowUpRight />
              </button>
              <button onClick={() => setDialog("reminders")}>
                <span className="profile-link-icon">
                  <Bell />
                </span>
                <span>
                  <strong>Morning reminders</strong>
                  <small>Choose your check-in time</small>
                </span>
                <ArrowUpRight />
              </button>
            </div>
          </Section>
          <section className="profile-session" aria-label="Journal session">
            <ShieldCheck size={23} />
            <div>
              <h2>Your current session</h2>
              <p>
                {persistent
                  ? "Your journal is saved to your account. Shared changes sync with your trainer."
                  : "Profile and journal changes reset when you refresh, close the page, or log out."}
              </p>
            </div>
            <Button variant="secondary" onClick={onSignOut}>
              Log out
            </Button>
          </section>
        </div>
      </div>

      {dialog === "edit" && (
        <Sheet title="Edit profile" onClose={close}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.Name?.trim()) {
                setError("Enter your name to save your profile.");
                return;
              }
              update(
                (store) => ({
                  ...store,
                  profile: {
                    ...store.profile,
                    ...draft,
                    Name: draft.Name.trim(),
                  },
                }),
                persistent
                  ? "Profile updated"
                  : "Profile updated for this session",
              );
              close();
            }}
          >
            <Field
              label="Name"
              required
              value={draft.Name || ""}
              onChange={(Name) => setDraft((current) => ({ ...current, Name }))}
            />
            <div className="form-grid">
              <Field
                label="Starting weight (kg)"
                type="number"
                min="1"
                max="700"
                value={draft["Starting weight (kg)"] || ""}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    "Starting weight (kg)": value,
                  }))
                }
              />
              <Field
                label="Height (cm)"
                type="number"
                min="1"
                max="300"
                value={draft["Height (cm)"] || ""}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, "Height (cm)": value }))
                }
              />
            </div>
            <fieldset className="goal-picker profile-edit-goals">
              <legend>My goal</legend>
              {goals.map((goal) => (
                <label
                  key={goal}
                  className={draft["My Goal"] === goal ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="profile-goal"
                    checked={draft["My Goal"] === goal}
                    onChange={() =>
                      setDraft((current) => ({ ...current, "My Goal": goal }))
                    }
                  />
                  {goal}
                </label>
              ))}
            </fieldset>
            {error && <p role="alert">{error}</p>}
            <p className="helper">
              {persistent
                ? "Changes are saved to your account."
                : "Changes are kept for this session."}
            </p>
            <div className="form-actions">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">
                <Check size={16} /> Save profile
              </Button>
            </div>
          </form>
        </Sheet>
      )}
      {dialog === "devices" && (
        <Sheet title="Connected devices" onClose={close}>
          <WearableConnect
            returnTo="home"
            choice={data.wearablePreference}
            onSelect={(wearablePreference) =>
              update((store) => ({ ...store, wearablePreference }))
            }
            beforeConnect={() => true}
          />
        </Sheet>
      )}
      {dialog === "reminders" && (
        <MorningReminders
          onClose={close}
          loggedToday={data.weights.some((entry) => entry.date === TODAY)}
        />
      )}
    </div>
  );
}
