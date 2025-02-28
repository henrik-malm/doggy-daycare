"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDogStatus } from "../context/DogStatusContext";
import styles from "./styles.module.css";

//111111111111111111111111///////////////////////
// function useDebounce(value, delay = 300) {
//  const [debouncedValue, setDebouncedValue] = useState(value);
//  
//  useEffect(() => {
//    if (value === undefined) return;
//    
//    const handler = setTimeout(() => setDebouncedValue(value), delay);
//    return () => clearTimeout(handler);
//  }, [value, delay]);
//  
//  return debouncedValue;
// }
//111111111111111111111111111111111111111///////////////////


// XXX1 "main function start"           export default function DogList() { 





// ------------------------------------------------------
// ============ Const decleration and initialitons ======
// ------------------------------------------------------

const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
// 111 //////  const [searchTerm, setSearchTerm] = useState("");
// 111 //////  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState("all");
  const { changedDogs, STATUS, lastError, clearError } = useDogStatus();
  const router = useRouter();
  const DOGS_API_URL = "https://majazocom.github.io/Data/dogs.json";
// ------------------------------------------------------------------
// //////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------


  const fetchDogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const resp = await fetch(DOGS_API_URL);
      
      if (!resp.ok) {
        throw new Error(`Failed to fetch dogs (Status: ${resp.status})`);
      }
      
      const data = await resp.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected an array of dogs");
      }
      
      setDogs(data);
    } catch (err) {
      console.error("Error fetching dogs:", err);
      setError(err.message || "Failed to load dogs");
    } finally {
      setIsLoading(false);
    }
  }, [DOGS_API_URL]);

  // Initiates right, check for 1234324 time
  useEffect(() => {
    fetchDogs();


// Error hadnling during fetch from api 
    if (lastError) clearError();
  }, [fetchDogs, lastError, clearError]);

  useEffect(() => {
    if (lastError) {
      setError(prev => prev || lastError);
    }
  }, [lastError]);

// Error hadnling during fetch from api   

// ------------------------------------------------------
// ============ FILTERFUNCTION ==========================
// ------------------------------------------------------
 
const filteredDogs = dogs
//11111111 Debounce part    .filter(dog => {
//      const dogName = (dog.name || "").toLowerCase();
//      const searchTermLower = (debouncedSearchTerm || "").toLowerCase();
//      return dogName.includes(searchTermLower);
// 1111111   })
    .filter(dog => {
      if (filter === STATUS.ALL) return true;
      
      if (dog.chipNumber in changedDogs) {
        return changedDogs[dog.chipNumber] === filter;
      }
      
      const presentStatus = dog.present === true ? STATUS.PRESENT : STATUS.ABSENT;
      return presentStatus === filter;
    });
// -------------------------------------------------------------
// /////////////////////////////////////////////////////////////
// -------------------------------------------------------------


/////// RETURN OF "HTML FOR ALL" /////////

  return (
    <div>
      <h1>Dog List</h1>

 {/*Can be improved if has time. Displayed inline , "instead of default browser error message on page
 Standard way as understod for dispalying error message to user in React. 
 Note && so conditional where error has to be value for message to show, will not display if null or no error, 
 initial we setting the error to null*/}

      {error && (
        <div>
          <span>
            Oops! Something went wrong. Please try again in a moment.
            <br />
            If the problem persists, please contact emailaddress and provide them with the error nessage: {error}
          </span>
          <button onClick={fetchDogs}>
            Try Again
          </button>
        </div>
)}
/////////////////////////////////////////////////////////////////////////////////////////////////////

      
      <div>
        <input
          type="text"
          placeholder="Search dogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search dogs" // Own Note - if time go over aria-labeling in more detail 
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
//////////////////////////////////////////////////////////////////////////////////////

{/* Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader Loader*/} 
      {isLoading && (
        <div>
          <div>Loading...</div>
        </div>
      )}
{/*DO LODING SPINNER IF HAVE TIMEr*/}



{/*Bit overkill here but graceful way handling feedback to user, is a common Ux pattern for empty state hadnling and considered best practice in webdev given user context to we seeing no display rather tahn just showing an empty page*/}
      {!isLoading && filteredDogs.length === 0 && (
        <div>
          {debouncedSearchTerm || filter !== STATUS.ALL 
            ? "No dogs match your search or filter criteria."
            : "No dogs are currently registered."}
        </div>
      )}


// 00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
      
<div>
// removed hadnling fallbacks in from here to end if no value cause...time and but overkill

// for status first check if exsit in chagnedDogs than use this value and if not read the api value statusvale
  {filteredDogs.map(dog => {
    const status =
      dog.chipNumber in changedDogs
        ? changedDogs[dog.chipNumber]
        : dog.present
        ? STATUS.PRESENT
        : STATUS.ABSENT;

// bordercolor (in styles.module.css)
    return (
      <div
        key={dog.chipNumber}
        className={`${
          status === STATUS.PRESENT ? styles.presentDog : styles.absentDog
        }`}

// buttonhandling with routing 
        onClick={() => router.push(`/dogs/${dog.chipNumber}`)} // if click routes to individual page
        className={`${
          status === STATUS.PRESENT ? styles.presentDog : styles.absentDog
        }`}
        role="button"
        aria-label={`View details for ${dog.name}`}
      >


        <div>
          <img
            src={dog.img}
            alt={`Photo of ${dog.name}`}
            width="300"
            height="300"
          />
        </div>

        <div>
          <div>
            <h3>{dog.name}</h3>
            <span>
              {dog.sex === "male" ? "♂️" : "♀️"} {dog.age}y/o
            </span>
          </div>

          <p>{dog.breed}</p>

          <p>{status === STATUS.PRESENT ? "Present" : "Absent"}</p>

          <p>
            Owner: {dog.owner.name} {dog.owner.lastName}
          </p>
        </div>
      </div>
    );
  })}
</div>
    </div>
  );
}