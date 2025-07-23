"use client";

import { useState } from "react";
import { EnhancedParkUpdater } from "~/app/_components/enhanced-park-updater";
import { RideTable } from "~/app/_components/ride-table";
import { ParkNameManager } from "~/app/_components/park-name-manager";

export default function Home() {
  const [currentParkId, setCurrentParkId] = useState(""); // Start with empty, will auto-select first available park
  const [showParkManager, setShowParkManager] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Park</span>Master
        </h1>

        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">
            Real-time Theme Park Wait Times
          </p>
          <p className="text-lg text-gray-300">
            Select a park and update data to see current ride wait times
          </p>
        </div>

        <EnhancedParkUpdater 
          onParkChange={setCurrentParkId} 
          currentParkId={currentParkId} 
        />
        
        <RideTable parkId={currentParkId} />

        {/* Park Name Manager Toggle */}
        {/* <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setShowParkManager(!showParkManager)}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            {showParkManager ? "Hide" : "Show"} Park Name Manager
          </button>
          
          {showParkManager && (
            <div className="w-full max-w-2xl">
              <ParkNameManager />
            </div>
          )}
        </div> */}
      </div>
    </main>
  );
}
