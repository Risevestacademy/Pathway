import * as SecureStore from "expo-secure-store";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { useEffect } from "react";
import type { Career } from "../types";

type LoadStatus = "idle" | "loading" | "success" | "error";

interface SavedCareersState {
  careers: Career[];
  status: LoadStatus;
  errorMessage: string | null;
  mutationError: string | null;
  isSaving: boolean;
  load: () => Promise<void>;
  toggle: (career: Career) => Promise<void>;
}

const stores = new Map<string, ReturnType<typeof createSavedCareersStore>>();

function getStorageKey(userId: string): string {
  const encodedUserId = Array.from(userId, (character) =>
    character.codePointAt(0)!.toString(16),
  ).join("-");
  return `pathway.saved-careers.v1.${encodedUserId}`;
}

function parseSavedCareers(raw: string): Career[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) {
    throw new Error("Saved careers data is invalid.");
  }
  return value.map((career): Career => {
    if (
      typeof career !== "object" ||
      career === null ||
      typeof career.id !== "string" ||
      typeof career.slug !== "string" ||
      typeof career.title !== "string" ||
      typeof career.shortDescription !== "string"
    ) {
      throw new Error("Saved careers data is invalid.");
    }
    return {
      id: career.id,
      slug: career.slug,
      title: career.title,
      shortDescription: career.shortDescription,
    };
  });
}

function createSavedCareersStore(userId: string) {
  const storageKey = getStorageKey(userId);
  return createStore<SavedCareersState>((set, get) => ({
    careers: [],
    status: "idle",
    errorMessage: null,
    mutationError: null,
    isSaving: false,

    load: async () => {
      if (get().status === "loading" || get().status === "success") return;
      set({ status: "loading", errorMessage: null });
      try {
        const stored = await SecureStore.getItemAsync(storageKey);
        const careers = stored === null ? [] : parseSavedCareers(stored);
        set({ careers, status: "success", errorMessage: null });
      } catch {
        set({
          status: "error",
          errorMessage: "We couldn't load saved careers from this device.",
        });
      }
    },

    toggle: async (career) => {
      if (get().status !== "success" || get().isSaving) {
        throw new Error("Saved careers are not ready to update.");
      }

      const current = get().careers;
      const isSaved = current.some((item) => item.id === career.id);
      const updated = isSaved
        ? current.filter((item) => item.id !== career.id)
        : [...current, career];

      set({ isSaving: true, mutationError: null });
      try {
        await SecureStore.setItemAsync(storageKey, JSON.stringify(updated));
        set({ careers: updated });
      } catch {
        const message = "We couldn't update saved careers on this device.";
        set({ mutationError: message });
        throw new Error(message);
      } finally {
        set({ isSaving: false });
      }
    },
  }));
}

function getStore(userId: string) {
  let store = stores.get(userId);
  if (!store) {
    store = createSavedCareersStore(userId);
    stores.set(userId, store);
  }
  return store;
}

export function useSavedCareers(userId: string) {
  const store = getStore(userId);
  const state = useStore(store);

  useEffect(() => {
    void store.getState().load();
  }, [store]);

  return state;
}

export function clearSavedCareersStore(userId?: string): void {
  if (userId === undefined) {
    stores.clear();
  } else {
    stores.delete(userId);
  }
}
