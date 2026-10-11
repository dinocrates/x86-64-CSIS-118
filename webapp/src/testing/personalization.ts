import type { AssignmentConfig } from "../assignments/types";

/** Literal reminders, not proof of execution, identity, or comment quality. */
export function personalizationReminders(source: string, assignment: AssignmentConfig): string[] {
	return (assignment.personalizationReminders ?? [])
		.filter((reminder) => source.includes(reminder.pattern))
		.map((reminder) => reminder.message);
}
