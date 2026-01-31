import { connectDb } from "@map-poster/db";
import { env } from "@/env/server";

export const db = connectDb(env.DATABASE_URL);
export type { Db } from "@map-poster/db";
