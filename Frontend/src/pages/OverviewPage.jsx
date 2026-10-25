import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AlertList from "../components/AlertList.jsx";
import EventTable from "../components/EventTable.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import useAlertStatusActions from "../hooks/useAlertStatusActions.js";
import { fetchDashboard } from "../services/securityApi.js";

export default function OverviewPage() {
  const [dashboard, setDashboard] = useState(null);
  const load = useCallback(async () => {
    try { setDashboard(await fetchDashboard()); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to load overview"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const updateStatus = useAlertStatusActions(load);

  return <div className="page-content"><PageHeader title="Security overview" description="Monitor authentication activity and investigate suspicious patterns." onRefresh={load} />
    <section className="metrics-grid">
      <MetricCard label="Events ingested" value={dashboard?.totalEvents} note="Across your workspace" tone="blue" icon="◈" />
      <MetricCard label="Failed logins" value={dashboard?.failedLogins} note="Authentication failures" tone="amber" icon="⌁" />
      <MetricCard label="Open alerts" value={dashboard?.openAlerts} note="Require analyst review" tone="violet" icon="◉" />
      <MetricCard label="High priority" value={dashboard?.highAlerts} note="Open high or critical" tone="red" icon="△" />
    </section>
    <section className="content-grid">
      <article className="panel"><div className="panel-heading"><div><h2>Recent security events</h2><p>Latest activity captured by your workspace</p></div><Link className="text-btn" to="/events">View all →</Link></div><EventTable events={dashboard?.recentEvents || []} /></article>
      <article className="panel"><div className="panel-heading"><div><h2>Recent alerts</h2><p>Rule based detection findings</p></div><Link className="text-btn" to="/alerts">View all →</Link></div><AlertList alerts={dashboard?.recentAlerts || []} onStatus={updateStatus} compact /></article>
    </section>
    <div className="notice"><span>ⓘ</span><p><strong>Detection heuristic</strong> Repeated login failures are grouped per account and source IP when five or more occur within five minutes. This is an investigation signal, not proof of malicious activity.</p></div>
  </div>;
}
