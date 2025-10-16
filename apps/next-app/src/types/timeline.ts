export type TimelineItemBase = {
  id: string;
  item_type?: 'event' | 'reminder' | 'occurrence' | string;
  date?: string; // ISO full
  event_date?: string; // legacy yyyy-mm-dd
  start_time?: string | null;
  end_time?: string | null;
  [key: string]: any;
};

export type TimelineItem = TimelineItemBase & {
  item_type: 'event' | 'reminder' | 'occurrence' | string;
};