"use client";

import { useState, useEffect } from "react";
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
        onChange={(e) => onParkChange(e.target.value)}
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
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available parks
  const { 
    data: parks = [], 
    isLoading: parksLoading, 
    error: parksError 
  } = api.park.getParks.useQuery();

  // Auto-select first park if none selected and parks are available
  useEffect(() => {
    if (parks.length > 0 && !currentParkId) {
      onParkChange(parks[0]!.id);
    }
  }, [parks, currentParkId, onParkChange]);

  const updateWaits = api.park.updateWaits.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      setIsLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setResult(null);
      setIsLoading(false);
    },
  });

  const handleUpdateWaits = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    updateWaits.mutate({ parkId: currentParkId });
  };

  const currentParkName = parks.find(park => park.id === currentParkId)?.name ?? "Selected Park";

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
      
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleUpdateWaits}
          disabled={isLoading || !currentParkId || parks.length === 0}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Updating..." : `Update ${currentParkName} Wait Times`}
        </button>

        {result && (
          <div className="text-center text-green-400">
            <p>✅ Successfully updated {result.count} rides!</p>
            <p className="text-sm text-gray-300">Data stored in Firestore</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400">
            <p>❌ Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
