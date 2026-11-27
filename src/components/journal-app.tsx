"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Activity,
  Bell,
  ArrowUpRight,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronDown,
  Dumbbell,
  Droplet,
  Flag,
  House,
  LibraryBig,
  Leaf,
  Menu,
  Plus,
  Settings2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  User,
  X,
} from "./icons";
import gsap from "gsap";
import { createPortal } from "react-dom";
import {
  initialStore,
  newMemberStore,
  TODAY,
  formatDate,
  type Store,
} from "@/lib/model";
import { Button } from "./ui";
import Dashboard from "./overview";
import HealthOverview, { type HealthSection } from "./health-overview";
import {
  Planner,
  Habits,
  Challenge,
  WeightTracker,
  Results,
  Review,
  NutritionScreen,
} from "./journal-screens";
import { WorkoutScreen } from "./workouts";
import WorkoutLibrary from "./workout-library";
import Onboarding, { AccountEntry } from "./onboarding";
import MobileNavIcon from "./mobile-nav-icon";
import WaterScreen from "./water-screen";
import NavGlassOptics from "./nav-glass-optics";
import ProfileScreen from "./profile-screen";
import TrainerStudio from "./trainer-studio";
import MemberStudio, {workspace} from "./member-studio";
import {requestWorkflowNavigation} from "@/lib/workflow-navigation";
import DatePicker from "./date-picker";
import TrainerWorkspace, { type TrainerNavigation } from "./trainer-workspace";
import JournalSharing from "./journal-sharing";
import JournalSyncStatus from "./journal-sync-status";
import { useJournalSync, flushAllJournals } from "@/lib/use-journal-sync";
import type { Account } from "@/lib/accounts";
export type ScreenProps = {
  healthMemberId?: string;
  trainerMode?: boolean;
  persistent?: boolean;
  data: Store;
  update: (fn: (s: Store) => Store, message?: string) => void;
  navigate: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
};
const nav = [
  { id: "overview", label: "Overview", icon: House },
  { id: "profile", label: "My profile", icon: User },
  { id: "membership", label: "My membership", icon: ShieldCheck },
  { id: "classes", label: "Classes & bookings", icon: CalendarDays },
  { id: "attendance", label: "Studio pass & visits", icon: CheckCheck },
  { id: "meal-plan", label: "My nutrition plan", icon: Leaf },
  { id: "feedback", label: "Coach feedback", icon: Users },
  { id: "inbox", label: "Notifications", icon: Bell },
  { id: "workout", label: "My workouts", icon: Dumbbell },
  { id: "library", label: "Workout library", icon: LibraryBig },
  { id: "nutrition", label: "Nutrition & wellness", icon: Leaf },
  { id: "water", label: "Water", icon: Droplet },
  { id: "planner", label: "Monthly planner", icon: CalendarDays },
  { id: "habits", label: "Habit tracker", icon: CheckCheck },
  { id: "challenge", label: "100-day challenge", icon: Flag },
  { id: "weight", label: "Weight tracker", icon: ChartNoAxesCombined },
  { id: "results", label: "Starting point & results", icon: Activity },
  { id: "review", label: "Monthly review", icon: BookOpen },
];
export default function JournalApp() {
  const [demoData, setData] = useState<Store | null>(null),
    [view, setView] = useState("overview"),
    [signedIn, setSignedIn] = useState(false),
    [demoMode, setDemoMode] = useState(false),
    [role, setRole] = useState("member"),
    [date, setDate] = useState(TODAY),
    [toast, setToast] = useState(""),
    [toastRevision, setToastRevision] = useState(0),
    [menu, setMenu] = useState(false);
  const [trainerMember, setTrainerMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [trainerNavigation, setTrainerNavigation] =
    useState<TrainerNavigation | null>(null);
  const [memberProfileRequest, setMemberProfileRequest] = useState(0);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const sync = useJournalSync(account?.id, !!account);
  const data = account ? sync.data : demoData;
  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (body.account) {
          setAccount(body.account);
          setSignedIn(true);
          if (body.account.role === "trainer") {
            setRole("trainer");
            location.hash = "trainer";
          }
        }
      })
      .catch(() =>
        setToast("Unable to check your account. Please try logging in."),
      )
      .finally(() => setSessionLoading(false));
  }, []);
  const shell = useRef<HTMLDivElement>(null);
  const launchCoverRef = useRef<HTMLDivElement>(null);
  const [launchCover, setLaunchCover] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const launchOrigin = useRef<{ x: number; y: number } | null>(null);
  const content = useRef<HTMLElement>(null),
    inputMode = useRef<"pointer" | "keyboard">("pointer"),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    const pointer = () => {
      inputMode.current = "pointer";
    };
    const keyboard = () => {
      inputMode.current = "keyboard";
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, []);
  useEffect(() => {
    // Remove data retained by earlier prototype versions; this session stays in memory.
    try {
      localStorage.removeItem("form-journal-v1");
      sessionStorage.removeItem("form-session");
      sessionStorage.removeItem("form-sample");
    } catch {}
    setData(initialStore());
    const hash = () => {
      const requested = location.hash.slice(1) || "overview";
      const retiredHealthView =
        requested.startsWith("health-") &&
        !["body", "blood", "lung"].includes(requested.slice(7));
      const v = retiredHealthView ? "overview" : requested;
      if (retiredHealthView) history.replaceState(null, "", "#overview");
      setView(v);
    };
    hash();
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useLayoutEffect(() => {
    if (!data || !content.current) return;
    const origin = launchOrigin.current;
    launchOrigin.current = null;
    if (
      origin ||
      view.startsWith("health-") ||
      view === "water" ||
      view === "profile"
    ) {
      window.scrollTo({ top: 0, behavior: "instant" });
      const heading = content.current.querySelector<HTMLElement>("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    const ctx = gsap.context(() => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const homeElements = content.current!.querySelectorAll(
        ".journal-heading, .week-strip, .health-overview-heading, .health-source-bar, .health-card, .health-summary-card, .journal-main > section, .journal-aside > section, .journal-index",
      );
      if (origin && shell.current) {
        if (launchCoverRef.current) {
          gsap.to(launchCoverRef.current, {
            opacity: 0,
            duration: 0.45,
            ease: "power2.out",
            onComplete: () => setLaunchCover(null),
          });
        }
        gsap.fromTo(
          homeElements,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.065,
            delay: 0.12,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
      } else if (inputMode.current !== "keyboard") {
        if (view === "overview") {
          gsap.fromTo(
            homeElements,
            { opacity: 0.4, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.05,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
        } else {
          gsap.fromTo(
            ".screen-content",
            { y: 6, opacity: 0.78 },
            {
              y: 0,
              opacity: 1,
              duration: 0.22,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
        }
      }
    }, shell);
    return () => ctx.revert();
  }, [view, role, !!data, signedIn, demoMode]);
  const navigate = useCallback(async (v: string) => {
    if (!(await flushAllJournals())) {
      setToast("Save or resolve your journal changes before leaving.");
      return;
    }
    requestWorkflowNavigation(() => {
    setView(v);
    location.hash = v;
    setMenu(false);
    window.scrollTo({
      top: 0,
      behavior:
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        inputMode.current === "keyboard"
          ? "instant"
          : "smooth",
    });
    });
  }, []);
  useLayoutEffect(() => {
    if (!launchCover || !launchCoverRef.current) return;
    const cover = launchCoverRef.current;
    const timeline = gsap.timeline({
      onComplete: () => {
        launchOrigin.current = { x: launchCover.x, y: launchCover.y };
        setRole("member");
        navigate("overview");
        window.scrollTo({ top: 0, behavior: "instant" });
      },
    });
    const x = launchCover.x + launchCover.width / 2;
    const y = launchCover.y + launchCover.height / 2;
    const radius =
      Math.ceil(
        Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)),
      ) + 2;
    timeline.to(cover, {
      clipPath: `circle(${radius}px at ${x}px ${y}px)`,
      duration: 1.1,
      ease: "power2.inOut",
    });
    return () => {
      timeline.kill();
    };
  }, [launchCover, navigate]);
  const launchOverlay = launchCover
    ? createPortal(
        <div
          ref={launchCoverRef}
          className="app-launch-cover"
          aria-hidden="true"
          style={{
            inset: 0,
            width: "100vw",
            height: "100dvh",
            clipPath: `circle(0px at ${launchCover.x + launchCover.width / 2}px ${launchCover.y + launchCover.height / 2}px)`,
          }}
        />,
        document.body,
      )
    : null;
  const update = useCallback(
    (fn: (s: Store) => Store, message?: string) => {
      if (account) sync.update(fn);
      else setData((s) => (s ? fn(s) : s));
      if (message) {
        setToast(message);
        setToastRevision((revision) => revision + 1);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 3500);
      }
    },
    [account, sync.update],
  );
  if (!data || sessionLoading)
    return (
      <div className="loading">
        <div className="wordmark">
          form<span>.</span>
        </div>
        <p>{account && sync.error ? sync.status : "Opening your journal…"}</p>
        {account && sync.error && (
          <Button
            onClick={() => {
              setAccount(null);
              setSignedIn(false);
              setDemoMode(false);
            }}
          >
            Return to login
          </Button>
        )}
      </div>
    );
  const props: ScreenProps = {
    data,
    update,
    navigate,
    date,
    setDate,
    persistent: !!account,
  };
  if (!signedIn && !demoMode)
    return (
      <AccountEntry
        onDemo={(demoRole) => {
          setRole(demoRole);
          setDemoMode(true);
          void navigate(demoRole === "trainer" ? "trainer" : "overview");
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        onEnter={async (email, name, signup, password, role) => {
          const response = await fetch("/api/account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, signup, password, role }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error);
          setAccount(body.account);
          setSignedIn(true);
          setDemoMode(false);
          setRole(body.account.role);
          navigate(body.account.role === "trainer" ? "trainer" : "overview");
        }}
      />
    );
  if (
    (signedIn && account?.role !== "trainer" && !data.onboarded) ||
    view === "onboarding"
  )
    return (
      <>
        <Onboarding
          {...props}
          onOpenApp={(origin) => {
            if (launchCover) return;
            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              launchOrigin.current = origin;
              setRole("member");
              navigate("overview");
              window.scrollTo({ top: 0, behavior: "instant" });
            } else setLaunchCover(origin);
          }}
        />
        {launchOverlay}
      </>
    );
  const trainer =
    role === "trainer" && (!account || account.role === "trainer");
  const memberDetail = trainer && view === "trainer" ? trainerMember : null;
  const signOut = async () => {
    if (!(await flushAllJournals())) {
      setToast("Save or resolve your journal changes before logging out.");
      return;
    }
    if (account) {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        setToast("Unable to log out. Try again.");
        return;
      }
    }
    setAccount(null);
    setMenu(false);
    setData(initialStore());
    setSignedIn(false);
    setDemoMode(false);
    setRole("member");
    setView("overview");
    location.hash = "overview";
  };
  const healthSection =
    view.startsWith("health-") &&
    ["body", "blood", "lung"].includes(view.slice(7))
      ? (view.slice(7) as HealthSection)
      : undefined;
  const active = nav.find((n) => n.id === view);
  const render = () => {
    if (view === "profile")
      return (
        <>
          {account?.role === "member" && <JournalSharing />}
          <ProfileScreen
            {...props}
            persistent={!!account}
            onSignOut={signOut}
          />
        </>
      );
    if (healthSection)
      return <HealthOverview {...props} detail={healthSection} />;
    if (view === "library" || view === "trainer-library")
      return <WorkoutLibrary {...props} />;
    if (view === "trainer-nutrition") return <TrainerStudio {...props} mode="nutrition"/>;
    if (view === "trainer-feedback") return <TrainerStudio {...props} mode="feedback"/>;
    if (["membership","classes","attendance","meal-plan","feedback","inbox"].includes(view)) return <MemberStudio {...props} view={view}/>;
    if (trainer)
      return (
        <TrainerWorkspace
          {...props}
          account={account}
          member={trainerMember}
          onNavigationChange={setTrainerNavigation}
          profileRequest={memberProfileRequest}
          onMemberChange={setTrainerMember}
          searchQuery={trainerSearchQuery}
          onClearSearch={() => setTrainerSearchQuery("")}
        />
      );
    switch (view) {
      case "planner":
        return <Planner {...props} />;
      case "habits":
        return <Habits {...props} />;
      case "challenge":
        return <Challenge {...props} />;
      case "weight":
        return <WeightTracker {...props} />;
      case "results":
        return <Results {...props} />;
      case "review":
        return <Review {...props} />;
      case "nutrition":
        return <NutritionScreen {...props} />;
      case "water":
        return <WaterScreen {...props} />;
      case "onboarding":
        return <Onboarding {...props} />;
      case "workout":
        return <WorkoutScreen {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  };
  return (
    <>
      <div
        className={`app-shell${view === "water" ? " water-view" : ""}${trainer && view !== "trainer-library" ? " trainer-members-view" : ""}${memberDetail ? " trainer-member-detail" : ""}`}
        ref={shell}
      >
        <aside
          id="journal-navigation"
          className={`sidebar ${menu ? "mobile-open" : ""}`}
        >
          <div className="sidebar-top">
            <a
              className="wordmark"
              href={trainer ? "#trainer" : "#overview"}
              onClick={(event) => {
                event.preventDefault();
                void navigate(trainer ? "trainer" : "overview");
              }}
            >
              form<span>.</span>
            </a>
            <button
              className="icon-button mobile-only"
              aria-label="Close menu"
              onClick={() => setMenu(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="workspace">
            <div className="workspace-icon">
              <Dumbbell size={19} />
            </div>
            <div>
              <strong>Training journal</strong>
              <span>Member workspace</span>
            </div>
          </div>
          <div className="side-section-label">YOUR JOURNAL</div>
          <nav aria-label="Main navigation">
            {(trainer
              ? [
                  { id: "trainer", label: "My members", icon: Users },
                  { id: "trainer-nutrition", label: "Nutrition planning", icon: Leaf },
                  { id: "trainer-feedback", label: "Coaching inbox", icon: Users },
                  {
                    id: "trainer-library",
                    label: "Workout library",
                    icon: LibraryBig,
                  },
                ]
              : nav
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`nav-item ${view === item.id ? "active" : ""}`}
                aria-current={view === item.id ? "page" : undefined}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
                {view === item.id && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            {!trainer && (
              <button
                className="setup-card"
                onClick={() => navigate("onboarding")}
              >
                <span className="setup-link">
                  Set up your journal <ArrowUpRight size={16} />
                </span>
              </button>
            )}
            <button className="nav-item" onClick={signOut}>
              Log out
            </button>
            <div className="profile">
              <span className="avatar">
                {trainer
                  ? (account?.name || "Kabir Mehta")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                  : (data.profile.Name || "Arjun Sharma")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
              </span>
              <div>
                <strong>
                  {trainer ? account?.name || "Kabir Mehta" : data.profile.Name}
                </strong>
                <span>
                  {trainer
                    ? "Personal trainer"
                    : account
                      ? "Member"
                      : "Member · sample journal"}
                </span>
              </div>
              <Settings2 size={16} />
            </div>
          </div>
        </aside>
        {menu && <div className="nav-scrim" onClick={() => setMenu(false)} />}
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              {memberDetail ? (
                <button
                  type="button"
                  className="icon-button member-detail-back"
                  aria-label={trainerNavigation?.backLabel || "Back to members"}
                  onClick={async () => {
                    if (await flushAllJournals()) {
                      if (trainerNavigation) trainerNavigation.onBack();
                      else setTrainerMember(null);
                    }
                  }}
                >
                  <ArrowLeft size={21} />
                </button>
              ) : (
                <button
                  className="icon-button mobile-only"
                  aria-label="Open navigation"
                  aria-expanded={menu}
                  aria-controls="journal-navigation"
                  onClick={() => setMenu(true)}
                >
                  <Menu size={21} />
                </button>
              )}
              <span className="desktop-only">My journal</span>
              <span className="breadcrumb-divider desktop-only">/</span>
              {trainer && view !== "trainer-library" ? (
                <div className="member-header-text">
                  <h1
                    className="members-header-title"
                    id="member-page-title"
                    tabIndex={-1}
                  >
                    {memberDetail
                      ? trainerNavigation?.title || memberDetail.name
                      : "My members"}
                  </h1>
                  {memberDetail && trainerNavigation && (
                    <p>{trainerNavigation.subtitle}</p>
                  )}
                </div>
              ) : (
                <strong>
                  {view === "trainer-library"
                    ? "Workout library"
                    : trainer
                      ? "Trainer space"
                      : healthSection
                        ? "Health details"
                        : active?.label || "Set up your journal"}
                </strong>
              )}
            </div>
            <div className="topbar-right">
              {!trainer&&<button className="icon-button" aria-label="Open notifications" onClick={()=>navigate("inbox")}><Bell size={19}/>{workspace(data).notifications.some(n=>!n.read)&&<span className="workflow-notification-dot"/>}</button>}
              <span className="saved-state">
                <span className="status-dot" />
                {account
                  ? trainer
                    ? "Saved member journals"
                    : sync.status
                  : "Sample session"}
              </span>
              {trainer && view !== "trainer-library" && !memberDetail && (
                <label className="trainer-header-search">
                  <Search size={19} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search members"
                    placeholder="Search members"
                    value={trainerSearchQuery}
                    onChange={(event) =>
                      setTrainerSearchQuery(event.target.value)
                    }
                  />
                </label>
              )}
              <span className="avatar small">
                {trainer
                  ? (account?.name || "Kabir Mehta")
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                  : (data.profile.Name || "You")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
              </span>
            </div>
            {memberDetail && (
              <div className="member-header-actions">
                <DatePicker
                  value={date}
                  onChange={setDate}
                  label="Member journal date"
                  max="2100-12-31"
                  iconOnly
                  disabled={trainerNavigation?.dateLocked}
                />
                <button
                  type="button"
                  className="member-profile-avatar"
                  aria-label={`View ${memberDetail.name}’s profile`}
                  onClick={() =>
                    setMemberProfileRequest((request) => request + 1)
                  }
                >
                  {memberDetail.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </button>
              </div>
            )}
          </header>
          <main
            ref={content}
            id="dashboard-panel"
            role="region"
            aria-label={
              memberDetail
                ? undefined
                : trainer
                  ? "Trainer workspace"
                  : "Member workspace"
            }
            aria-labelledby={memberDetail ? "member-page-title" : undefined}
          >
            <div
              className={`screen-content${view !== "overview" && view !== "water" && view !== "onboarding" ? " journal-detail-screen" : ""}`}
              data-screen={view}
              key={`${role}-${view}`}
            >
              {account && !trainer && <JournalSyncStatus sync={sync} />}
              {render()}
            </div>
            <footer className="page-footer">
              <span className="footer-brand">form.</span>
              <span>Training, nutrition & the work between.</span>
              <span className="demo-note">
                {account
                  ? "Saved journal · shared edits sync automatically"
                  : "Sample data · session only"}
              </span>
            </footer>
          </main>
        </div>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <NavGlassOptics />
          <div className="bottom-nav-tabs">
            {[
              {
                id: trainer ? "trainer" : "overview",
                label: trainer ? "Members" : "Home",
              },
              { id: "workout", label: "Workout" },
              { id: "nutrition", label: "Food" },
              { id: "profile", label: "Profile" },
            ]
              .filter(
                (i) => !trainer || i.id === "trainer" || i.id === "profile",
              )
              .map((item) => {
                const selected =
                  !menu &&
                  (view === item.id ||
                    (item.id === "overview" && !!healthSection));
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => navigate(item.id)}
                    className={selected ? "selected" : ""}
                  >
                    <MobileNavIcon name={item.id} selected={selected} />
                    <span className="bottom-nav-label">{item.label}</span>
                  </button>
                );
              })}
          </div>
          {!trainer && (
            <button
              type="button"
              className="bottom-nav-add"
              aria-label="Open water tracker"
              onClick={() => navigate("water")}
            >
              <Plus aria-hidden="true" />
            </button>
          )}
        </nav>
        {toast && (
          <div
            key={toastRevision}
            className="toast"
            role="status"
            aria-atomic="true"
          >
            <span className="toast-check">
              <Check size={15} />
            </span>
            {toast}
          </div>
        )}
      </div>
      {launchOverlay}
    </>
  );
}
