/** What a contact message is about; shared by the form and the API so they can't drift. */
export const CONTACT_TOPICS = [
	{ id: "question", label: "A question" },
	{ id: "problem", label: "Something isn’t working" },
	{ id: "privacy", label: "Privacy or my data" },
	{ id: "business", label: "Partnership or press" },
	{ id: "other", label: "Something else" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["id"];

export const isContactTopic = (v: unknown): v is ContactTopic =>
	typeof v === "string" && CONTACT_TOPICS.some((t) => t.id === v);

/** Direct lines to the people behind SplitBiller. */
export const CONTACT_EMAIL = "wohnmohr.contact@gmail.com";
export const BOOKING_URL = "https://cal.com/wohnmohr/15min";
