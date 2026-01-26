const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Sound API
export const soundsApi = {
  getAll: (params?: { q?: string; tag?: string; source_type?: string; sort?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.source_type) queryParams.append('source_type', params.source_type);
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const query = queryParams.toString();
    return apiCall(`/sounds${query ? `?${query}` : ''}`) as Promise<any[]>;
  },

  getById: (id: string) => apiCall(`/sounds/${id}`),

  create: (data: any) => apiCall('/sounds', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: any) => apiCall(`/sounds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiCall(`/sounds/${id}`, {
    method: 'DELETE',
  }),

  uploadCover: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/sounds/${id}/cover`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  ingest: (id: string) => apiCall(`/sounds/${id}/ingest`, {
    method: 'POST',
  }),
};

// Shortcut API
export const shortcutsApi = {
  getAll: () => apiCall('/shortcuts'),

  create: (data: any) => apiCall('/shortcuts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: any) => apiCall(`/shortcuts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiCall(`/shortcuts/${id}`, {
    method: 'DELETE',
  }),

  checkConflict: (hotkey: string) => apiCall(`/shortcuts/conflicts?hotkey=${encodeURIComponent(hotkey)}`),
};

// Settings API
export const settingsApi = {
  get: () => apiCall('/settings'),

  update: (data: any) => apiCall('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Playback API
export const playbackApi = {
  play: (soundId: string, restart: boolean = false) => apiCall(`/playback/play/${soundId}`, {
    method: 'POST',
    body: JSON.stringify({ restart }),
  }),

  stop: (soundId: string) => apiCall(`/playback/stop/${soundId}`, {
    method: 'POST',
  }),

  toggle: (soundId: string) => apiCall(`/playback/toggle/${soundId}`, {
    method: 'POST',
  }),

  restart: (soundId: string) => apiCall(`/playback/restart/${soundId}`, {
    method: 'POST',
  }),

  stopAll: () => apiCall('/playback/stop-all', {
    method: 'POST',
  }),

  getNowPlaying: () => apiCall('/playback/now-playing'),
};
