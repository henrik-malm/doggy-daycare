"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDogStatus } from "../context/DogStatusContext";
import Image from "next/image";

// Enhanced debounce hook with better error handling
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
  // State management
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState("all");
  
  // Context and router
  const { changedDogs, STATUS, lastError, clearError } = useDogStatus();
  const router = useRouter();

  // API endpoint - now using the real endpoint
  const DOGS_API_URL = "https://majazocom.github.io/Data/dogs.json";

  // Fetch function using the real API
  const fetchDogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add timeout to prevent indefinite loading state
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch(DOGS_API_URL, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json"
        }
      });
      
      clearTimeout(timeoutId);
      
      // Check for HTTP errors
      if (!res.ok) {
        throw new Error(`Failed to fetch dogs (Status: ${res.status})`);
      }
      
      // Parse data carefully
      const data = await res.json();
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected an array of dogs");
      }
      
      setDogs(data);
    } catch (err) {
      // Handle specific error types
      if (err.name === 'AbortError') {
        setError("Request timed out. Please try again.");
      } else {
        console.error("Error fetching dogs:", err);
        setError(err.message || "Failed to load dogs");
      }
    } finally {
      setIsLoading(false);
    }
  }, [DOGS_API_URL]);

  // Load dogs on component mount
  useEffect(() => {
    fetchDogs();
    
    // Clear any context errors when component mounts
    if (lastError) clearError();
  }, [fetchDogs, lastError, clearError]);

  // Handle context errors
  useEffect(() => {
    if (lastError) {
      setError(prev => prev || lastError);
    }
  }, [lastError]);

  // Apply filters to dog list
  const filteredDogs = dogs
    .filter(dog => {
      // Handle potential null or undefined dog names
      const dogName = (dog.name || "").toLowerCase();
      const searchTermLower = (debouncedSearchTerm || "").toLowerCase();
      return dogName.includes(searchTermLower);
    })
    .filter(dog => {
      // More robust filtering logic
      if (filter === STATUS.ALL) return true;
      
      // First check changed dogs in context
      if (dog.chipNumber in changedDogs) {
        return changedDogs[dog.chipNumber] === filter;
      }
      
      // Fall back to original dog status
      // Note: API uses boolean (true/false) while we use strings ("present"/"absent")
      const presentStatus = dog.present === true ? STATUS.PRESENT : STATUS.ABSENT;
      return presentStatus === filter;
    });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dog List</h1>
      
      {/* Error display with retry button */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>Error: {error}</span>
          <button 
            onClick={fetchDogs} 
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search dogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded flex-grow"
          aria-label="Search dogs"
        />
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
          aria-label="Filter dogs by status"
        >
          <option value={STATUS.ALL}>All Dogs</option>
          <option value={STATUS.PRESENT}>Present</option>
          <option value={STATUS.ABSENT}>Absent</option>
        </select>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && filteredDogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {debouncedSearchTerm || filter !== STATUS.ALL 
            ? "No dogs match your search or filter criteria."
            : "No dogs are currently registered."}
        </div>
      )}
      
      {/* Dog list grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDogs.map(dog => {
          // Safely determine status based on chipNumber
          const status = dog.chipNumber in changedDogs 
            ? changedDogs[dog.chipNumber] 
            : (dog.present === true ? STATUS.PRESENT : STATUS.ABSENT);
            
          return (
            <div
              key={dog.chipNumber || `dog-${dog.name}-${Math.random()}`}
              onClick={() => router.push(`/dogs/${dog.chipNumber}`)}
              className={`
                cursor-pointer border rounded overflow-hidden shadow-sm
                ${status === STATUS.PRESENT ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
                hover:shadow-md transition-shadow
              `}
              role="button"
              aria-label={`View details for ${dog.name || "Unknown dog"}`}
            >
              {/* Dog image */}
              <div className="relative w-full h-48 bg-gray-200">
                {dog.img ? (
                  <img
                    src={dog.img}
                    alt={`Photo of ${dog.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>
              
              {/* Dog info */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{dog.name || "Unknown dog"}</h3>
                  <span className="text-xs bg-gray-200 rounded-full px-2 py-1">
                    {dog.sex === "male" ? "♂️" : "♀️"} {dog.age}y/o
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {dog.breed || "Mixed breed"}
                </p>
                
                <p className={`mt-2 font-medium ${status === STATUS.PRESENT ? 'text-green-600' : 'text-red-600'}`}>
                  {status === STATUS.PRESENT ? 'Present' : 'Absent'}
                </p>
                
                <p className="text-xs text-gray-500 mt-2">
                  Owner: {dog.owner ? `${dog.owner.name} ${dog.owner.lastName}` : "Unknown"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}