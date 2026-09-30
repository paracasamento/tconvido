"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Gift,
  Heart,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  UserRound,
  type LucideIcon
} from "lucide-react";

export const INVITE_ICON_OPTIONS = [
  ["user", "Pessoa"],
  ["user-circle", "Pessoa em círculo"],
  ["lock", "Cadeado"],
  ["key", "Chave"],
  ["chevron-right", "Seta direita"],
  ["gift", "Presente"],
  ["heart", "Coração"],
  ["calendar", "Calendário"],
  ["map-pin", "Localização"],
  ["check", "Check"],
  ["mail", "E-mail"],
  ["phone", "Telefone"],
  ["star", "Estrela"],
  ["sparkles", "Brilhos"]
] as const;

export type InviteIconName = (typeof INVITE_ICON_OPTIONS)[number][0];

const ICONS: Record<InviteIconName, LucideIcon> = {
  user: UserRound,
  "user-circle": CircleUserRound,
  lock: LockKeyhole,
  key: KeyRound,
  "chevron-right": ChevronRight,
  gift: Gift,
  heart: Heart,
  calendar: CalendarDays,
  "map-pin": MapPin,
  check: Check,
  mail: Mail,
  phone: Phone,
  star: Star,
  sparkles: Sparkles
};

export function InvitePartIcon({
  name,
  strokeWidth = 1.45
}: {
  name?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = ICONS[(name as InviteIconName) || "user"] || UserRound;
  return <Icon strokeWidth={strokeWidth} aria-hidden style={{ width: "1em", height: "1em" }} />;
}
