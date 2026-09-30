"use client";

import Link from "next/link";
import { Gift, Home, Mail, UserRound, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Início", icon: Home, exact: true },
  { href: "/admin/convidados", label: "Convidados", icon: UsersRound },
  { href: "/admin/presentes", label: "Presentes", icon: Gift },
  { href: "/admin/convite", label: "Convite", icon: Mail },
  { href: "/admin/configuracoes", label: "Conta", icon: UserRound }
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-bottom-nav" aria-label="Navegação principal da área dos noivos">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : item.href === "/admin/convite"
            ? pathname.startsWith(item.href) || pathname.startsWith("/admin/preparar")
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
            <Icon size={20} strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
