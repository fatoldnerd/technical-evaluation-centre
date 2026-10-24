import { stateSchema, type State } from "./model";
import { seed } from "./fixtures";
export const STORAGE_KEY = "technical-evaluation-centre:v1";
export interface Repository {
  load(): State;
  save(state: State): void;
  reset(): State;
}
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function createRepository(storage: StorageAdapter): Repository {
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      try {
        return stateSchema.parse(JSON.parse(raw));
      } catch {
        throw new Error(
          "Saved demo data is invalid or from an incompatible version. Reset the demo to recover.",
        );
      }
    },
    save(state) {
      storage.setItem(STORAGE_KEY, JSON.stringify(stateSchema.parse(state)));
    },
    reset() {
      const state = seed();
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
  };
}
