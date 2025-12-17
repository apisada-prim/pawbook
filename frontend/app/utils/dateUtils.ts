export function calculateAge(birthDate: string): string {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        years--;
        months += 12;
    }

    if (today.getDate() < birth.getDate()) {
        months--;
    }

    if (months < 0) {
        months += 12;
        years--; // Adjust logic for safe calculation
    }

    // Safety check for future dates or same day
    if (years < 0) return "0Y 0m";

    return `${years}Y ${months}m`;
}
