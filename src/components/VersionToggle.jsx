import { useState, useEffect, useRef } from "react";
import { useVersion } from "../context/versionContext";
import { Server, Sliders, ChevronDown } from "lucide-react";

export default function VersionToggle() {
  const { version, changeVersion } = useVersion();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (v) => {
    changeVersion(v);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/5 text-[10px] sm:text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg backdrop-blur-md"
      >
        {version === "v1" ? (
          <>
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>V1 <span className="hidden lg:inline">(Standard)</span></span>
          </>
        ) : (
          <>
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>V2 <span className="hidden lg:inline">(Fractional)</span></span>
          </>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-950/90 border border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-md">
          <button
            onClick={() => handleSelect("v1")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer border ${
              version === "v1"
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Version V1</span>
              <span className="text-[9px] opacity-60">Standard API Order</span>
            </div>
          </button>
          
          <div className="h-[1px] bg-white/5 my-1" />

          <button
            onClick={() => handleSelect("v2")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer relative overflow-hidden border ${
              version === "v2"
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Version V2</span>
              <span className="text-[9px] opacity-60">Fractional API Position</span>
            </div>
            {version !== "v2" && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

