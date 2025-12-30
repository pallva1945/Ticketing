export enum TicketZone {
  SKYBOX = 'Skyboxes',
  COURTSIDE = 'Courtside',
  PAR_EX = 'Parterre Exclusive',
  PAR_O = 'Parterre Ovest',
  PAR_E = 'Parterre Est',
  TRIB_G = 'Tribuna Gold',
  TRIB_S = 'Tribuna Silver',
  GALL_G = 'Galleria Gold',
  GALL_S = 'Galleria Silver',
  CURVA = 'Curva',
  OSPITI = 'Ospiti'
}

export enum SalesChannel {
  ABB = 'Season Tickets (Abb)',
  MP = 'Mini Plans',
  TIX = 'Single Game (Tix)',
  VB = 'Varese Basketball (Youth)',
  CORP = 'Corporate',
  GIVEAWAY = 'Giveaway/Protocol'
}

export interface SalesDataPoint {
  zone: TicketZone;
  channel: SalesChannel;
  quantity: number;
  revenue: number;
}

export interface GameData {
  id: string; // Date + Time + Opponent
  opponent: string;
  date: string;
  attendance: number;
  capacity: number;
  zoneCapacities: Record<string, number>; // Dynamic capacity per zone for this specific game
  totalRevenue: number;
  salesBreakdown: SalesDataPoint[];
  league: string;
  season: string;
  oppRank: number;
  pvRank: number;
  tier: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalRevenue: number;
  avgAttendance: number;
  topPerformingZone: string;
  occupancyRate: number;
}

export interface StatsCardsProps {
  stats: DashboardStats;
  data: GameData[];
  fullDataset: GameData[];
  filters: {
    season: string[];
    league: string[];
    zone: string[];
    opponent: string[];
    tier: string[];
  };
}