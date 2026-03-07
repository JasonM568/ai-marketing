"use client";

interface ViewToggleProps {
  view: "list" | "calendar";
  onChange: (view: "list" | "calendar") => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === "list"
            ? "bg-blue-600/20 text-blue-400"
            : "text-gray-500 hover:text-gray-300"
        }`}
        title="列表檢視"
      >
        {/* List icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden sm:inline">列表</span>
      </button>
      <button
        onClick={() => onChange("calendar")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === "calendar"
            ? "bg-blue-600/20 text-blue-400"
            : "text-gray-500 hover:text-gray-300"
        }`}
        title="日曆檢視"
      >
        {/* Calendar grid icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">日曆</span>
      </button>
    </div>
  );
}
