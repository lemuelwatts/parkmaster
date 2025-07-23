"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function ParkNameManager() {
  const [parkId, setParkId] = useState("");
  const [parkName, setParkName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const setParkNameMutation = api.park.setParkName.useMutation({
    onSuccess: (data) => {
      setResult(`✅ Successfully set "${data.name}" for park ID ${data.parkId}`);
      setIsLoading(false);
      setParkId("");
      setParkName("");
    },
    onError: (error) => {
      setResult(`❌ Error: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parkId.trim() || !parkName.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setParkNameMutation.mutate({ parkId: parkId.trim(), name: parkName.trim() });
  };

  return (
    <div className="rounded-xl bg-white/5 p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Add Park Name</h3>
      <p className="text-sm text-gray-300 mb-4">
        If parks don&apos;t show up in the dropdown, you can manually add park names here.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Park ID (e.g., 6, 110, 120)"
            value={parkId}
            onChange={(e) => setParkId(e.target.value)}
            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white placeholder-gray-400 border border-white/20 focus:border-white/40 focus:outline-none"
            disabled={isLoading}
          />
          <input
            type="text"
            placeholder="Park Name (e.g., Universal Studios Florida)"
            value={parkName}
            onChange={(e) => setParkName(e.target.value)}
            className="flex-2 rounded-lg bg-white/10 px-3 py-2 text-white placeholder-gray-400 border border-white/20 focus:border-white/40 focus:outline-none"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !parkId.trim() || !parkName.trim()}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Adding..." : "Add Park Name"}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-3 rounded-lg bg-black/20">
          <p className="text-sm">{result}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-400">
        <p className="font-semibold">Popular Park IDs:</p>
        <p>6 = Universal Studios Florida, 7 = Islands of Adventure</p>
        <p>110 = Magic Kingdom, 120 = EPCOT, 130 = Hollywood Studios, 150 = Animal Kingdom</p>
      </div>
    </div>
  );
}
