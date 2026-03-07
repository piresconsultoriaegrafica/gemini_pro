import { AppState } from '../types';

export const initDB = async (): Promise<void> => {
  // Check connection
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('API not available');
  } catch (e) {
    console.error("Failed to connect to API", e);
  }
};

export const getAppState = async (): Promise<AppState | null> => {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Error fetching state", e);
    return null;
  }
};

export const saveAppState = async (state: AppState) => {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
  } catch (e) {
    console.error("Error saving state", e);
  }
};

export const exportDatabase = async (): Promise<Blob | null> => {
  try {
    const res = await fetch('/api/export');
    if (!res.ok) return null;
    return await res.blob();
  } catch (e) {
    console.error("Error exporting DB", e);
    return null;
  }
};

export const importDatabase = async (file: File) => {
  const formData = new FormData();
  formData.append('database', file);
  const res = await fetch('/api/import', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    throw new Error('Failed to import database');
  }
};
