// API Types for better type safety

export interface AstroCookies {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: any): void;
  delete(name: string, options?: any): void;
  has(name: string): boolean;
}

export interface CloudflareD1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

export interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface RSVPRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  attending: 'yes' | 'no';
  vegetarian: 0 | 1;
  plus_one: 0 | 1;
  guest_first_name: string | null;
  guest_last_name: string | null;
  plus_one_vegetarian: 0 | 1;
  language: 'en' | 'fr' | 'ro';
  submitted_at: number;
  ip_address: string;
  user_agent: string | null;
}

export interface RSVPStats {
  total: number;
  attending: number;
  notAttending: number;
  plusOnes: number;
  vegetarians: number;
  languages: {
    en: number;
    fr: number;
    ro: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface RSVPApiResponse extends ApiResponse {
  rsvps?: RSVPRow[];
  stats?: RSVPStats;
}