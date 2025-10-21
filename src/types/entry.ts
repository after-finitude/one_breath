export interface Entry {
	id: string; // unique id
	ymd: string; // "YYYY-MM-DD"
	content: string; // max 280 characters
	createdAt: string; // ISO UTC
	replacedAt?: string | null; // ISO UTC
}
