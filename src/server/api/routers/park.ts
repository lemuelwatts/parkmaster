import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import admin from "firebase-admin";
import { db } from "~/server/firebase";

interface QueueTimesRide {
  id: string | number;
  name?: string;
  wait_time?: number;
  is_open?: boolean;
  last_updated?: number;
}

interface QueueTimesLand {
  rides?: QueueTimesRide[];
}

interface QueueTimesResponse {
  lands?: QueueTimesLand[];
}

interface FirestoreDocumentData {
  [key: string]: unknown;
  name?: string;
  wait_time?: number | null;
  is_open?: boolean;
  last_api_update?: admin.firestore.Timestamp;
  updated_at?: admin.firestore.Timestamp;
}

function toDateSafe(timestamp: unknown): Date | null {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as admin.firestore.Timestamp).toDate();
  }
  return null;
}

export const parkRouter = createTRPCRouter({
  updateWaits: publicProcedure
    .input(z.object({ parkId: z.string() }))
    .mutation(async ({ input }) => {
      const res = await fetch(
        `https://queue-times.com/parks/${input.parkId}/queue_times.json`
      );
      
      if (!res.ok) {
        throw new Error(`Failed to fetch park data: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json() as QueueTimesResponse;
      
      if (!data.lands || !Array.isArray(data.lands)) {
        throw new Error("Invalid API response: missing lands data");
      }
      
      const batch = db.batch();

      data.lands.forEach((land: QueueTimesLand) =>
        land.rides?.forEach((ride: QueueTimesRide) => {
          if (!ride.id) return; // Skip rides without ID
          
          const ref = db
            .collection("parks")
            .doc(input.parkId)
            .collection("rides")
            .doc(ride.id.toString());
          batch.set(
            ref,
            {
              name: ride.name ?? "Unknown Ride",
              wait_time: typeof ride.wait_time === 'number' ? ride.wait_time : null,
              is_open: Boolean(ride.is_open),
              last_api_update: ride.last_updated && typeof ride.last_updated === 'number' 
                ? new Date(ride.last_updated * 1000) 
                : new Date(),
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        })
      );

      await batch.commit();
      return { success: true, count: data.lands.flatMap((l: QueueTimesLand) => l.rides ?? []).length };
    }),

  getRides: publicProcedure
    .input(z.object({ parkId: z.string() }))
    .query(async ({ input }) => {
      try {
        const ridesSnapshot = await db
          .collection("parks")
          .doc(input.parkId)
          .collection("rides")
          .orderBy("name")
          .get();

        const rides = ridesSnapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreDocumentData;
          return {
            id: doc.id,
            name: data.name ?? "Unknown Ride",
            wait_time: data.wait_time ?? null,
            is_open: data.is_open ?? false,
            last_api_update: toDateSafe(data.last_api_update),
            updated_at: toDateSafe(data.updated_at),
          };
        });

        return rides;
      } catch (error) {
        console.error("Error fetching rides:", error);
        throw new Error("Failed to fetch rides from database");
      }
    }),

  getParks: publicProcedure
    .query(async () => {
      try {
        const parksSnapshot = await db
          .collection("parks")
          .get();

        const parks = parksSnapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreDocumentData;
          return {
            id: doc.id,
            name: data.name ?? `Park ${doc.id}`,
          };
        }).filter(park => park.name !== `Park ${park.id}`); // Only include parks with actual names

        return parks.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error("Error fetching parks:", error);
        throw new Error("Failed to fetch parks from database");
      }
    }),

  setParkName: publicProcedure
    .input(z.object({ 
      parkId: z.string(), 
      name: z.string() 
    }))
    .mutation(async ({ input }) => {
      try {
        await db
          .collection("parks")
          .doc(input.parkId)
          .set(
            { name: input.name },
            { merge: true }
          );

        return { success: true, parkId: input.parkId, name: input.name };
      } catch (error) {
        console.error("Error setting park name:", error);
        throw new Error("Failed to set park name in database");
      }
    }),
});
