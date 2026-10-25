import { toast } from "react-toastify";
import { updateAlertStatus } from "../services/securityApi.js";

export default function useAlertStatusActions(onUpdated) {
  return async (alert, status) => {
    try {
      await updateAlertStatus(alert._id, status);
      toast.success(`Alert marked ${status.toLowerCase()}`);
      await onUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update alert");
    }
  };
}
