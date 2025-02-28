"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div>
      <h1>Welcome to Doggy Daycare</h1>
      <button onClick={() => router.push("/dogs")}>View Dogs</button>
    </div>
  );
}
