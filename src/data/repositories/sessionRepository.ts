import { db } from "../db.js";
import { createId, createToken } from "../../utils/id.js";

export type Session = {
  id: string;
  token: string;
  createdAt: Date;
};

export async function createAnonymousSession(): Promise<Session> {
  const id = createId();
  const token = createToken();

  const result = await db.query<{
    id: string;
    token: string;
    created_at: Date;
  }>(
    `
      INSERT INTO sessions (id, token)
      VALUES ($1, $2)
      RETURNING id, token, created_at
    `,
    [id, token]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    token: row.token,
    createdAt: row.created_at
  };
}
