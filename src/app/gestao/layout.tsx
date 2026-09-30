import "./gestao.css";
import { GestaoChrome } from "@/components/gestao/GestaoChrome";

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return <GestaoChrome>{children}</GestaoChrome>;
}
