import { httpService } from "~/services/httpService";
import type { TrackingData } from "~/types/tracking";

export const trackingService = {
  getTracking: (invoiceId: string) =>
    httpService.get<TrackingData>(`/tracking/${invoiceId}`),
};
