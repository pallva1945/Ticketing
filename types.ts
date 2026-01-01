
export enum TicketZone {
  SKYBOX = 'Skyboxes',
  COURTSIDE = 'Courtside',
  PAR_O = 'Parterre Ovest', // Wraps 3 sides
  PAR_E = 'Parterre Est',   // Bench side
  TRIB_G = 'Tribuna Gold',
  TRIB_S = 'Tribuna Silver',
  GALL_G = 'Galleria Gold',
  GALL_S = 'Galleria Silver',
  CURVA = 'Curva',
  OSPITI = 'Ospiti',
  PAR_EX = 'Parterre Exclusive' // Kept for data mapping, usually merged into Par O in visual if needed, but distinct in data
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

export interface TicketTypeBreakdown {
  full: number;
  discount: number;
  giveaway: number;
  discountDetails: Record<string, number>;
  giveawayDetails: Record<string, number>;
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
  pnlBreakdown: Record<number, number>; // Monthly PnL columns 1-12
  ticketTypeBreakdown?: TicketTypeBreakdown; // Detailed breakdown of ticket types
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
  giveawayRate: number;
}

export interface KPIConfig {
  revenueGrowth: number; // Percentage (e.g., 10 for 10%)
  attendanceGrowth: number; // Percentage
  giveawayTarget: number; // Fixed percentage target (e.g., 7%)
  baselineMode: 'prev_season' | 'avg_2_seasons';
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
  kpiConfig: KPIConfig;
}