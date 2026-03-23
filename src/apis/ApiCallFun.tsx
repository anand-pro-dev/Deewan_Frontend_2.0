import { api, apiForm } from './API_Constant_Url';
import { store } from '../store/store';  

// Helper to get token from Redux store
const getToken = (): string => {
  const token = store.getState().auth.token;
  if (!token) throw new Error('Authentication token not found');
  return token;
};

// Generic GET without token
export const getData = async <T = any>(endpoint: string): Promise<T> => {
  try {
    const response = await api.get<T>(endpoint);
    return response.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

// Generic POST without token
export const postData = async <T = any, D = any>(
  endpoint: string,
  payload: D
): Promise<T> => {
  try {
    const response = await api.post<T>(endpoint, payload);
    return response.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

// GET with token
export const getDataWithToken = async <T = any>(endpoint: string): Promise<T> => {
  try {
    const token = getToken();
    const response = await api.get<T>(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

// DELETE with token
export const deleteDataWithToken = async <T = any>(endpoint: string): Promise<T> => {
  try {
    const token = getToken();
    const response = await api.delete<T>(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

// POST with token
export const postDataWithToken = async <T = any, D = any>(
  endpoint: string,
  payload: D
): Promise<T> => {
  try {
    const token = getToken();
    const response = await api.post<T>(endpoint, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

// POST FormData with token
export const postFormDataWithToken = async <T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  try {
    const token = getToken();
    const response = await apiForm.post<T>(endpoint, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};