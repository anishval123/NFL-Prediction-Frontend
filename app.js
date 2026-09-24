function resolveApiBase() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : '';

  if (envUrl) return envUrl.replace(/\/$/, '');

  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
    return 'https://nfl-prediction-backend.onrender.com';
  }

  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname)
    ? window.location.hostname
    : '';

  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://nfl-prediction-backend.onrender.com';
  }

  return 'http://localhost:8000';
}

export async function predict(data) {
  const res = await fetch(`${resolveApiBase()}/predict`, {
    method: "POST",
    cache: 'no-store',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return res.json();
}
