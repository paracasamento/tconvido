"use client";

import { useRef, useState } from "react";
import { AccessForm } from "@/components/AccessForm";
import { InviteCanvas } from "@/components/invite/InviteCanvas";
import type { InviteScreen } from "@/lib/invite-builder";

const OPEN_THRESHOLD_PX = 74;

export function InviteEntryFlow({
  coverScreen,
  accessScreen,
}: {
  coverScreen: InviteScreen;
  accessScreen: InviteScreen;
}) {
  const [dragY, setDragY] = useState(0);
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const startY = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);

  const accessSlot = accessScreen.elements.find(
    element => element.slot === "access-form"
  );

  function beginDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (opening || opened) return;

    startY.current = event.clientY;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (startY.current === null || opening || opened) return;

    const delta = event.clientY - startY.current;
    setDragY(Math.min(0, delta));
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (startY.current === null || opening || opened) return;

    const distance = Math.abs(Math.min(0, event.clientY - startY.current));

    startY.current = null;
    pointerId.current = null;

    if (distance >= OPEN_THRESHOLD_PX) {
      setOpening(true);
      setDragY(-window.innerHeight * 1.12);
      window.setTimeout(() => {
        setOpened(true);
        setOpening(false);
      }, 430);
      return;
    }

    setDragY(0);
  }

  function cancelDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (
      pointerId.current !== null &&
      event.pointerId !== pointerId.current
    ) {
      return;
    }

    startY.current = null;
    pointerId.current = null;
    setDragY(0);
  }

  return (
    <div className="invite-entry-stack">
      <div
        className="invite-entry-access"
        aria-hidden={!opened}
        style={{ pointerEvents: opened ? "auto" : "none" }}
      >
        <InviteCanvas
          screen={accessScreen}
          slots={{
            "access-form": (
              <AccessForm
                key="access-form"
                parts={accessSlot?.partStyles}
                redirectTo="/convite"
              />
            ),
          }}
        />
      </div>

      {!opened && (
        <div
          className={`invite-entry-cover${opening ? " is-opening" : ""}`}
          style={{ transform: `translate3d(0, ${dragY}px, 0)` }}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={cancelDrag}
          role="presentation"
        >
          <InviteCanvas
            screen={coverScreen}
            className="visual-invite-cover"
          />
        </div>
      )}
    </div>
  );
}
