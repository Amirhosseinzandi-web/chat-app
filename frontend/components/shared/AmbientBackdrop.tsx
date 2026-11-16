/**
 * Liquid Glass ambient world: layered gradients + drifting light orbs.
 * Pure CSS (no images, no JS timers), rendered behind everything.
 */
const AmbientBackdrop = () => (
    <div className="ambient-world" aria-hidden="true">
        <div className="glass-orb size-[420px] -top-24 -left-16 opacity-70" />
        <div className="glass-orb o2 size-[280px] top-1/3 -right-14 opacity-50" />
        <div className="glass-orb o3 size-[200px] bottom-[-60px] left-1/4 opacity-40" />
    </div>
);

export default AmbientBackdrop;
