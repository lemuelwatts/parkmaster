"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function ParkUpdater() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    
    // Example park ID - you can change this to any valid park ID from queue-times.com
    // Some popular ones: "110" (Magic Kingdom), "120" (EPCOT), "130" (Hollywood Studios), "150" (Animal Kingdom)
    updateWaits.mutate({ parkId: "6" });
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-6">
      <h2 className="text-2xl font-bold">Park Data Updater</h2>
      
      <button
        onClick={handleUpdateWaits}
        disabled={isLoading}
        className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Updating..." : "Update Park Wait Times"}
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
  );
}
