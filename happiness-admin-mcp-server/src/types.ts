export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface StatsSummary {
  totalMembers: number;
  totalPhotos: number;
  todayInquiries: number;
  unreadInquiries: number;
  todayBookings: number;
  pendingBookings: number;
  pendingPortfolios: number;
}

export interface AdminReport {
  id: number;
  reporterId: number | null;
  reporterName: string | null;
  reporterEmail: string | null;
  targetType: string;
  targetId: number;
  reason: string;
  details: string | null;
  status: string;
  processMemo: string | null;
  processedAt: string | null;
  createdAt: string;
  aiSummary: string | null;
  aiSeverity: string | null;
  aiSuggestedAction: string | null;
  aiAnalyzedAt: string | null;
}

export interface AdminMember {
  id: number;
  name: string;
  email: string;
  tel: string | null;
  profileName: string | null;
  authority: string;
  status: string;
  suspendReason: string | null;
  suspendUntil: string | null;
  suspendedAt: string | null;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  photoCount: number;
  seriesCount: number;
  inquiryCount: number;
  portfolioCount: number;
  provider: string | null;
}

export interface AiTriageRunResult {
  requested: number;
  succeeded: number;
  failed: number;
}
