// Enhanced API service to match FastAPI backend
export interface SystemInfo {
  id: number;
  source_file?: string;
  ip?: string;
  machine_user?: string;
  log_date?: string;
  stealer_type?: string;
  infected_file_path?: string;
  os_version?: string;
  computer_name?: string;
  hostname?: string;
  language?: string;
  hwid?: string;
  ram_size?: string;
  cpu_name?: string;
  country?: string;
  created_at: string;
}

export interface Credential {
  id: number;
  url?: string;
  domain?: string;
  username?: string;
  password?: string;
  source_file?: string;
  confidence_score: number;
  ip?: string;
  machine_user?: string;
  log_date?: string;
  stealer_type?: string;
  system_info_id?: number;
  created_at: string;
  system_info?: SystemInfo;
}

export interface Card {
  id: number;
  number?: string;
  cvv?: string;
  expiry?: string;
  cardholder?: string;
  card_type?: string;
  source_file?: string;
  ip?: string;
  log_date?: string;
  machine_user?: string;
  stealer_type?: string;
  system_info_id?: number;
  created_at: string;
  bin_info?: BinInfo;
  egyptian_bank?: string;
  scheme?: string;
  is_egyptian?: boolean;
  country?: string;
}

export interface BinInfo {
  scheme: string;
  card_type: string;
  issuer: string;
  country: string;
}

export interface CardDetail {
  card: Card;
  related_cards: Card[];
  related_credentials: Credential[];
}

export interface CredentialDetail {
  credential: Credential;
  related_cards: Card[];
  related_credentials: Credential[];
}

export interface Alert {
  id: number;
  watchlist_id: number;
  matched_field: string;
  matched_value: string;
  record_type: string;
  record_id: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'reviewed' | 'false_positive';
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface CardAlert {
  id: number;
  card_watchlist_id: number;
  matched_bin: string;
  card_number: string;
  card_id: number;
  bank_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'reviewed' | 'false_positive';
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface Watchlist {
  id: number;
  keyword: string;
  field_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export interface DashboardStats {
  total_credentials: number;
  total_cards: number;
  total_systems: number;
  total_alerts: number;
}

export interface CardStats {
  bin_stats: Array<{ bin_number: string; count: number; bank_name: string; scheme: string; card_type: string }>;
  card_type_stats: Array<{ card_type: string; count: number }>;
  timeline_stats: Array<{ date: string; count: number }>;
  bank_stats: Array<{ bank_name: string; count: number; bins: string[] }>;
}

export interface EgyptianCardStats {
  total_egyptian_cards: number;
  bank_distribution: Array<{ bank_name: string; count: number }>;
  card_type_distribution: Array<{ card_type: string; count: number }>;
  timeline_stats: Array<{ date: string; count: number }>;
  bin_stats: Array<{ bin_number: string; count: number; bank_name: string }>;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  api_key?: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SearchFilters {
  domain?: string;
  username?: string;
  stealer_type?: string;
  country?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface CardSearchFilters {
  cardholder?: string;
  card_type?: string;
  bin_number?: string;
  country?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export class ApiService {
  private baseUrl = 'http://localhost:5000/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  async getStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/stats/overview`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return response.json();
  }

  async getCredentials(filters?: SearchFilters): Promise<Credential[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/credentials/search?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credentials');
    }
    
    return response.json();
  }

  async getCredentialDetail(id: number): Promise<CredentialDetail> {
    const response = await fetch(`${this.baseUrl}/credential/${id}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credential detail');
    }
    
    return response.json();
  }

  async getCards(filters?: CardSearchFilters): Promise<Card[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/cards/search?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    
    return response.json();
  }

  async getCardDetail(id: number): Promise<CardDetail> {
    const response = await fetch(`${this.baseUrl}/card/${id}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch card detail');
    }
    
    return response.json();
  }

  async getCardStats(): Promise<CardStats> {
    const response = await fetch(`${this.baseUrl}/cards/stats`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch card stats');
    }
    
    return response.json();
  }

  async getEgyptianCardStats(): Promise<EgyptianCardStats> {
    const response = await fetch(`${this.baseUrl}/cards/egyptian-stats`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Egyptian card stats');
    }
    
    return response.json();
  }

  async getAlerts(filters?: {
    status?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/alerts?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }
    
    return response.json();
  }

  async getCardAlerts(filters?: {
    status?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<CardAlert[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/card-alerts?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch card alerts');
    }
    
    return response.json();
  }

  async getWatchlist(): Promise<Watchlist[]> {
    const response = await fetch(`${this.baseUrl}/watchlist`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch watchlist');
    }
    
    return response.json();
  }

  async createWatchlistItem(item: Partial<Watchlist>): Promise<Watchlist> {
    const response = await fetch(`${this.baseUrl}/watchlist`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create watchlist item');
    }
    
    return response.json();
  }

  async deleteWatchlistItem(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/watchlist/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete watchlist item');
    }
  }

  async getCountryStats(): Promise<Array<{ country: string; count: number }>> {
    const response = await fetch(`${this.baseUrl}/stats/countries`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch country stats');
    }
    
    return response.json();
  }

  async getStealerStats(): Promise<Array<{ stealer_type: string; count: number }>> {
    const response = await fetch(`${this.baseUrl}/stats/stealers`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stealer stats');
    }
    
    return response.json();
  }

  async getTopDomains(): Promise<Array<{ domain: string; count: number }>> {
    const response = await fetch(`${this.baseUrl}/stats/top-domains`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch top domains');
    }
    
    return response.json();
  }

  async getTimelineStats(): Promise<Array<{ date: string; count: number }>> {
    const response = await fetch(`${this.baseUrl}/stats/timeline`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch timeline stats');
    }
    
    return response.json();
  }

  async exportCredentials(format: 'csv' | 'json' | 'pdf', filters?: SearchFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/export/credentials?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export credentials');
    }
    
    return response.blob();
  }

  async resolveAlert(alertId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user_id: this.getCurrentUser()?.id || 1 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to resolve alert');
    }
  }

  async markAlertFalsePositive(alertId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${alertId}/false-positive`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user_id: this.getCurrentUser()?.id || 1 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark alert as false positive');
    }
  }

  async resolveCardAlert(alertId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/card-alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user_id: this.getCurrentUser()?.id || 1 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to resolve card alert');
    }
  }

  async markCardAlertFalsePositive(alertId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/card-alerts/${alertId}/false-positive`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user_id: this.getCurrentUser()?.id || 1 }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark card alert as false positive');
    }
  }
}

export const apiService = new ApiService();
