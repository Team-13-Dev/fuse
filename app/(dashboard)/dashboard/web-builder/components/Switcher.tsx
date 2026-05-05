"use client";

import { useState } from "react";

interface SegmentedSwitchProps {
  options: string[];
  defaultValue?: string;
  onChange?: (selected: string) => void;
}

export default function SegmentedSwitch({
  options,
  defaultValue,
  onChange,
}: SegmentedSwitchProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || options[0]);

  const handleTabClick = (option: string) => {
    setActiveTab(option);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-medium text-slate-600 shadow-inner dark:bg-slate-800 dark:text-slate-400">
      {options.map((option) => {
        const isActive = activeTab === option;
        return (
          <button
            key={option}
            onClick={() => handleTabClick(option)}
            className={`
              px-4 py-2 rounded-xl transition-all duration-200 ease-in-out cursor-pointer
              ${
                isActive
                  ? "bg-white text-slate-900 shadow-md font-semibold dark:bg-slate-700 dark:text-white"
                  : "hover:text-slate-900 dark:hover:text-slate-200"
              }
            `}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}