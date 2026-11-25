import { House, Food, Dumbbell, User, Users } from "./icons";

const navigationIcons = {
  overview: House,
  nutrition: Food,
  workout: Dumbbell,
  profile: User,
  trainer: Users,
};

export default function MobileNavIcon({ name }: { name: string }) {
  const Icon = navigationIcons[name as keyof typeof navigationIcons] ?? House;
  return <Icon aria-hidden="true" />;
}
