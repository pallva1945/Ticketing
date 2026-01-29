
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
  PROTOCOL = 'Protocol (Fixed)',
  GIVEAWAY = 'Giveaway (Dynamic)'
}

export type RevenueModule = 'home' | 'ticketing' | 'gameday' | 'sponsorship' | 'merchandising' | 'venue_ops' | 'bops' | 'sg' | 'crm';

export interface SalesDataPoint {
  zone: TicketZone;
  channel: SalesChannel;
  quantity: number;
  revenue: number;
}

export interface TicketTypeBreakdown {
  // Total view (protocol + free)
  full: number;
  discount: number;
  giveaway: number;
  // GameDay view (free only, no protocol)
  fullGameDay?: number;
  discountGameDay?: number;
  giveawayGameDay?: number;
  // Protocol portion (fixed capacity - Total view only)
  giveawayProtocol?: number;
  discountDetails: Record<string, number>;
  giveawayDetails: Record<string, number>;
}

export interface GameData {
  id: string; // Date + Time + Opponent
  opponent: string;
  date: string;
  // Total view metrics (includes protocol)
  attendance: number;         // Total attendance (paid + protocol + free)
  totalRevenue: number;       // Total revenue
  // GameDay view metrics (excludes protocol)
  attendanceGameDay?: number; // GameDay attendance (paid + free, no protocol)
  revenueGameDay?: number;    // GameDay revenue (same as total for now)
  capacity: number;
  zoneCapacities: Record<string, number>; // Dynamic capacity per zone for this specific game
  corpRevenue: number; // Aggregate Corp Eur from CSV
  salesBreakdown: SalesDataPoint[];
  league: string;
  season: string;
  oppRank: number;
  pvRank: number;
  tier: number;
  pnlBreakdown: Record<number, number>; // Monthly PnL columns 1-12
  ticketTypeBreakdown?: TicketTypeBreakdown; // Detailed breakdown of ticket types
}

export interface GameDayData {
  date: string;
  season: string;
  league: string;
  opponent: string;
  attendance: number;
  totalRevenue: number;
  
  // Revenue Streams
  tixRevenue: number;
  merchRevenue: number;
  hospitalityRevenue: number;
  parkingRevenue: number;
  fbRevenue: number;
  sponsorshipRevenue: number;
  tvRevenue: number;
  expRevenue: number;
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
  arpgGrowth: number; // Avg Rev Per Game Growth %
  yieldGrowth: number; // Yield (ATP) Growth %
  revPasGrowth: number; // RevPAS Growth %
  occupancyGrowth: number; // Occupancy Growth %
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
  viewMode: 'total' | 'gameday';
}

export interface SponsorData {
  id: string;
  company: string;
  sector: string;
  dimension: string;
  level: string;
  contact: string;
  email: string;
  contractType: 'CASH' | 'CM';
  contractDuration: string;
  season: string;
  commercialValue: number;
  bonusPlayoff: number;
  netOfTicketing: number;
  gamedayReconciliation: number;
  hospitalityReconciliation: number;
  parkingReconciliation: number;
  vbReconciliation: number;
  csrReconciliation: number;
  corpTixReconciliation: number;
  sponsorReconciliation: number;
  delta: number;
  monthlyPayments: Record<string, number>;
}

export interface CRMRecord {
  id: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string;
  dob: string;
  pob: string;
  nationality: string;
  province: string;
  phone: string;
  cell: string;
  address: string;
  buyDate: string;
  buyTimestamp: Date | null;
  event: string;
  zone: string;
  group: string;
  area: string;      // Seat area (D, 1, CRT, etc.)
  seat: string;      // Seat number (121, 21, etc.)
  ticketType: string;
  net: number;
  iva: number;
  price: number;
  payment: string;
  quantity: number;
  pvZone: string;
  abbMpPriceGm: number;
  abbCorpPvPrice: number;
  game: string;
  gmDateTime: number;
  commercialValue: number;
  gameId: string;
  sellType: string;
  giveawayType: string;
  discountType: string;
  season: string;
  age?: string;
  city?: string;
  location?: string;
}