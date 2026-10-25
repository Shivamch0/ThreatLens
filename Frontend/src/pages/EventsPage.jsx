import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import EventForm from "../components/EventForm.jsx";
import EventTable from "../components/EventTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { createEvent, fetchEvents } from "../services/securityApi.js";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    try { setEvents((await fetchEvents({ search: search || undefined })).events); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to load events"); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  async function addEvent(event) {
    try { await createEvent(event); toast.success("Security event recorded"); await load(); return true; }
    catch (error) { toast.error(error.response?.data?.message || "Could not record event"); return false; }
  }

  return <div className="page-content"><PageHeader title="Security events" description="Review activity from your monitored environment." onRefresh={load} />
    <section className="panel"><div className="panel-heading"><div><h2>Event activity</h2><p>Search by account name or source IP</p></div><input className="search-input" placeholder="Search events..." aria-label="Search events" value={search} onChange={(event) => setSearch(event.target.value)} /></div><EventTable events={events} /><EventForm onSubmit={addEvent} /></section>
  </div>;
}
