"use client";

import { api } from "~/trpc/react";


interface Ride {
  id: string;
  name: string;
  is_open: boolean;
  wait_time: number | null;
  updated_at: Date | null;
}


interface RideTableProps {
  parkId: string;
}

export function RideTable({ parkId }: RideTableProps) {
  const { data, isLoading, error, refetch } = api.park.getRides.useQuery(
    { parkId },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!parkId, // Only run query if parkId is not empty
    }
  );
  const rides = (Array.isArray(data) ? data : []) as Ride[];

  if (!parkId) {
    return (
      <div className="w-full max-w-6xl rounded-xl bg-white/10 p-6 text-center">
        <p className="text-white">Please select a park to view ride data.</p>
      </div>
    );
  }

  const formatTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getWaitTimeDisplay = (waitTime: number | null, isOpen: boolean) => {
    if (!isOpen) return "Closed";
    if (waitTime === null || waitTime === undefined) return "N/A";
    if (waitTime === 0) return "Walk On";
    return `${waitTime} min`;
  };

  const getStatusColor = (isOpen: boolean, waitTime: number | null) => {
    if (!isOpen) return "text-red-400";
    if (waitTime === null) return "text-gray-400";
    if (waitTime === 0) return "text-green-400";
    if (waitTime <= 30) return "text-yellow-400";
    return "text-orange-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading ride data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-900/20 p-6 text-center">
        <p className="text-red-400">Error loading rides: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!Array.isArray(rides) || rides.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-6 text-center">
        <p className="text-white">No ride data available for this park.</p>
        <p className="text-sm text-gray-400 mt-2">
          Try updating the park data first.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl rounded-xl bg-white/10 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Current Wait Times</h2>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-white/20">
              <th className="px-4 py-3 text-left text-white">Ride Name</th>
              <th className="px-4 py-3 text-center text-white">Wait Time</th>
              <th className="px-4 py-3 text-center text-white">Status</th>
              <th className="px-4 py-3 text-center text-white">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => {
              if (!ride || typeof ride.id !== 'string') return null;
              return (
                <tr key={ride.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{ride.name}</td>
                  <td className={`px-4 py-3 text-center font-bold ${getStatusColor(ride.is_open, ride.wait_time)}`}>
                    {getWaitTimeDisplay(ride.wait_time, ride.is_open)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        ride.is_open
                          ? "bg-green-900/50 text-green-400"
                          : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {ride.is_open ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300">
                    {formatTime(ride.updated_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-400">
        Showing {rides.length} rides • Data refreshes every 5 minutes
      </div>
    </div>
  );
}
