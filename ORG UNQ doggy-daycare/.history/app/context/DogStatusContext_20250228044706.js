"use client";
import { createContext, useState, useContext, useCallback } from "react";

const DogStatusContext = createContext();

// Add constants for status values to prevent typos
export const STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  ALL: "all",
};

export function DogStatusProvider({ children }) {
  const [changedDogs, setChangedDogs] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Memoize the update function to prevent unnecessary re-renders
  const updateStatus = useCallback((chipNumber, newStatus) => {
    if (!chipNumber) {
      console.error("Invalid dog chipNumber provided to updateStatus");
      setLastError("Invalid dog identifier");
      return false;
    }

    try {
      setIsUpdating(true);

      // Update the local state - using chipNumber as the key
      setChangedDogs((prev) => ({
        ...prev,
        [chipNumber]: newStatus,
      }));

      // Here you would typically also call an API to persist changes
      // For now we're just simulating with a timeout
      setTimeout(() => {
        setIsUpdating(false);
      }, 300);

      return true;
    } catch (err) {
      console.error("Error updating dog status:", err);
      setLastError(err.message || "Failed to update status");
      setIsUpdating(false);
      return false;
    }
  }, []);

  // Clear any errors in the context
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return (
    <DogStatusContext.Provider
      value={{
        changedDogs,
        updateStatus,
        isUpdating,
        lastError,
        clearError,
        STATUS, // Export constants through context
      }}
    >
      {children}
    </DogStatusContext.Provider>
  );
}

export function useDogStatus() {
  const context = useContext(DogStatusContext);
  if (!context) {
    throw new Error("useDogStatus must be used within a DogStatusProvider");
  }
  return context;
}
