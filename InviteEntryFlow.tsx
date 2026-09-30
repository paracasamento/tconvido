"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { Monogram } from "@/components/Monogram";
import { InviteFloralBackdrop } from "@/components/invite/InviteFloralBackdrop";

export function InviteEntryFlow() {
  const [opened, setOpened] = useState(false);
  const startY = useRef<number | null>(null);

  function onTouchStart(event: React.TouchEvent) {
    startY.current = event.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (startY.current === null) return;

    const endY = event.changedTouches[0]?.clientY ?? startY.current;
    const distance = endY - startY.current;

    if (!opened && distance < -42) setOpened(true);
    if (opened && distance > 70) setOpened(false);

    startY.current = null;
  }

  return (
    <main
      className={`invite-entry ${opened ? "is-open" : ""}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="invite-entry-track">
        <section className="invite-screen cover-final" aria-label="Abertura do convite">
          <div className="cover-final-paper" aria-hidden />

          <Image
            src="/florals/floral-top-left.webp"
            alt=""
            width={1200}
            height={1200}
            priority
            className="cover-final-corner cover-final-corner--left"
          />

          <Image
            src="/florals/floral-top-right.webp"
            alt=""
            width={1200}
            height={1200}
            priority
            className="cover-final-corner cover-final-corner--right"
          />

          <Image
            src="/florals/floral-divider.webp"
            alt=""
            width={1200}
            height={400}
            priority
            className="cover-final-divider-top"
          />

          <div className="cover-final-content">
            <div className="cover-final-monogram">
              <Monogram size={176} priority />
            </div>

            <div className="cover-final-heart-line" aria-hidden>
              <span />
              <b>♡</b>
              <span />
            </div>

            <div className="cover-final-title">
              <p>Pedro &amp; Letícia</p>
              <h1>Chá de Panela</h1>
            </div>

            <div className="cover-final-mini-flourish" aria-hidden>
              <span />
              <i>♢</i>
              <span />
            </div>
          </div>

          <div className="cover-final-kitchen-wrap" aria-hidden>
            <Image
              src="/florals/kitchen-arrangement.webp"
              alt=""
              width={1200}
              height={900}
              priority
              className="cover-final-kitchen"
            />
          </div>

          <div className="cover-final-bottom-haze" aria-hidden>
            <Image
              src="/florals/floral-top-left.webp"
              alt=""
              width={1200}
              height={1200}
              className="cover-final-haze cover-final-haze--left"
            />
            <Image
              src="/florals/floral-top-right.webp"
              alt=""
              width={1200}
              height={1200}
              className="cover-final-haze cover-final-haze--right"
            />
          </div>

          <button
            type="button"
            className="cover-final-open"
            onClick={() => setOpened(true)}
            aria-label="Deslizar para continuar"
          >
            <span className="cover-final-open-line" aria-hidden />
            <strong>Deslize para continuar</strong>
            <span className="cover-final-open-line" aria-hidden />
            <ChevronDown className="cover-final-chevron" size={22} strokeWidth={1.45} />
          </button>

          <style jsx>{`
            .cover-final {
              position: relative;
              overflow: hidden;
              background: #fbf8f1;
              color: #120b7a;
            }

            .cover-final-paper {
              position: absolute;
              inset: 0;
              z-index: 0;
              background:
                linear-gradient(rgba(255, 252, 246, 0.7), rgba(255, 252, 246, 0.7)),
                url('/florals/floral-white-background.webp') center / cover no-repeat;
            }

            :global(.cover-final-corner) {
              position: absolute;
              z-index: 1;
              top: -4.4vh;
              width: min(57vw, 270px);
              height: auto;
              object-fit: contain;
              pointer-events: none;
              user-select: none;
            }

            :global(.cover-final-corner--left) {
              left: -20vw;
            }

            :global(.cover-final-corner--right) {
              right: -20vw;
            }

            :global(.cover-final-divider-top) {
              position: absolute;
              z-index: 2;
              top: 4.7vh;
              left: 50%;
              width: min(58vw, 255px);
              height: auto;
              transform: translateX(-50%);
              pointer-events: none;
              user-select: none;
            }

            .cover-final-content {
              position: absolute;
              z-index: 4;
              top: 17.2vh;
              left: 50%;
              width: min(88vw, 430px);
              transform: translateX(-50%);
              display: grid;
              justify-items: center;
              text-align: center;
            }

            .cover-final-monogram {
              display: grid;
              place-items: center;
              width: 31vw;
              max-width: 176px;
              min-width: 126px;
              margin-bottom: 2.4vh;
            }

            .cover-final-monogram :global(.monogram) {
              width: 100%;
              height: auto;
              object-fit: contain;
            }

            .cover-final-heart-line {
              width: min(58vw, 255px);
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              align-items: center;
              gap: 14px;
              margin-bottom: 2.15vh;
            }

            .cover-final-heart-line span,
            .cover-final-mini-flourish span {
              display: block;
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, #cda347 20%, #cda347 100%);
            }

            .cover-final-heart-line span:last-child,
            .cover-final-mini-flourish span:last-child {
              transform: scaleX(-1);
            }

            .cover-final-heart-line b {
              color: #c99e3a;
              font: 400 30px/1 Georgia, serif;
              transform: translateY(-1px);
            }

            .cover-final-title {
              display: grid;
              gap: .1vh;
              color: #130a82;
              text-wrap: balance;
            }

            .cover-final-title p,
            .cover-final-title h1 {
              margin: 0;
              font-family: var(--font-display), "Times New Roman", Georgia, serif;
              font-weight: 400;
              letter-spacing: -0.035em;
            }

            .cover-final-title p {
              font-size: clamp(2rem, 8vw, 3rem);
              line-height: 1.02;
            }

            .cover-final-title h1 {
              font-size: clamp(2.55rem, 10.5vw, 4rem);
              line-height: .98;
            }

            .cover-final-mini-flourish {
              width: min(38vw, 170px);
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              align-items: center;
              gap: 9px;
              margin-top: 1.8vh;
              color: #c99e3a;
            }

            .cover-final-mini-flourish i {
              font: 400 15px/1 Georgia, serif;
              font-style: normal;
              color: #7d9abb;
            }

            .cover-final-kitchen-wrap {
              position: absolute;
              z-index: 3;
              left: 50%;
              bottom: 5.6vh;
              width: min(109vw, 560px);
              transform: translateX(-50%);
              pointer-events: none;
            }

            :global(.cover-final-kitchen) {
              display: block;
              width: 100%;
              height: auto;
              object-fit: contain;
              filter: saturate(.96) contrast(1.01);
            }

            .cover-final-bottom-haze {
              position: absolute;
              z-index: 2;
              inset: auto 0 0;
              height: 24vh;
              overflow: hidden;
              pointer-events: none;
            }

            :global(.cover-final-haze) {
              position: absolute;
              bottom: -12vh;
              width: min(45vw, 210px);
              height: auto;
              opacity: .16;
              filter: blur(3px);
            }

            :global(.cover-final-haze--left) {
              left: -17vw;
              transform: rotate(180deg);
            }

            :global(.cover-final-haze--right) {
              right: -17vw;
              transform: rotate(180deg);
            }

            .cover-final-open {
              position: absolute;
              z-index: 7;
              left: 50%;
              bottom: max(1.45vh, calc(5px + env(safe-area-inset-bottom)));
              transform: translateX(-50%);
              width: min(84vw, 380px);
              border: 0;
              padding: 4px 0 0;
              background: transparent;
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              align-items: center;
              justify-items: center;
              column-gap: 11px;
              color: #130a82;
            }

            .cover-final-open strong {
              font: 700 10px/1 var(--font-body), Arial, sans-serif;
              letter-spacing: .22em;
              text-transform: uppercase;
              white-space: nowrap;
            }

            .cover-final-open-line {
              width: 100%;
              height: 1px;
              background: #d3ad58;
              opacity: .92;
            }

            .cover-final-chevron {
              grid-column: 1 / -1;
              margin-top: 2px;
              color: #c99e3a;
              animation: coverFinalHint 1.8s ease-in-out infinite;
            }

            @keyframes coverFinalHint {
              0%, 100% { transform: translateY(0); opacity: .72; }
              50% { transform: translateY(5px); opacity: 1; }
            }

            @media (max-width: 390px) {
              :global(.cover-final-corner) {
                width: 60vw;
                top: -3.4vh;
              }

              :global(.cover-final-corner--left) { left: -23vw; }
              :global(.cover-final-corner--right) { right: -23vw; }

              :global(.cover-final-divider-top) {
                width: 59vw;
                top: 4.2vh;
              }

              .cover-final-content {
                top: 16.8vh;
                width: 92vw;
              }

              .cover-final-monogram {
                width: 32vw;
                margin-bottom: 1.8vh;
              }

              .cover-final-heart-line {
                margin-bottom: 1.6vh;
              }

              .cover-final-title p {
                font-size: clamp(1.75rem, 7.6vw, 2.2rem);
              }

              .cover-final-title h1 {
                font-size: clamp(2.25rem, 9.8vw, 3rem);
              }

              .cover-final-kitchen-wrap {
                bottom: 6.7vh;
                width: 112vw;
              }

              .cover-final-open strong {
                font-size: 9px;
                letter-spacing: .19em;
              }
            }

            @media (min-width: 600px) {
              :global(.cover-final-corner--left) { left: -92px; }
              :global(.cover-final-corner--right) { right: -92px; }
              .cover-final-kitchen-wrap { width: 560px; }
            }
          `}</style>
        </section>

        <section className="invite-screen invite-welcome" aria-label="Mensagem do convite">
          <InviteFloralBackdrop soft />

          <div className="invite-welcome-content">
            <Monogram size={64} />
            <p className="invite-kicker">Um convite especial</p>
            <h1>Olá, queremos te convidar para o nosso Chá de Panela!</h1>
            <p className="invite-welcome-copy">
              Preparamos tudo com muito carinho e queremos dividir esse momento com você.
            </p>
            <Link className="invite-primary-action" href="/acesso">
              Acessar convite
            </Link>
          </div>

          <button
            type="button"
            className="invite-back-gesture"
            onClick={() => setOpened(false)}
            aria-label="Voltar para a capa"
          >
            voltar
          </button>
        </section>
      </div>
    </main>
  );
}
