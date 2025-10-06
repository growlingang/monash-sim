import { z } from 'zod';

const tileSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  type: z.enum(['collision', 'prop']),
  asset: z.string().optional(),
});

const hotspotSchema = z.object({
  id: z.enum(['cafeteria', 'library', 'lecture']),
  label: z.string(),
  trigger: z.tuple([z.number().int(), z.number().int()]),
  width: z.number().int().default(1),
  height: z.number().int().default(1),
});

export const campusMapSchema = z.object({
  width: z.number().int(),
  height: z.number().int(),
  tileSize: z.number().int(),
  playerSpawn: z.tuple([z.number().int(), z.number().int()]),
  hotspots: z.array(hotspotSchema),
  tiles: z.array(tileSchema),
});

export type CampusMapData = z.infer<typeof campusMapSchema>;

const rawCampusMap: CampusMapData = {
  width: 20,
  height: 12,
  tileSize: 32,
  playerSpawn: [3, 9],
  hotspots: [
    {
      id: 'cafeteria',
      label: 'Campus Cafeteria',
      trigger: [7, 5],
      width: 3,
      height: 3,
    },
    {
      id: 'library',
      label: 'Library Entrance',
      trigger: [12, 4],
      width: 2,
      height: 2,
    },
    {
      id: 'lecture',
      label: 'Lecture Theatre 3',
      trigger: [16, 6],
      width: 2,
      height: 2,
    },
  ],
  tiles: [
    { x: 0, y: 0, type: 'collision' },
    { x: 0, y: 1, type: 'collision' },
    { x: 0, y: 2, type: 'collision' },
    { x: 0, y: 3, type: 'collision' },
    { x: 0, y: 4, type: 'collision' },
    { x: 0, y: 5, type: 'collision' },
    { x: 0, y: 6, type: 'collision' },
    { x: 0, y: 7, type: 'collision' },
    { x: 0, y: 8, type: 'collision' },
    { x: 0, y: 9, type: 'collision' },
    { x: 0, y: 10, type: 'collision' },
    { x: 0, y: 11, type: 'collision' },
    { x: 19, y: 0, type: 'collision' },
    { x: 19, y: 1, type: 'collision' },
    { x: 19, y: 2, type: 'collision' },
    { x: 19, y: 3, type: 'collision' },
    { x: 19, y: 4, type: 'collision' },
    { x: 19, y: 5, type: 'collision' },
    { x: 19, y: 6, type: 'collision' },
    { x: 19, y: 7, type: 'collision' },
    { x: 19, y: 8, type: 'collision' },
    { x: 19, y: 9, type: 'collision' },
    { x: 19, y: 10, type: 'collision' },
    { x: 19, y: 11, type: 'collision' },
    { x: 6, y: 4, type: 'prop', asset: 'bench' },
    { x: 13, y: 7, type: 'prop', asset: 'bench' },
    { x: 4, y: 6, type: 'prop', asset: 'tree' },
    { x: 10, y: 3, type: 'prop', asset: 'tree' },
  ],
};

export const CAMPUS_MAP = campusMapSchema.parse(rawCampusMap);
