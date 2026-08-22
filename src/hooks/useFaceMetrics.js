import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const SAMPLE_INTERVAL_MS = 500;
const CENTER_TOLERANCE = 0.35;
const JITTER_TOLERANCE = 0.25;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function meanAbsDeviation(values, mean) {
  if (values.length < 2) return 0;
  return average(values.map((v) => Math.abs(v - mean)));
}

export function useFaceMetrics(videoRef, enabled) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const samplesRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/weights"),
          faceapi.nets.faceExpressionNet.loadFromUri("/weights"),
        ]);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !ready || failed) return undefined;

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.4,
    });

    async function sample() {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;
      try {
        const result = await faceapi
          .detectSingleFace(video, detectorOptions)
          .withFaceExpressions();
        if (result) {
          const { x, y, width, height } = result.detection.box;
          const cx = (x + width / 2) / video.videoWidth;
          const cy = (y + height / 2) / video.videoHeight;
          const expr = result.expressions;
          samplesRef.current.push({
            present: true,
            centerOffset: clamp01(Math.hypot(cx - 0.5, cy - 0.5)),
            size: clamp01(Math.sqrt((width * height) / (video.videoWidth * video.videoHeight))),
            engagement:
              clamp01((expr.happy || 0) + (expr.neutral || 0) + 0.5 * (expr.surprised || 0)),
          });
        } else {
          samplesRef.current.push({ present: false });
        }
      } catch {
        // Skip frames that fail detection; keep the loop running.
      }
    }

    timerRef.current = setInterval(sample, SAMPLE_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [enabled, ready, failed, videoRef]);

  const getMetrics = useCallback(() => {
    const samples = samplesRef.current.splice(0);
    const total = samples.length;
    if (!total) return null;

    const presentSamples = samples.filter((s) => s.present);
    const presence = presentSamples.length / total;

    if (!presentSamples.length) {
      return {
        face_presence: 0,
        eye_contact: 0,
        attention: 0,
        stability: 0,
        visibility: "poor",
        quality_flag: "poor",
      };
    }

    const offsets = presentSamples.map((s) => s.centerOffset);
    const sizes = presentSamples.map((s) => s.size);
    const engagements = presentSamples.map((s) => s.engagement);

    const avgOffset = average(offsets);
    const eyeContact = clamp01(1 - avgOffset / CENTER_TOLERANCE);

    const attention = clamp01(0.5 * presence + 0.5 * average(engagements));

    const jitter =
      meanAbsDeviation(offsets, avgOffset) / JITTER_TOLERANCE +
      meanAbsDeviation(sizes, average(sizes)) / JITTER_TOLERANCE;
    const stability = clamp01(1 - jitter);

    const visibility = presence > 0.8 ? "good" : presence > 0.5 ? "fair" : "poor";
    const qualityFlag = presence > 0.5 ? "good" : "poor";

    return {
      face_presence: Number(presence.toFixed(3)),
      eye_contact: Number(eyeContact.toFixed(3)),
      attention: Number(attention.toFixed(3)),
      stability: Number(stability.toFixed(3)),
      visibility,
      quality_flag: qualityFlag,
    };
  }, []);

  return { ready, failed, getMetrics };
}
