"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDogStatus } from "../context/DogStatusContext";
import Image from "next/image";

// Debounce hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === undefined) return;

    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function DogList() {
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState("all");

  const { changedDogs, STATUS, lastError, clearError } = useDogStatus();
  const router = useRouter();

  const DOGS_API_URL = "https://majazocom.github.io/Data/dogs.json";

  const fetchDogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(DOGS_API_URL, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json"
        }
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Failed to fetch dogs (Status: ${res.status})`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected an array of dogs");
      }

      setDogs(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        console.error("Error fetching dogs:", err);
        setError(err.message || "Failed to load dogs");
      }
    } finally {
      setIsLoading(false);
    }
  }, [DOGS_API_URL]);

  useEffect(() => {
    fetchDogs();
    if (lastError) clearError();
  }, [fetchDogs, lastError, clearError]);

  useEffect(() => {
    if (lastError) {
      setError((prev) => prev || lastError);
    }
  }, [lastError]);

  const filteredDogs = dogs
    .filter((dog) => {
      const dogName = (dog.name || "").toLowerCase();
      const searchTermLower = (debouncedSearchTerm || "").toLowerCase();
      return dogName.includes(searchTermLower);
    })
    .filter((dog) => {
      if (filter === STATUS.ALL) return true;
      if (dog.chipNumber in changedDogs) {
        return changedDogs[dog.chipNumber] === filter;
      }
      const presentStatus = dog.present === true ? STATUS.PRESENT : STATUS.ABSENT;
      return presentStatus === filter;
    });

  return (
    <div>
      <h1>Dog List</h1>

      {error && (
        <div>
          <span>Error: {error}</span>
          <button onClick={fetchDogs}>Retry</button>
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Search dogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search dogs"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter dogs by status"
        >
          <option value={STATUS.ALL}>All Dogs</option>
          <option value={STATUS.PRESENT}>Present</option>
          <option value={STATUS.ABSENT}>Absent</option>
        </select>
      </div>

      {isLoading && (
        <div>
          <div />
          <p>Loading...</p>
        </div>
      )}

      {!isLoading && filteredDogs.length === 0 && (
        <div>
          {debouncedSearchTerm || filter !== STATUS.ALL
            ? "No dogs match your search or filter criteria."
            : "No dogs are currently registered."}
        </div>
      )}

      <div>
        {filteredDogs.map((dog) => {
          const status =
            dog.chipNumber in changedDogs
              ? changedDogs[dog.chipNumber]
              : dog.present === true
              ? STATUS.PRESENT
              : STATUS.ABSENT;

          return (
            <div
              key={dog.chipNumber || `dog-${dog.name}-${Math.random()}`}
              onClick={() => router.push(`/dogs/${dog.chipNumber}`)}
              role="button"
              aria-label={`View details for ${dog.name || "Unknown dog"}`}
            >
              <div>
                {dog.img ? (
                  <img src={dog.img} alt={`Photo of ${dog.name}`} />
                ) : (
                  <div>No image available</div>
                )}
              </div>

              <div>
                <div>
                  <h3>{dog.name || "Unknown dog"}</h3>
                  <span>
                    {dog.sex === "male" ? "♂️" : "♀️"} {dog.age}y/o
                  </span>
                </div>
                <p>{dog.breed || "Mixed breed"}</p>
                <p>{status === STATUS.PRESENT ? "Present" : "Absent"}</p>
                <p>
                  Owner:{" "}
                  {dog.owner
                    ? `${dog.owner.name} ${dog.owner.lastName}`
                    : "Unknown"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
