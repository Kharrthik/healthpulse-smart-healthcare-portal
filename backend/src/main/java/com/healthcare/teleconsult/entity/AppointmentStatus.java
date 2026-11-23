package com.healthcare.teleconsult.entity;

import java.util.Set;

public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED;

    /**
     * Determines whether transitioning from this status to newStatus is valid.
     */
    public boolean canTransitionTo(AppointmentStatus target) {
        if (target == null || target == this) {
            return false;
        }

        return switch (this) {
            case PENDING -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED -> target == COMPLETED || target == CANCELLED;
            case CANCELLED, COMPLETED -> false; // Terminal states
        };
    }

    /**
     * Set of active statuses that occupy doctor availability.
     */
    public static Set<AppointmentStatus> activeStatuses() {
        return Set.of(PENDING, CONFIRMED);
    }
}

