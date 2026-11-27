"use client";
import { journalFetch, LOCAL_ACCOUNTS } from "@/lib/local-journal-api";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { Account } from "@/lib/accounts";
import {
  members,
  newMemberStore,
  emptyNutrition,
  totalNutrition,
  TODAY,
  formatDate,
  type Store,
  type Food,
} from "@/lib/model";
import { useJournalSync } from "@/lib/use-journal-sync";
import type { ScreenProps } from "./journal-app";
import { Button, Field, Section } from "./ui";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  HeartPulse,
  House,
  Dumbbell,
  Leaf,
  ChartNoAxesCombined,
  Menu,
  Moon,
  X,
} from "./icons";
import HealthOverview from "./health-overview";
import BodyCompositionCard from "./body-composition-card";
import { Trainer, WorkoutScreen } from "./workouts";
import WorkoutMuscleModel from "./workout-muscle-model";
import {
  Planner,
  Habits,
  Challenge,
  WeightTracker,
  Results,
  Review,
  DailyCheckInSection,
  NutritionScreen,
} from "./journal-screens";
import WaterScreen from "./water-screen";
import SmartBottlePanel from "./smart-bottle-panel";
import JournalSyncStatus from "./journal-sync-status";
import TrainerDateStrip from "./trainer-date-strip";
import NavGlassOptics from "./nav-glass-optics";
import MobileNavIcon from "./mobile-nav-icon";
import TrainerMoreMenu from "./trainer-more-menu";
import { playFeedback } from "@/lib/interaction-feedback";

type Person = { id: string; name: string; email?: string };
export type TrainerNavigation = {
  title: string;
  subtitle: string;
  backLabel: string;
  dateLocked: boolean;
  onBack: () => void;
};
const destinations = [
  ["overview", "Overview", House],
  ["workout", "Workouts", Dumbbell],
  ["nutrition", "Food", Leaf],
  ["results", "Progress", ChartNoAxesCombined],
] as const;
const pageTitles: Record<string, string> = {
  overview: "Overview",
  workout: "Workouts",
  nutrition: "Food",
  results: "Progress",
  water: "Water",
  planner: "Goals & planner",
  habits: "Habits",
  challenge: "100-day challenge",
  review: "Monthly review",
  connections: "Devices",
  profile: "Profile",
  weight: "Weight history",
  actual: "Workout log",
  assignment: "Edit workout",
  "food-edit": "Edit food",
  "health-body": "Recovery",
  "health-blood": "Blood health",
  "health-lung": "Breathing",
};
const journalDestinations = [
  ["planner", "Goals & planner"],
  ["habits", "Habits"],
  ["challenge", "100-day challenge"],
  ["review", "Monthly review"],
] as const;
function emptyJournal(person: Person) {
  const data = newMemberStore(person.email || "", person.name);
  data.onboarded = true;
  return data;
}
export default function TrainerWorkspace(
  p: ScreenProps & {
    account: Account | null;
    member: { id: string; name: string } | null;
    onMemberChange: (member: { id: string; name: string } | null) => void;
    onNavigationChange: (navigation: TrainerNavigation | null) => void;
    profileRequest?: number;
    searchQuery?: string;
    onClearSearch?: () => void;
  },
) {
  const [people, setPeople] = useState<Person[]>([]),
    [view, setView] = useState("overview"),
    [error, setError] = useState("");
  const [foodDraft, setFoodDraft] = useState<{
    meal: string;
    item: Food;
  } | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const moreId = useId();
  const selected = p.member?.id || "";
  const sync = useJournalSync(selected, !!p.account && !!selected);
  const query = p.searchQuery || "";
  useEffect(() => {
    let active = true;
    if (p.searchQuery)
      void sync.flush().then((saved) => {
        if (active && saved) p.onMemberChange(null);
      });
    return () => {
      active = false;
    };
  }, [p.searchQuery, sync.flush, p.onMemberChange]);
  useEffect(() => {
    if (!p.account) return;
    let active = true;
    const load = () =>
      journalFetch("/api/members", { cache: "no-store" })
        .then(async (r) => {
          const b = await r.json();
          if (!r.ok) throw new Error(b.error);
          if (active) {
            setPeople(b.members || []);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    void load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [p.account]);
  const roster: Person[] = p.account
    ? people
    : members.map((m) => ({
        ...m,
        name:
          m.id === "alex"
            ? p.data.profile.Name
            : p.data.memberJournals?.[m.id]?.profile.Name || m.name,
      }));
  const person = roster.find((m) => m.id === selected);
  const data = p.account
    ? sync.data
    : selected === "alex"
      ? p.data
      : person
        ? p.data.memberJournals?.[selected] || emptyJournal(person)
        : null;
  const memberName = data?.profile.Name || person?.name;
  useEffect(() => {
    if (p.member && memberName && p.member.name !== memberName)
      p.onMemberChange({ ...p.member, name: memberName });
  }, [memberName, p.member, p.onMemberChange]);
  const scrollPositions = useRef<Record<string, number>>({});
  const rosterScroll = useRef(0);
  const restoreScroll = useRef(0);
  const [trail, setTrail] = useState<{ view: string; scroll: number }[]>([]);
  const openPage = useCallback(
    (next: string, tab = false) => {
      setMoreOpen(false);
      if (next === view) return;
      const scroll = window.scrollY;
      scrollPositions.current[view] = scroll;
      setTrail((current) => (tab ? [] : [...current, { view, scroll }]));
      restoreScroll.current = tab ? scrollPositions.current[next] || 0 : 0;
      setView(next);
    },
    [view],
  );
  const goBack = useCallback(() => {
    setMoreOpen(false);
    scrollPositions.current[view] = window.scrollY;
    const previous = trail[trail.length - 1];
    if (previous) {
      restoreScroll.current = previous.scroll;
      setTrail((current) => current.slice(0, -1));
      setView(previous.view);
    } else if (view !== "overview") {
      restoreScroll.current = scrollPositions.current.overview || 0;
      setView("overview");
    } else {
      restoreScroll.current = rosterScroll.current;
      p.onMemberChange(null);
    }
  }, [view, trail, p.onMemberChange]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: restoreScroll.current, behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [view, selected]);
  useLayoutEffect(() => {
    if (!selected) {
      p.onNavigationChange(null);
      return;
    }
    const previous =
      trail[trail.length - 1]?.view ||
      (view !== "overview" ? "overview" : null);
    p.onNavigationChange({
      title:
        view === "overview"
          ? memberName || p.member?.name || "Member"
          : pageTitles[view] || "Member journal",
      subtitle:
        view === "overview"
          ? formatDate(p.date, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : `${memberName || p.member?.name} · ${formatDate(p.date, { day: "numeric", month: "short", year: "numeric" })}`,
      backLabel: previous
        ? `Back to ${pageTitles[previous]}`
        : "Back to members",
      dateLocked: ["food-edit", "assignment", "actual"].includes(view),
      onBack: goBack,
    });
  }, [
    selected,
    memberName,
    p.member?.name,
    view,
    p.date,
    trail,
    goBack,
    p.onNavigationChange,
  ]);
  useEffect(() => () => p.onNavigationChange(null), [p.onNavigationChange]);
  useEffect(() => {
    if (p.profileRequest && selected) openPage("profile");
  }, [p.profileRequest]);
  const choose = (id: string) => {
    const chosen = roster.find((person) => person.id === id);
    if (chosen) p.onMemberChange({ id: chosen.id, name: chosen.name });
    p.onClearSearch?.();
    setMoreOpen(false);
    rosterScroll.current = window.scrollY;
    scrollPositions.current = {};
    restoreScroll.current = 0;
    setTrail([]);
    setView("overview");
    p.setDate(TODAY);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  if (!selected)
    return (
      <>
        {p.account && (
          <Section title="Invite a member">
            <p className="section-description">
              Give this code to your member. They can enter it under My profile
              → Your trainer to share their journal with you.
            </p>
            <div className="trainer-invite">
              <code>{p.account.coachCode}</code>
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(p.account!.coachCode!)
                    .then(() => setError("Trainer code copied."))
                    .catch(() => setError("Select and copy the code above."));
                }}
              >
                Copy trainer code
              </Button>
            </div>
          </Section>
        )}
        <section className="trainer-roster" aria-label="My members">
          {error && <p role="status">{error}</p>}
          <div className="member-list">
            {roster
              .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
              .map((m) => (
                <button key={m.id} onClick={() => choose(m.id)}>
                  <span className="member-avatar">
                    {m.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{m.name}</strong>
                    <span>{m.email || "Training & wellness journal"}</span>
                  </div>
                  <ArrowRight size={20} />
                </button>
              ))}
          </div>
          {!!roster.length &&
            !roster.some((member) =>
              member.name.toLowerCase().includes(query.toLowerCase()),
            ) && <p className="empty-state">No members match “{query}”.</p>}
          {!roster.length && (
            <p className="empty-state">
              No members linked yet. Share your trainer code to get started.
            </p>
          )}
        </section>
      </>
    );
  if (!person || !data)
    return (
      <>
        <Button
          variant="ghost"
          onClick={async () => {
            p.onMemberChange(null);
          }}
        >
          All members
        </Button>
        <p role="status">{sync.status || "Opening member journal…"}</p>
        {error && <p role="alert">{error}</p>}
      </>
    );
  const update: ScreenProps["update"] = (fn, message) => {
    if (p.account) sync.update(fn);
    else if (selected === "alex") p.update(fn, message);
    else
      p.update(
        (root) => ({
          ...root,
          memberJournals: {
            ...root.memberJournals,
            [selected]: fn(
              root.memberJournals?.[selected] || emptyJournal(person),
            ),
          },
        }),
        message,
      );
  };
  const navigate = (next: string) => {
    if (next === "overview") goBack();
    else openPage(next);
  };
  const shared: ScreenProps = {
    ...p,
    data: { ...data, month: p.date.slice(0, 7) },
    update: (fn, message) =>
      update((original) => {
        const next = fn({ ...original, month: p.date.slice(0, 7) });
        if (next.month !== p.date.slice(0, 7)) p.setDate(`${next.month}-01`);
        return { ...next, month: original.month };
      }, message),
    navigate,
    healthMemberId: p.account
      ? selected
      : selected !== "alex"
        ? selected
        : undefined,
    trainerMode: true,
    persistent: !!p.account,
  };
  const journal = journalDestinations.some(([id]) => id === view);
  const section = view.startsWith("health-")
    ? "overview"
    : view === "weight"
      ? "results"
      : view === "actual" || view === "assignment"
        ? "workout"
        : view === "food-edit"
          ? "nutrition"
          : journal || ["water", "connections", "profile"].includes(view)
            ? "more"
            : view;
  const nutrition = totalNutrition(data.nutrition[p.date] || emptyNutrition());
  const latestWeight = [...data.weights]
    .filter((w) => w.date <= p.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return (
    <div className="trainer-workspace">
      {view === "overview" && (
        <TrainerDateStrip value={p.date} onChange={p.setDate} data={data} />
      )}
      {view === "overview" && (
        <p className="trainer-session-note">
          {p.account
            ? (LOCAL_ACCOUNTS ? "Saved in this browser only" : "Shared journal · changes save automatically")
            : "Sample journal · shared within this session"}
        </p>
      )}
      {p.account && <JournalSyncStatus sync={sync} />}
      <nav
        className="trainer-section-nav trainer-glass-nav"
        aria-label="Member sections"
      >
        <NavGlassOptics />
        <div className="bottom-nav-tabs">
          {destinations.map(([id, label, Icon]) => {
            const active = !moreOpen && section === id;
            return (
              <button
                key={id}
                type="button"
                className={active ? "selected" : ""}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  playFeedback(
                    event.currentTarget.querySelector("svg"),
                    "value",
                  );
                  openPage(id, true);
                }}
              >
                {["overview", "workout", "nutrition"].includes(id) ? (
                  <MobileNavIcon name={id} selected={active} />
                ) : (
                  <Icon size={24} />
                )}
                <span className="bottom-nav-label">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={`trainer-more-trigger${!moreOpen && section === "more" ? " selected" : ""}`}
          ref={moreTrigger}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-controls={moreOpen ? moreId : undefined}
          title="More"
          aria-label="More"
          aria-current={!moreOpen && section === "more" ? "page" : undefined}
          onClick={(event) => {
            playFeedback(event.currentTarget.querySelector("svg"), "value");
            setMoreOpen((open) => !open);
          }}
        >
          {moreOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      {journal && (
        <nav className="trainer-subnav" aria-label="Journal sections">
          {journalDestinations.map(([id, label]) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {section === "results" && (
        <nav className="trainer-subnav" aria-label="Progress sections">
          {[
            ["results", "Measurements & results"],
            ["weight", "Weight history"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {view === "overview" ? (
        <>
          <div className="trainer-summary" aria-label="Member daily summary">
            <button
              type="button"
              className="trainer-summary-card summary-weight"
              aria-label="Weight summary"
              onClick={() => navigate("weight")}
            >
              <div>
                <span>Latest weight</span>
                <strong>
                  {latestWeight
                    ? `${latestWeight.weight} kg`
                    : data.profile["Starting weight (kg)"]
                      ? `${data.profile["Starting weight (kg)"]} kg`
                      : "Not recorded"}
                </strong>
                <small>
                  {latestWeight
                    ? formatDate(latestWeight.date, {
                        day: "numeric",
                        month: "short",
                      })
                    : "Starting profile"}
                </small>
              </div>
              <img
                src="/images/trainer-scale.png"
                width={96}
                height={96}
                alt=""
                aria-hidden="true"
              />
              <span className="summary-card-arrow" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </button>
            <button
              type="button"
              className="trainer-summary-card summary-food"
              aria-label="Food summary"
              onClick={() => navigate("nutrition")}
            >
              <div>
                <span>{p.date === TODAY ? "Food today" : "Food logged"}</span>
                <strong>
                  {nutrition.calories}{" "}
                  <small className="summary-unit">kcal</small>
                </strong>
                <small>
                  Protein {nutrition.protein} g · Carbs {nutrition.carbs} g ·
                  Fat {nutrition.fat} g
                </small>
              </div>
              <img
                src="/images/trainer-food.png"
                width={96}
                height={96}
                alt=""
                aria-hidden="true"
              />
              <span className="summary-card-arrow" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </button>
            <button
              type="button"
              className="trainer-summary-card summary-training"
              aria-label="Training summary"
              onClick={() => navigate("workout")}
            >
              <div>
                <span>{p.date === TODAY ? "Training today" : "Training"}</span>
                <strong>
                  {data.logs[`alex:${p.date}`]?.muscle ||
                    data.plans[`alex:${p.date}`]?.muscle ||
                    "No assignment"}
                </strong>
                <small>
                  {data.logs[`alex:${p.date}`] ? "Logged · " : ""}
                  {
                    data.habits.filter((h) => h.marks.includes(p.date)).length
                  } / {data.habits.length} habits completed
                </small>
              </div>
              <img
                src="/images/trainer-training.png"
                width={96}
                height={96}
                alt=""
                aria-hidden="true"
              />
              <span className="summary-card-arrow" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </button>
          </div>
          <div className="trainer-actions">
            <Button onClick={() => navigate("workout")}>
              Adjust workout <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" onClick={() => navigate("nutrition")}>
              Adjust food <ArrowRight size={16} />
            </Button>
          </div>
          <HealthOverview {...shared} />
          <BodyCompositionCard {...shared} />
          <DailyCheckInSection {...shared} />
        </>
      ) : view.startsWith("health-") ? (
        <HealthOverview
          {...shared}
          detail={view.slice(7) as "body" | "blood" | "lung"}
        />
      ) : view === "workout" ? (
        <>
          <WorkoutMuscleModel
            trainerMode
            plan={data.plans[`alex:${p.date}`]}
            saved={data.logs[`alex:${p.date}`]}
            completions={data.setCompletions?.[`alex:${p.date}`]}
            date={p.date}
          />
          <div className="trainer-actions">
            <Button variant="secondary" onClick={() => navigate("actual")}>
              Edit member’s actual log
            </Button>
          </div>
          <Trainer
            {...shared}
            embedded
            onEditRequested={() => openPage("assignment")}
          />
        </>
      ) : view === "assignment" ? (
        <Trainer {...shared} embedded editingPage onCloseEditor={goBack} />
      ) : view === "actual" ? (
        <>
          <WorkoutScreen {...shared} onSaved={goBack} />
        </>
      ) : view === "nutrition" || view === "food-edit" ? (
        <NutritionScreen
          {...shared}
          foodEditor={view === "food-edit" ? foodDraft : null}
          onFoodEdit={(food) => {
            setFoodDraft(food);
            if (food) openPage("food-edit");
            else goBack();
          }}
        />
      ) : view === "water" ? (
        <WaterScreen {...shared} />
      ) : view === "results" ? (
        <Results {...shared} />
      ) : view === "weight" ? (
        <WeightTracker {...shared} />
      ) : view === "planner" ? (
        <Planner {...shared} />
      ) : view === "habits" ? (
        <Habits {...shared} />
      ) : view === "challenge" ? (
        <Challenge {...shared} />
      ) : view === "review" ? (
        <Review {...shared} />
      ) : view === "connections" || view === "profile" ? (
        <>
          {view === "profile" && (
            <Section title="Member profile summary">
              <dl className="trainer-journal-records">
                {Object.entries({
                  Name: data.profile.Name,
                  Email: person.email || data.account?.email || "Not recorded",
                  Height: data.profile["Height (cm)"]
                    ? `${data.profile["Height (cm)"]} cm`
                    : "Not recorded",
                  Goal: data.profile["My Goal"] || "Not set",
                  "Workout logs": Object.keys(data.logs).filter(
                    (key) => key.startsWith("alex:") && key.slice(5) <= TODAY,
                  ).length,
                  "Habits tracked": data.habits.length,
                  "Challenge days": `${data.challenge.length} / 100`,
                }).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          {view === "connections" && (
            <>
              <Section
                title="Member connections"
                className="trainer-whoop-section"
                action={
                  <span className="water-bottle-status">
                    {data.sampleData
                      ? "Sample WHOOP preview"
                      : data.wearablePreference === "whoop"
                        ? "WHOOP selected"
                        : data.wearablePreference === "none"
                          ? "No wearable selected"
                          : "Not connected"}
                  </span>
                }
              >
                <div className="trainer-whoop-identity">
                  <div className="trainer-whoop-media">
                    <img
                      src="/images/whoop-5-cloudknit.webp"
                      alt="WHOOP 5.0 sensor with CloudKnit fabric band"
                      width={82}
                      height={110}
                    />
                  </div>
                  <div className="trainer-whoop-copy">
                    <h3>WHOOP Band</h3>
                    <p className="trainer-whoop-model">
                      WHOOP 5.0 · CloudKnit
                    </p>
                    <div
                      className="trainer-whoop-signals"
                      aria-label="WHOOP signals"
                    >
                      <span>
                        <Moon size={13} /> Sleep
                      </span>
                      <span>
                        <HeartPulse size={13} /> Recovery
                      </span>
                      <span>
                        <Activity size={13} /> Strain
                      </span>
                    </div>
                  </div>
                </div>
                <p className="section-description">
                  Wearable readings come from this member’s linked account. The
                  member connects or disconnects their WHOOP band from their own
                  profile.
                </p>
                {data.reminderPreferences ? (
                  <dl className="trainer-journal-records">
                    {Object.entries(data.reminderPreferences).map(
                      ([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{String(value)}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                ) : (
                  <p className="muted">
                    No account reminder preference recorded. Notification
                    delivery also depends on the member’s device.
                  </p>
                )}
              </Section>
              <SmartBottlePanel data={data} update={update} date={p.date} />
            </>
          )}
        </>
      ) : null}
      <TrainerMoreMenu
        open={moreOpen}
        id={moreId}
        trigger={moreTrigger}
        onClose={() => setMoreOpen(false)}
        onSelect={(page) => openPage(page)}
      />
    </div>
  );
}
