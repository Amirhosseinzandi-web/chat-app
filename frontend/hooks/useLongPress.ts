"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type LongPressPos = { x: number; y: number };

type Options = {
    /** called once the press is held long enough; receives the press position */
    onLongPress: (pos: LongPressPos) => void;
    /** hold duration in ms (Telegram uses ~450-500) */
    delay?: number;
    /** movement (px) that cancels the press so scrolling/dragging still works */
    moveTolerance?: number;
};

/**
 * Telegram-style long press for mouse, touch and pen (Pointer Events).
 * - a quick click never triggers it
 * - moving more than moveTolerance px cancels it (scroll/drag keep working)
 * - pointercancel (browser takes over for scrolling) cancels it
 * - after firing, releasing the button does NOT undo it (the callback owns state)
 */
export const useLongPress = ({ onLongPress, delay = 450, moveTolerance = 10 }: Options) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startRef = useRef<LongPressPos | null>(null);
    const [pressing, setPressing] = useState(false);

    const clear = useCallback(() => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setPressing(false);
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return; // primary button only
        startRef.current = { x: e.clientX, y: e.clientY };

        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            if ("vibrate" in navigator) navigator.vibrate(10); // haptic where supported
            onLongPress({ x: e.clientX, y: e.clientY });
        }, delay);

        const cleanup = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onCancel);
            window.removeEventListener("blur", onCancel);
        };
        const onMove = (ev: PointerEvent) => {
            const s = startRef.current;
            if (!s) return;
            if (Math.abs(ev.clientX - s.x) > moveTolerance || Math.abs(ev.clientY - s.y) > moveTolerance) {
                clear();
                cleanup();
            }
        };
        const onUp = () => { clear(); cleanup(); };   // released early -> nothing happens
        const onCancel = () => { clear(); cleanup(); }; // browser took over (scroll) / blur

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
        window.addEventListener("blur", onCancel);
    }, [clear, delay, moveTolerance, onLongPress]);

    // safety: clear everything if the component unmounts mid-press
    useEffect(() => clear, [clear]);

    return { handlers: { onPointerDown }, pressing, cancelPress: clear };
};
