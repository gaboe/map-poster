import { useState, useEffect } from "react";
import { Effect } from "effect";

type GeolocationStatus = "loading" | "success" | "error";

interface GeolocationResult {
  lat: number;
  lon: number;
  city: string;
  status: GeolocationStatus;
}

interface IpApiResponse {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

const PRAGUE_DEFAULT = {
  lat: 50.0755,
  lon: 14.4378,
  city: "Praha",
};

/**
 * Get geolocation from browser's navigator API
 */
function getBrowserGeolocation(): Effect.Effect<
  { lat: number; lon: number; city: string },
  Error
> {
  return Effect.tryPromise(() => {
    return new Promise<{
      lat: number;
      lon: number;
      city: string;
    }>((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: "Tvoje poloha",
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  });
}

/**
 * Get geolocation from IP-based API
 */
function getIpGeolocation(): Effect.Effect<
  { lat: number; lon: number; city: string },
  Error
> {
  return Effect.tryPromise(async () => {
    const response = await fetch("http://ip-api.com/json/");
    const data = (await response.json()) as IpApiResponse;
    return {
      lat: data.lat,
      lon: data.lon,
      city: `${data.city}, ${data.country}`,
    };
  });
}

/**
 * Get Prague default coordinates
 */
function getPragueDefault(): Effect.Effect<
  { lat: number; lon: number; city: string },
  never
> {
  return Effect.succeed({
    lat: PRAGUE_DEFAULT.lat,
    lon: PRAGUE_DEFAULT.lon,
    city: PRAGUE_DEFAULT.city,
  });
}

/**
 * Fallback chain: browser geolocation → IP API → Prague default
 */
function getGeolocation(): Effect.Effect<
  { lat: number; lon: number; city: string },
  never
> {
  return getBrowserGeolocation().pipe(
    Effect.orElse(() => getIpGeolocation()),
    Effect.orElse(() => getPragueDefault())
  );
}

export function useGeolocation() {
  const [result, setResult] = useState<GeolocationResult>({
    ...PRAGUE_DEFAULT,
    status: "loading",
  });

  useEffect(() => {
    void Effect.runPromise(getGeolocation()).then(
      (location) => {
        setResult({
          lat: location.lat,
          lon: location.lon,
          city: location.city,
          status: "success",
        });
      }
    );
  }, []);

  return result;
}
