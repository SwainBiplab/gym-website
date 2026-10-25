"use client";
import { SegmentError } from "@/components/app/segment-error";
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError {...props} />;
}
