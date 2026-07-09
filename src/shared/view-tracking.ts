export type ViewTrackingJob = {
  siteId: string;
  day: string;
  path: string;
  status: number;
  country: string;
  referrerHost: string;
};

export type AggregatedViewTracking = ViewTrackingJob & {
  views: number;
};
