export default function AppLogo() {
    return (
        <>
            <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)] reader:from-[#3EBD93] reader:to-[#199473]">
                <span className="font-display text-[14px] font-[800] leading-none text-white reader:text-[#0A1929]">
                    S
                </span>
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate font-display text-[16px] font-bold leading-tight tracking-[-0.02em] text-white">
                    Skoolpad
                </span>
            </div>
        </>
    );
}
