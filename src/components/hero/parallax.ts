"use client";
import { createContext, useContext, type MutableRefObject } from "react";

/** Normalised pointer position (-1..1), updated without React re-renders. */
export type Pointer = { x: number; y: number };
export const ParallaxContext = createContext<MutableRefObject<Pointer> | null>(null);
export const useParallaxRef = () => useContext(ParallaxContext);
