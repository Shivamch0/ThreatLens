import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import AlertList from "../components/AlertList.jsx";
import PageHeader from "../components/PageHeader.jsx";
import useAlertStatusActions from "../hooks/useAlertStatusActions.js";
import { fetchAlerts } from "../services/securityApi.js";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const load = useCallback(async () => {
    try { setAlerts(await fetchAlerts()); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to load alerts"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const updateStatus = useAlertStatusActions(load);

  return <div className="page-content"><PageHeader title="Alerts & incidents" description="Review and update rule triggered findings." onRefresh={load} /><section className="panel"><div className="panel-heading"><div><h2>Detection alerts</h2><p>Explainable findings for analyst review</p></div></div><AlertList alerts={alerts} onStatus={updateStatus} /></section></div>;
}
