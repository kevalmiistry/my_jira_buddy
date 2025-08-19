export function convertHoursToJiraTimeWithDays(hours: number): string {
    if (hours <= 0) return "0m";

    const hoursPerDay = 8; // Standard working day

    const days = Math.floor(hours / hoursPerDay);
    const remainingHours = hours % hoursPerDay;
    const wholeHours = Math.floor(remainingHours);
    const minutes = Math.round((remainingHours - wholeHours) * 60);

    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days}d`);
    }

    if (wholeHours > 0) {
        parts.push(`${wholeHours}h`);
    }

    if (minutes > 0 && minutes < 60) {
        parts.push(`${minutes}m`);
    } else if (minutes === 60) {
        // Handle edge case where rounding gives us 60 minutes
        if (wholeHours + 1 < hoursPerDay) {
            parts.push(`${wholeHours + 1}h`);
        } else {
            parts[0] = `${days + 1}d`; // Increment days
        }
    }

    return parts.join(" ") || "0m";
}
