
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
  country?: string;
  computer_name?: string;
  os_version?: string;
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
  keyword?: string;
  description?: string;
  field_type?: string;
  reviewed_by_username?: string;
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
  bin_number?: string;
  description?: string;
  reviewed_by_username?: string;
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
  updated_at?: string;
  created_by_username?: string;
}

export interface BinWatchlist {
  id: number;
  bin_number: string;
  scheme?: string;
  bank_name: string;
  country: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
  created_by?: string;
  description?: string;
  created_by_username?: string;
}

export interface DashboardStats {
  total_credentials: number;
  total_cards: number;
  total_systems: number;
  total_alerts: number;
  alert_breakdown?: {
    credential_alerts: number;
    card_alerts: number;
  };
  country_filter?: string;
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
  page?: number;
  per_page?: number;
}

export interface CardSearchFilters {
  cardholder?: string;
  card_type?: string;
  bin_number?: string;
  bank_name?: string;
  country?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    max_records?: number;
  };
}

export interface ComprehensiveDashboardResponse {
  overview: {
    total_credentials: number;
    total_cards: number;
    total_systems: number;
    total_alerts: number;
    alert_breakdown: {
      credential_alerts: number;
      card_alerts: number;
    };
  };
  stealer_distribution: Array<{ stealer_type: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
  country_distribution: Array<{ country: string; count: number }>;
  top_domains: Array<{ domain: string; count: number }>;
  filters: {
    country?: string;
  };
  metadata: {
    generated_at: string;
    optimized: boolean;
    single_call: boolean;
  };
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

  async getCredentials(filters?: SearchFilters): Promise<PaginatedResponse<Credential>> {
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

  async getCards(filters?: CardSearchFilters): Promise<PaginatedResponse<Card>> {
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
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Alert>> {
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
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<CardAlert>> {
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

  async getBinWatchlist(): Promise<BinWatchlist[]> {
    const response = await fetch(`${this.baseUrl}/watchlist/bins`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch BIN watchlist');
    }
    
    return response.json();
  }

  async createBinWatchlistItem(item: Partial<BinWatchlist>): Promise<BinWatchlist> {
    const response = await fetch(`${this.baseUrl}/watchlist/bins`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create BIN watchlist item');
    }
    
    return response.json();
  }

  async uploadBinFile(file: File): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/watchlist/bins/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload BIN file');
    }
    
    return response.json();
  }

  async deleteBinWatchlistItem(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/watchlist/bins/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete BIN watchlist item');
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

  async exportCredentials(format: 'csv', filters?: SearchFilters): Promise<Blob> {
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
      const errorText = await response.text();
      throw new Error(`Failed to export credentials: ${errorText}`);
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

  async getComprehensiveDashboard(country?: string): Promise<ComprehensiveDashboardResponse> {
    const params = new URLSearchParams();
    if (country) {
      params.append('country', country);
    }
    
    const response = await fetch(`${this.baseUrl}/dashboard/comprehensive?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch comprehensive dashboard data');
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();
