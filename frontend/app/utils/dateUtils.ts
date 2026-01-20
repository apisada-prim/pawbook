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

export function calculateNextVaccineDate(species: string, vaccineType: string, dateAdministered: string, ageInWeeks: number = 52): string {
    const date = new Date(dateAdministered);
    let weeksToAdd = 52; // Default 1 year

    // Logic based on vaccine-plan.md
    if (species === "DOG") {
        if (vaccineType === "Rabies") {
            // First shot at 12 weeks, boost at 16 weeks (4 weeks later)
            // If age < 16 weeks (4 months), assume it's the first shot -> next is 4 weeks
            // Else -> 1 year
            if (ageInWeeks < 20) {
                weeksToAdd = 4;
            }
        } else if (vaccineType === "Combined") { // DHPPL
            // < 16 weeks -> 4 weeks interval
            if (ageInWeeks < 20) {
                weeksToAdd = 4;
            }
        }
    } else if (species === "CAT") {
        if (vaccineType === "Rabies") {
            // Same logic as dogs roughly
            if (ageInWeeks < 20) {
                weeksToAdd = 4;
            }
        } else if (vaccineType === "FVRCP") {
            // < 16 weeks -> 4 weeks
            if (ageInWeeks < 20) {
                weeksToAdd = 4;
            }
        } else if (vaccineType === "FeLV") {
            // 2 shots, 3-4 weeks apart
            if (ageInWeeks < 16) {
                weeksToAdd = 4;
            }
        }
    }

    date.setDate(date.getDate() + (weeksToAdd * 7));
    return date.toISOString().split('T')[0];
}

export function getDaysLeft(dateString: string | null | undefined): { days: number; color: string } | null {
    if (!dateString) return null;
    const target = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = "bg-[#FFF5F5] text-[#F6A6A6]";
    if (diffDays < 0) color = "bg-red-100 text-red-600";
    else if (diffDays <= 7) color = "bg-orange-100 text-orange-600";

    return { days: diffDays, color };
}
