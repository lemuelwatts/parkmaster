"use client";

import { useEffect } from "react";
import { api } from "~/trpc/react";

interface Park {
  id: string;
  name: string;
}

interface ParkSelectorProps {
  onParkChange: (parkId: string) => void;
  currentParkId: string;
  parks: Park[];
  isLoading: boolean;
}

export function ParkSelector({ onParkChange, currentParkId, parks, isLoading }: ParkSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold text-white">Select Park</h3>
      <select
        value={currentParkId}
        onChange={(e) => {
          if (typeof e.target.value === 'string') {
            onParkChange(e.target.value);
          }
        }}
        disabled={isLoading || parks.length === 0}
        className="rounded-lg bg-white/10 px-4 py-2 text-white border border-white/20 focus:border-white/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[250px]"
      >
        {isLoading ? (
          <option value="">Loading parks...</option>
        ) : parks.length === 0 ? (
          <option value="">No parks available</option>
        ) : (
          parks.map((park) => (
            <option key={park.id} value={park.id} className="bg-gray-800 text-white">
              {park.name}
            </option>
          ))
        )}
      </select>
      {parks.length === 0 && !isLoading && (
        <p className="text-sm text-gray-400 text-center">
          No parks found in database. Try updating park data first.
        </p>
      )}
    </div>
  );
}

interface EnhancedParkUpdaterProps {
  onParkChange: (parkId: string) => void;
  currentParkId: string;
}

export function EnhancedParkUpdater({ onParkChange, currentParkId }: EnhancedParkUpdaterProps) {
  // Fetch available parks
  const {
    data: parks = [],
    isLoading: parksLoading,
    error: parksError,
  } = api.park.getParks.useQuery();

  // Auto-select first park if none selected and parks are available
  useEffect(() => {
    if (Array.isArray(parks) && parks.length > 0 && !currentParkId) {
      const firstPark = parks[0];
      if (firstPark && typeof firstPark.id === 'string') {
        onParkChange(firstPark.id);
      }
    }
  }, [parks, currentParkId, onParkChange]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl bg-white/10 p-6">
      <h2 className="text-2xl font-bold text-white">Park Data Manager</h2>
      {parksError && (
        <div className="text-center text-red-400">
          <p>❌ Error loading parks: {parksError.message}</p>
        </div>
      )}
      <ParkSelector
        onParkChange={onParkChange}
        currentParkId={currentParkId}
        parks={parks}
        isLoading={parksLoading}
      />
    </div>
  );
}