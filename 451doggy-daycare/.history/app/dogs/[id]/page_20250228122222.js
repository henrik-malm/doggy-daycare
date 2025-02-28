"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDogStatus } from "../../context/DogStatusContext";
import { use } from 'react';
import styles from "../styles.module.css";

export default function DogDetails({ params }) {
  const unwrappedParams = use(params);
  const chipNumber = unwrappedParams.id;
  
  const [dog, setDog] = useState(null);
  const [allDogs, setAllDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextDogId, setNextDogId] = useState(null);
  const [prevDogId, setPrevDogId] = useState(null);
  
  const { changedDogs, updateStatus, isUpdating, STATUS } = useDogStatus();
  const router = useRouter();

  const DOGS_API_URL = "https://majazocom.github.io/Data/dogs.json";

  const fetchDogData = useCallback(async () => {
    if (!chipNumber) {
      setError("Invalid dog ID");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch(DOGS_API_URL);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch dog data (Status: ${res.status})`);
      }
      
      const dogsData = await res.json();
      
      if (!Array.isArray(dogsData)) {
        throw new Error("Invalid data format: expected an array of dogs");
      }
      
      setAllDogs(dogsData);
      
      const foundDog = dogsData.find(dog => dog.chipNumber === chipNumber);
      
      if (!foundDog) {
        throw new Error(`Dog with ID ${chipNumber} not found`);
      }
      
      setDog(foundDog);
      
      // Set up navigation between dogs
      const dogIndex = dogsData.findIndex(dog => dog.chipNumber === chipNumber);
      
      if (dogIndex > 0) {
        setPrevDogId(dogsData[dogIndex - 1].chipNumber);
      } else {
        setPrevDogId(null);
      }
      
      if (dogIndex < dogsData.length - 1) {
        setNextDogId(dogsData[dogIndex + 1].chipNumber);
      } else {
        setNextDogId(null);
      }
      
    } catch (err) {
      console.error("Error fetching dog:", err);
      setError(err.message || "Failed to load dog details");
    } finally {
      setIsLoading(false);
    }
  }, [chipNumber]);

  useEffect(() => {
    fetchDogData();
  }, [fetchDogData]);

  const toggleStatus = async () => {
    if (!dog) return;
    
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
      <div>
        <div>
          <p>Error: {error}</p>
        </div>
        <button onClick={() => router.push("/dogs")}>
          ← Back to Dog List
        </button>
      </div>
    );
  }

  if (isLoading || !dog) {
    return (
      <div>
        <div></div>
        <p>Loading dog details...</p>
      </div>
    );
  }

  const status = dog.chipNumber in changedDogs 
    ? changedDogs[dog.chipNumber] 
    : (dog.present === true ? STATUS.PRESENT : STATUS.ABSENT);

  return (
    <div
      className={status === STATUS.PRESENT ? styles.presentDog : styles.absentDog}
    >
      <div>
        <div>
          {dog.img ? (
            <img
              src={dog.img}
              alt={`Photo of ${dog.name}`}
            />
          ) : (
            <div>No image available</div>
          )}
        </div>
        
        <div>
          <div>
            <h2>{dog.name || "Unknown dog"}</h2>
            <span>
              {dog.sex === "male" ? "♂️ Male" : "♀️ Female"}, {dog.age} years old
            </span>
          </div>
          
          <div>
            <div>
              <p><strong>Breed:</strong> {dog.breed || "Unknown"}</p>
              <p><strong>Chip Number:</strong> {dog.chipNumber}</p>
              <p>
                <strong>Status:</strong> {status === STATUS.PRESENT ? 'Present' : 'Absent'}
              </p>
            </div>
            
            <div>
              <h3>Owner Information</h3>
              {dog.owner ? (
                <>
                  <p>
                    <strong>Name:</strong> {dog.owner.name} {dog.owner.lastName}
                  </p>
                  {dog.owner.phoneNumber && (
                    <p>
                      <strong>Phone:</strong> {dog.owner.phoneNumber}
                    </p>
                  )}
                </>
              ) : (
                <p>Owner information not available</p>
              )}
            </div>
          </div>
          
          <button 
            onClick={toggleStatus}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : (status === STATUS.PRESENT ? 'Mark as Absent' : 'Mark as Present')}
          </button>
        </div>
      </div>

      <div>
        <button
          onClick={() => prevDogId && router.push(`/dogs/${prevDogId}`)}
          disabled={!prevDogId}
          aria-label="Previous dog"
        >
          ← Previous Dog
        </button>
        
        <button
          onClick={() => nextDogId && router.push(`/dogs/${nextDogId}`)}
          disabled={!nextDogId}
          aria-label="Next dog"
        >
          Next Dog →
        </button>
      </div>

      <button 
        onClick={() => router.push("/dogs")}
      >
        ← Back to Dog List
      </button>
    </div>
  );
}