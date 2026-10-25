import api from "./api.js";

export async function fetchDashboard() {
  const { data } = await api.get("/dashboard");
  return data.data;
}

export async function fetchEvents(params = {}) {
  const { data } = await api.get("/events", { params });
  return data.data;
}

export async function createEvent(event) {
  const { data } = await api.post("/events", event);
  return data.data;
}

export async function fetchAlerts() {
  const { data } = await api.get("/alerts");
  return data.data;
}

export async function updateAlertStatus(id, status) {
  const { data } = await api.patch(`/alerts/${id}/status`, { status });
  return data.data;
}
