import { randomBytes, randomUUID } from "node:crypto";

export function createId() {
  return randomUUID();
}

export function createToken() {
  return randomBytes(32).toString("hex");
}
