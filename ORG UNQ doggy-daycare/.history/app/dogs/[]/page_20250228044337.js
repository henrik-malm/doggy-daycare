"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDogStatus } from "../../context/DogStatusContext";
import { use } from 'react';

export default function DogDetails({ params }) {
  // Properly unwrap params using React.use() to fix the warning
  const unwrappedParams = use(params);
  const chipNumber = unwrappedParams.id;
  
  // State management
  const [dog, setDog] = useState(null);
  const [allDogs, setAllDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextDogId, setNextDogId] = useState(null);
  const [prevDogId, setPrevDogId] = useState(null);
  
  // Context and router
  const { changedDogs, updateStatus, isUpdating, STATUS } = useDogStatus();
  const router = useRouter();

  // API endpoint for all dogs
  const DOGS_API_URL = "https://majazocom.github.io/Data/dogs.json";

  // Fetch all dogs data for single dog and navigation
  const fetchDogData = useCallback(async () => {
    if (!chipNumber) {
      setError("Invalid dog ID");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(DOGS_API_URL, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json"
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch dog data (Status: ${res.status})`);
      }
      
      const dogsData = await res.json();
      
      // Validate data
      if (!Array.isArray(dogsData)) {
        throw new Error("Invalid data format: expected an array of dogs");
      }
      
      // Store all dogs for navigation
      setAllDogs(dogsData);
      
      // Find the specific dog by chipNumber (not id)
      const foundDog = dogsData.find(dog => dog.chipNumber === chipNumber);
      
      if (!foundDog) {
        throw new Error(`Dog with ID ${chipNumber} not found`);
      }
      
      setDog(foundDog);
      
      // Set up navigation
      setupNavigation(dogsData, chipNumber);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        setError("Request timed out. Please try again.");
      } else {
        console.error("Error fetching dog:", err);
        setError(err.message || "Failed to load dog details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [chipNumber]);

  // Helper function to set up previous/next navigation
  const setupNavigation = (dogs, currentChipNumber) => {
    const dogIndex = dogs.findIndex(dog => dog.chipNumber === currentChipNumber);
    
    if (dogIndex > 0) {
      setPrevDogId(dogs[dogIndex - 1].chipNumber);
    } else {
      setPrevDogId(null);
    }
    
    if (dogIndex < dogs.length - 1) {
      setNextDogId(dogs[dogIndex + 1].chipNumber);
    } else {
      setNextDogId(null);
    }
  };

  // Load dog data on component mount or chipNumber change
  useEffect(() => {
    fetchDogData();
  }, [fetchDogData]);

  // Handle toggle status with proper error handling
  const toggleStatus = async () => {
    if (!dog) return;
    
    // Convert boolean present to string status format
    const currentPresent = dog.present === true;
    const currentStatus = dog.chipNumber in changedDogs 
      ? changedDogs[dog.chipNumber] 
      : (currentPresent ? STATUS.PRESENT : STATUS.ABSENT);
    
    const newStatus = currentStatus === STATUS.PRESENT ? STATUS.ABSENT : STATUS.PRESENT;
    
    const success = await updateStatus(dog.chipNumber, newStatus);
    
    if (!success) {
      console.error("Failed to update dog status");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
        <button 
          onClick={() => router.push("/dogs")} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ← Back to Dog List
        </button>
      </div>
    );
  }

  if (isLoading || !dog) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        <p>Loading dog details...</p>
      </div>
    );
  }

  // Safely determine status from context or original data
  const status = dog.chipNumber in changedDogs 
    ? changedDogs[dog.chipNumber] 
    : (dog.present === true ? STATUS.PRESENT : STATUS.ABSENT);

  return (
    <div className="container mx-auto p-4">
      <div className={`
        border rounded-lg overflow-hidden shadow-md
        ${status === STATUS.PRESENT ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
      `}>
        {/* Dog image */}
        <div className="relative w-full h-64 md:h-80 bg-gray-200">
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
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{dog.name || "Unknown dog"}</h2>
            <span className="text-sm bg-gray-200 rounded-full px-3 py-1">
              {dog.sex === "male" ? "♂️ Male" : "♀️ Female"}, {dog.age} years old
            </span>
          </div>
          
          {/* Dog details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-700"><strong>Breed:</strong> {dog.breed || "Unknown"}</p>
              <p className="text-gray-700"><strong>Chip Number:</strong> {dog.chipNumber}</p>
              <p className={`font-semibold ${status === STATUS.PRESENT ? 'text-green-600' : 'text-red-600'}`}>
                <strong>Status:</strong> {status === STATUS.PRESENT ? 'Present' : 'Absent'}
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-1">Owner Information</h3>
              {dog.owner ? (
                <>
                  <p className="text-gray-700">
                    <strong>Name:</strong> {dog.owner.name} {dog.owner.lastName}
                  </p>
                  {dog.owner.phoneNumber && (
                    <p className="text-gray-700">
                      <strong>Phone:</strong> {dog.owner.phoneNumber}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Owner information not available</p>
              )}
            </div>
          </div>
          
          {/* Status toggle button */}
          <button 
            onClick={toggleStatus}
            disabled={isUpdating}
            className={`
              px-4 py-2 rounded font-medium transition-colors w-full md:w-auto
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
              ${status === STATUS.PRESENT 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'}
            `}
          >
            {isUpdating ? 'Updating...' : (status === STATUS.PRESENT ? 'Mark as Absent' : 'Mark as Present')}
          </button>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex justify-between items-center my-6">
        <button
          onClick={() => prevDogId && router.push(`/dogs/${prevDogId}`)}
          disabled={!prevDogId}
          className={`
            px-4 py-2 rounded transition-colors
            ${prevDogId 
              ? 'bg-gray-200 hover:bg-gray-300' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
          aria-label="Previous dog"
        >
          ← Previous Dog
        </button>
        
        <button
          onClick={() => nextDogId && router.push(`/dogs/${nextDogId}`)}
          disabled={!nextDogId}
          className={`
            px-4 py-2 rounded transition-colors
            ${nextDogId 
              ? 'bg-gray-200 hover:bg-gray-300' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
          aria-label="Next dog"
        >
          Next Dog →
        </button>
      </div>

      {/* Back to list button */}
      <button 
        onClick={() => router.push("/dogs")}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
      >
        ← Back to Dog List
      </button>
    </div>
  );
}