import Link from "next/link";
import Image from "next/image";
import LogoutButton from "../logout-button";

const NAV = [
  { href: "/", label: "Tablero", icon: "▦" },
  { href: "/plan", label: "Cargue / Despacho", icon: "🚚" },
  { href: "/trucks", label: "Camiones", icon: "🚛" },
  { href: "/carrier", label: "Transportadora", icon: "📦" },
];

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">
            <Image
              src="/brand/prizma-symbol.svg"
              alt="Prizma"
              width={28}
              height={28}
              priority
            />
          </span>
          <div>
            <div className="brand-name">Hermes Logística</div>
            <div className="brand-sub">Despacho &amp; Cargue</div>
          </div>
        </div>
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link">
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          Lee pedidos <b>enrutados</b> de Hermes.<br />
          Base de datos propia.
          <div className="brand-by">
            <Image
              src="/brand/prizma-symbol.svg"
              alt=""
              width={14}
              height={14}
              aria-hidden
            />
            <span>
              Un producto <b>Prizma</b>
            </span>
          </div>
        </div>
        <LogoutButton />
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
