import { DogStatusProvider } from "./context/DogStatusContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DogStatusProvider>{children}</DogStatusProvider>
      </body>
    </html>
  );
}