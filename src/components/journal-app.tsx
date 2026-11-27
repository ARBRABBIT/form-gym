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
  withSamplePreview,
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
import { Trainer, WorkoutScreen } from "./workouts";
import WorkoutLibrary from "./workout-library";
import Onboarding, { AccountEntry } from "./onboarding";
import MobileNavIcon from "./mobile-nav-icon";
import WaterScreen from "./water-screen";
import NavGlassOptics from "./nav-glass-optics";
import ProfileScreen from "./profile-screen";
import MemberStudio, {workspace} from "./member-studio";
import {requestWorkflowNavigation} from "@/lib/workflow-navigation";
import TrainerWorkspace from "./trainer-workspace";
export type ScreenProps = {
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
  const [data, setData] = useState<Store | null>(null),
    [view, setView] = useState("overview"),
    [signedIn, setSignedIn] = useState(false),
    [demoMode, setDemoMode] = useState(false),
    [role, setRole] = useState("member"),
    [date, setDate] = useState(TODAY),
    [toast, setToast] = useState(""),
    [toastRevision, setToastRevision] = useState(0),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    if (signedIn && data?.onboarded && !data.sampleData)
      setData((current) => current ? withSamplePreview(current) : current);
  }, [signedIn, data?.onboarded, data?.sampleData]);
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
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);
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
      const retiredHealthView = requested.startsWith("health-") && !["body", "blood", "lung"].includes(requested.slice(7));
      const v = retiredHealthView ? "overview" : requested;
      if (retiredHealthView) history.replaceState(null, "", "#overview");
      setView(v);
      setRole(
        v === "trainer" || v.startsWith("trainer-") ? "trainer" : "member",
      );
    };
    hash();
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useLayoutEffect(() => {
    if (!data || !content.current) return;
    const origin = launchOrigin.current;
    launchOrigin.current = null;
    if (origin || view.startsWith("health-") || view === "water" || view === "profile") {
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
  const navigate = useCallback((v: string) => {
    requestWorkflowNavigation(()=>{
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
  const update = useCallback((fn: (s: Store) => Store, message?: string) => {
    setData((s) => (s ? fn(s) : s));
    if (message) {
      setToast(message);
      setToastRevision(revision => revision + 1);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 3500);
    }
  }, []);
  if (!data)
    return (
      <div className="loading">
        <div className="wordmark">
          form<span>.</span>
        </div>
        <p>Opening your journal…</p>
      </div>
    );
  const props: ScreenProps = { data, update, navigate, date, setDate };
  if (!signedIn && !demoMode)
    return (
      <AccountEntry
        onDemo={() => {
          setDemoMode(true);
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        onEnter={(email, name, signup) => {
          const next = !signup && data.account?.email === email
            ? data
            : newMemberStore(email, signup ? name : "");
          update(() => next);
          setSignedIn(true);
          setDemoMode(false);
          navigate(
            next.onboarded
              ? location.hash === "#morning"
                ? "morning"
                : "overview"
              : "onboarding",
          );
        }}
      />
    );
  if ((signedIn && !data.onboarded) || view === "onboarding")
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
  const trainer = role === "trainer";
  const switchRole = (r: string) => requestWorkflowNavigation(()=>{
    setRole(r);setView(r === "trainer" ? "trainer" : "overview");location.hash=r === "trainer" ? "trainer" : "overview";setMenu(false);
  });
  const healthSection = view.startsWith("health-") && ["body", "blood", "lung"].includes(view.slice(7)) ? view.slice(7) as HealthSection : undefined;
  const active = nav.find((n) => n.id === view);
  const render = () => {
    if (view === "profile") return <ProfileScreen {...props} onSignOut={() => {
      setData(initialStore());
      setSignedIn(false);
      setDemoMode(false);
      navigate("overview");
    }} />;
    if (healthSection) return <HealthOverview {...props} detail={healthSection} />;
    if (view === "library" || view === "trainer-library")
      return <WorkoutLibrary {...props} />;
    if (view === "trainer-nutrition") return <TrainerWorkspace {...props} mode="nutrition"/>;
    if (view === "trainer-feedback") return <TrainerWorkspace {...props} mode="feedback"/>;
    if (["membership","classes","attendance","meal-plan","feedback","inbox"].includes(view)) return <MemberStudio {...props} view={view}/>;
    if (trainer) return <Trainer {...props} />;
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
      <div className={`app-shell${view === "water" ? " water-view" : ""}`} ref={shell}>
        <aside id="journal-navigation" className={`sidebar ${menu ? "mobile-open" : ""}`}>
          <div className="sidebar-top">
            <a
              className="wordmark"
              href="#overview"
              onClick={() => switchRole("member")}
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
            <button
              className="nav-item"
              onClick={() => {
                      setData(initialStore());
                setSignedIn(false);
                setDemoMode(false);
                navigate("overview");
              }}
            >
              Log out
            </button>
            <div className="profile">
              <span className="avatar">
                {trainer
                  ? "KM"
                  : (data.profile.Name || "Arjun Sharma")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
              </span>
              <div>
                <strong>{trainer ? "Kabir Mehta" : data.profile.Name}</strong>
                <span>
                  {trainer ? "Personal trainer" : "Member · demo journal"}
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
              <button
                className="icon-button mobile-only"
                aria-label="Open navigation"
                aria-expanded={menu}
                aria-controls="journal-navigation"
                onClick={() => setMenu(true)}
              >
                <Menu size={21} />
              </button>
              <span className="desktop-only">My journal</span>
              <span className="breadcrumb-divider desktop-only">/</span>
              <strong>
                {view === "trainer-library"
                  ? "Workout library"
                  : trainer
                    ? "Trainer space"
                    : healthSection ? "Health details" : active?.label || "Set up your journal"}
              </strong>
            </div>
            <div className="topbar-right">
              {!trainer&&<button className="icon-button" aria-label="Open notifications" onClick={()=>navigate("inbox")}><Bell size={19}/>{workspace(data).notifications.some(n=>!n.read)&&<span className="workflow-notification-dot"/>}</button>}
              <span className="saved-state">
                <span className="status-dot" />
                Current session only
              </span>
              <div
                className="view-tabs"
                role="tablist"
                aria-label="Dashboard role"
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    switchRole(trainer ? "member" : "trainer");
                    document
                      .getElementById(trainer ? "member-tab" : "trainer-tab")
                      ?.focus();
                  }
                }}
              >
                <button
                  id="member-tab"
                  role="tab"
                  aria-controls="dashboard-panel"
                  tabIndex={!trainer ? 0 : -1}
                  aria-selected={!trainer}
                  className={!trainer ? "selected" : ""}
                  onClick={() => switchRole("member")}
                >
                  <House size={14} />
                  <span>Member view</span>
                </button>
                <button
                  id="trainer-tab"
                  role="tab"
                  aria-controls="dashboard-panel"
                  tabIndex={trainer ? 0 : -1}
                  aria-selected={trainer}
                  className={trainer ? "selected" : ""}
                  onClick={() => switchRole("trainer")}
                >
                  <Users size={14} />
                  <span>Trainer view</span>
                </button>
              </div>
              <span className="avatar small">
                {trainer
                  ? "KM"
                  : (data.profile.Name || "You")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
              </span>
            </div>
          </header>
          <main
            ref={content}
            id="dashboard-panel"
            role="tabpanel"
            aria-labelledby={trainer ? "trainer-tab" : "member-tab"}
          >
            <div className={`screen-content${view !== "overview" && view !== "water" && view !== "onboarding" ? " journal-detail-screen" : ""}`} data-screen={view} key={`${role}-${view}`}>
              {render()}
            </div>
            <footer className="page-footer">
              <span className="footer-brand">form.</span>
              <span>Training, nutrition & the work between.</span>
              <span className="demo-note">
                {data.sampleData ? "Sample data throughout · browser prototype" : "Personal journal · browser prototype"}
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
            .filter((i) => !trainer || i.id === "trainer" || i.id === "profile")
            .map((item) => {
              const selected = !menu && (view === item.id || (item.id === "overview" && !!healthSection));
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
          <button
            type="button"
            className="bottom-nav-add"
            aria-label="Open water tracker"
            onClick={() => navigate("water")}
          >
            <Plus aria-hidden="true" />
          </button>
        </nav>
        {toast && (
          <div key={toastRevision} className="toast" role="status" aria-atomic="true">
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
