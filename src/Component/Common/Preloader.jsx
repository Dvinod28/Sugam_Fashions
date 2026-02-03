import React from "react";

const Preloader = () => {
    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Background video */}
            <video
                id="preloader-video"
                className="absolute inset-0 w-full h-full object-cover"
                src="/videos/preloader.mp4"
                autoPlay
                muted
                playsInline
            />

            {/* Subtle royal overlay and vignette */}
            <div className="absolute inset-0 preloader-vignette" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

            {/* Center content */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-6 px-6 text-center">
                <img
                    src="/images/logo.png"
                    alt="Brand Logo"
                    className="w-34 sm:w-32 md:w-44 lg:w-52 xl:w-60 preloader-logo"
                    loading="lazy"
                />

                <div className="absolute bottom-6 ">
                    {/* Loading indicator */}
                    <div className=" flex items-center justify-center mb-3 gap-2">
                        <span className="sr-only">Loading</span>
                        <div className="w-2 h-2 rounded-full bg-amber-300/90 preloader-dot delay-[0ms]" />
                        <div className="w-2 h-2 rounded-full bg-amber-300/80 preloader-dot delay-[150ms]" />
                        <div className="w-2 h-2 rounded-full bg-amber-300/70 preloader-dot delay-[300ms]" />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="h-px w-48 sm:w-60 md:w-72 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent preloader-shine" />
                        <p className="text-amber-200/90 tracking-[0.35em] text-xs sm:text-sm md:text-base uppercase">
                            Curated Elegance
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preloader;
