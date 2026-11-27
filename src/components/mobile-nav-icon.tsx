import { House, Food, Dumbbell, User, Users } from "./icons";
import UserRoundIcon from "@hugeicons/core-free-icons/UserRoundIcon";

const navigationIcons = {
  overview: { Icon: House, label: "House" },
  nutrition: { Icon: Food, label: "Food" },
  workout: { Icon: Dumbbell, label: "Dumbbell" },
  profile: { Icon: User, label: "User" },
  trainer: { Icon: Users, label: "Users" },
};

// Solid companions to the existing rounded outline silhouettes. Open stroke
// paths need their own solid geometry; filling them directly closes the gaps.
const solidIcons = {
  overview: <path fillRule="evenodd" clipRule="evenodd" d="M3 11.5c0-1.5.4-2.2 1.6-3.1l5-3.9c1.6-1.3 3.2-1.3 4.8 0l5 3.9c1.2.9 1.6 1.6 1.6 3.1V17c0 3.3-1.2 4.5-4.5 4.5h-9C4.2 21.5 3 20.3 3 17Zm7 10v-5a2 2 0 0 1 4 0v5Z" />,
  workout: <g transform="rotate(45 12 12)"><rect x="10" y="6" width="4" height="12" rx="1" /><rect x="6" y="3" width="12" height="5" rx="1.5" /><rect x="6" y="16" width="12" height="5" rx="1.5" /><rect x="9" y="1" width="6" height="2" rx=".8" /><rect x="9" y="21" width="6" height="2" rx=".8" /></g>,
  nutrition: <><path d="M3.1 3.5a.9.9 0 0 1 1.8 0V8h1.2V3.5a.9.9 0 0 1 1.8 0V8h1.2V3.5a.9.9 0 0 1 1.8 0v5c0 1.7-1.1 2.8-2.8 3V21a1.1 1.1 0 0 1-2.2 0v-9.5c-1.7-.2-2.8-1.3-2.8-3Z" /><path d="M15 3c3.3 0 5 2.7 5 5.5V12c0 1.4-1.1 2.5-2.5 2.5H17V21a1 1 0 0 1-2 0Z" /></>,
  // Reuse the outline's exact head and shoulder paths in the filled state.
  profile: <>{UserRoundIcon.map(([, attributes], index) => <path key={index} d={attributes.d as string} />)}</>,
  trainer: <><circle cx="9.5" cy="9.5" r="3.5" /><path d="M3 20.5a6.5 6.5 0 0 1 13 0c0 .5-.4.8-.9.8H3.9c-.5 0-.9-.3-.9-.8ZM15.6 11.7a6.5 6.5 0 0 1 5.9 5.8c0 .5-.3.8-.8.8h-3.1a8.5 8.5 0 0 0-3.2-4.3c.6-.6 1-1.4 1.2-2.3Z" /><path d="M13 3.7a3.5 3.5 0 1 1 2.7 6c0-2.1-1.1-3.9-2.7-4.9Z" /></>,
};

export default function MobileNavIcon({ name, selected = false }: { name: string; selected?: boolean }) {
  const key = name in navigationIcons ? name as keyof typeof navigationIcons : "overview";
  const { Icon, label } = navigationIcons[key];
  if (!selected) return <Icon aria-hidden="true" data-icon-variant="outline" />;
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none" aria-hidden="true" focusable="false" data-icon={label} data-icon-family="form-rounded-solid" data-icon-variant="solid">
    {solidIcons[key]}
  </svg>;
}
