import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.lemuelwatts.synology.me');

await pb.collection("_superusers").authWithPassword(
  process.env.PB_EMAIL!,
  process.env.PB_PASSWORD!
);

interface RideRecord {
  id: string;
  name?: string;
  wait_time?: number;
  is_open?: boolean;
  last_api_update?: string | Date | null;
  updated_at?: string | Date | null;
}

interface ParkRecord {
  id: string;
  api_id?: string;
  name?: string;
}

export const parkRouter = createTRPCRouter({

  getRides: publicProcedure
    .input(z.object({ parkId: z.string() }))
    .query(async ({ input }) => {
      try {
        // Find park by api_id
        const parks = await pb.collection('parks').getFullList({
          filter: `api_id = "${input.parkId}"`
        });
        if (!parks?.length) throw new Error('Park not found');
        const park = parks?.[0];

        // Get rides for this park
        const rides = await pb.collection('rides').getFullList({
          filter: `park_id = "${park?.id}"`,
          sort: 'name'
        });

        return rides.map((ride: RideRecord) => ({
          id: ride.id,
          name: ride.name ?? 'Unknown Ride',
          wait_time: ride.wait_time ?? null,
          is_open: ride.is_open ?? false,
          last_api_update: ride.last_api_update ? new Date(ride.last_api_update) : null,
          updated_at: ride.updated_at ? new Date(ride.updated_at) : null,
        }));
      } catch (error) {
        console.error('Error fetching rides:', error);
        throw new Error('Failed to fetch rides from PocketBase');
      }
    }),

  getParks: publicProcedure
    .query(async () => {
      try {
        const parks = await pb.collection('parks').getFullList({
          sort: 'name',
        });
        // Only include parks with actual names
        return parks
          .filter((park: ParkRecord) => park?.name && park?.api_id)
          .map((park: ParkRecord) => ({
            id: park?.api_id ?? '',
            name: park?.name ?? '',
          }));
      } catch (error) {
        console.error('Error fetching parks:', error);
        throw new Error('Failed to fetch parks from PocketBase');
      }
    }),

  setParkName: publicProcedure
    .input(z.object({ 
      parkId: z.string(), 
      name: z.string() 
    }))
    .mutation(async ({ input }) => {
      try {
        // Find park by api_id
        const parks = await pb.collection('parks').getFullList({
          filter: `api_id = "${input.parkId}"`
        });
        if (!parks?.length) throw new Error('Park not found');
        const park = parks?.[0];
        if (!park?.id) throw new Error('Park record missing id');
        await pb.collection('parks').update(park?.id, { name: input.name });
        return { success: true, parkId: input?.parkId, name: input?.name };
      } catch (error) {
        console.error('Error setting park name:', error);
        throw new Error('Failed to set park name in PocketBase');
      }
    }),
});
