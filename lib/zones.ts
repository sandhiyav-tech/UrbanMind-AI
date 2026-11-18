import { ZoneConfig } from './types';

export const CHENNAI_ZONES: ZoneConfig[] = [
  {
    id: 'adyar',
    name: 'Adyar',
    lat: 13.0012,
    lng: 80.2565,
    population_density: 14200,
    description: 'South coastal Chennai zone with river estuary, IT corridor access, and high residential density.',
    polygon: [
      [13.015, 80.245],
      [13.018, 80.265],
      [12.990, 80.270],
      [12.985, 80.250],
      [13.000, 80.242],
    ],
  },
  {
    id: 't_nagar',
    name: 'T. Nagar',
    lat: 13.0418,
    lng: 80.2341,
    population_density: 24500,
    description: 'Primary commercial and retail epicenter with intense pedestrian traffic and transit bottlenecks.',
    polygon: [
      [13.055, 80.222],
      [13.052, 80.248],
      [13.030, 80.245],
      [13.028, 80.225],
      [13.045, 80.218],
    ],
  },
  {
    id: 'velachery',
    name: 'Velachery',
    lat: 12.9815,
    lng: 80.2180,
    population_density: 16800,
    description: 'Rapidly expanded IT and residential hub historically vulnerable to monsoon waterlogging and lake overflow.',
    polygon: [
      [12.995, 80.208],
      [12.998, 80.230],
      [12.968, 80.232],
      [12.965, 80.205],
      [12.980, 80.200],
    ],
  },
  {
    id: 'anna_nagar',
    name: 'Anna Nagar',
    lat: 13.0850,
    lng: 80.2101,
    population_density: 19200,
    description: 'Planned residential and commercial sector with grid street layouts and major arterial connectors.',
    polygon: [
      [13.100, 80.198],
      [13.098, 80.225],
      [13.070, 80.222],
      [13.068, 80.200],
      [13.085, 80.192],
    ],
  },
  {
    id: 'tondiarpet',
    name: 'Tondiarpet',
    lat: 13.1250,
    lng: 80.2880,
    population_density: 27800,
    description: 'High-density North Chennai industrial and port-adjacent zone with intense municipal service demands.',
    polygon: [
      [13.140, 80.275],
      [13.138, 80.302],
      [13.110, 80.298],
      [13.108, 80.278],
      [13.125, 80.270],
    ],
  },
  {
    id: 'guindy',
    name: 'Guindy',
    lat: 13.0067,
    lng: 80.2025,
    population_density: 15400,
    description: 'Strategic junction connecting industrial estate, race course, national park, and multimodal transit.',
    polygon: [
      [13.020, 80.190],
      [13.018, 80.215],
      [12.992, 80.212],
      [12.995, 80.192],
      [13.008, 80.185],
    ],
  },
];

export const MIN_ZONE_DENSITY = Math.min(...CHENNAI_ZONES.map((z) => z.population_density));
export const MAX_ZONE_DENSITY = Math.max(...CHENNAI_ZONES.map((z) => z.population_density));

export function getZoneById(id: string): ZoneConfig | undefined {
  return CHENNAI_ZONES.find((z) => z.id.toLowerCase() === id.toLowerCase() || z.name.toLowerCase() === id.toLowerCase());
}
