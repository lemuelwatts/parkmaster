import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import admin from "firebase-admin";
import { db } from "~/server/firebase";

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
      
      const data = await res.json();
      
      if (!data.lands || !Array.isArray(data.lands)) {
        throw new Error("Invalid API response: missing lands data");
      }
      
      const batch = db.batch();

      data.lands.forEach((land: any) =>
        land.rides?.forEach((ride: any) => {
          if (!ride.id) return; // Skip rides without ID
          
          const ref = db
            .collection("parks")
            .doc(input.parkId)
            .collection("rides")
            .doc(ride.id.toString());
          batch.set(
            ref,
            {
              name: ride.name || "Unknown Ride",
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
      return { success: true, count: data.lands.flatMap((l: any) => l.rides).length };
    }),
});
