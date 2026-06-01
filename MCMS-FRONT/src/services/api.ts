const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'https://mcms-backend-iw71.onrender.com';

class ApiService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    if (response.status === 403) {
      return { success: false, error: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' } as T;
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response.json();
  }

  async patch<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    if (response.status === 403) {
      return { success: false, error: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' } as T;
    }

    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response.json();
  }

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response.json();
  }
}

export const api = new ApiService();
export { BASE_URL };