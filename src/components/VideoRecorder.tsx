import { useState, useRef, useCallback, useEffect } from "react";
import { Video, Mic, Square, Play, Pause, Upload } from "lucide-react";
import { encryptBinary } from "../utils/crypto";
import type { EncryptedBinaryData } from "../utils/crypto";

type RecordingMode = "video" | "audio";
type RecorderState = "idle" | "previewing" | "recording" | "recorded" | "encrypting";

interface VideoRecorderProps {
  masterPassword: string;
  onSave: (data: EncryptedBinaryData & { mimeType: string; mode: RecordingMode }) => void;
  onCancel?: () => void;
}

export function VideoRecorder({ masterPassword, onSave, onCancel }: VideoRecorderProps) {
  const [mode, setMode] = useState<RecordingMode>("video");
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startPreview = useCallback(async () => {
    setError("");
    try {
      const constraints: MediaStreamConstraints =
        mode === "video"
          ? { video: { facingMode: "user", width: 640, height: 480 }, audio: true }
          : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play();
      }

      setState("previewing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access media devices";
      setError(`Permission denied or device unavailable: ${message}`);
    }
  }, [mode]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setDuration(0);

    const mimeType = mode === "video"
      ? (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm")
      : (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm");

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      recordedBlobRef.current = blob;

      // Create playback URL
      const url = URL.createObjectURL(blob);
      if (mode === "video" && videoPlaybackRef.current) {
        videoPlaybackRef.current.src = url;
      } else if (mode === "audio" && audioPlaybackRef.current) {
        audioPlaybackRef.current.src = url;
      }

      stopStream();
      setState("recorded");
    };

    mediaRecorder.start(1000); // Collect data every second
    setState("recording");

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, [mode, stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    const element = mode === "video" ? videoPlaybackRef.current : audioPlaybackRef.current;
    if (!element) return;

    if (isPlaying) {
      element.pause();
      setIsPlaying(false);
    } else {
      element.play();
      setIsPlaying(true);
      element.onended = () => setIsPlaying(false);
    }
  }, [mode, isPlaying]);

  const handleSave = useCallback(async () => {
    if (!recordedBlobRef.current) return;

    setState("encrypting");
    setError("");

    try {
      const arrayBuffer = await recordedBlobRef.current.arrayBuffer();
      const encrypted = await encryptBinary(arrayBuffer, masterPassword);

      onSave({
        ...encrypted,
        mimeType: recordedBlobRef.current.type,
        mode,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Encryption failed";
      setError(message);
      setState("recorded");
    }
  }, [masterPassword, mode, onSave]);

  const handleReset = useCallback(() => {
    stopStream();
    recordedBlobRef.current = null;
    chunksRef.current = [];
    setDuration(0);
    setIsPlaying(false);
    setState("idle");
  }, [stopStream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === "video" ? (
            <Video className="w-5 h-5 text-gold" />
          ) : (
            <Mic className="w-5 h-5 text-gold" />
          )}
          <h3 className="text-lg font-semibold text-slate-100">
            {mode === "video" ? "Record Video Message" : "Record Voice Message"}
          </h3>
        </div>

        {/* Mode Toggle */}
        {state === "idle" && (
          <div className="flex gap-1 bg-navy-900 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode("video")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === "video"
                  ? "bg-gold/20 text-gold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-label="Video mode"
            >
              <Video className="w-3.5 h-3.5" />
              Video
            </button>
            <button
              type="button"
              onClick={() => setMode("audio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === "audio"
                  ? "bg-gold/20 text-gold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-label="Audio mode"
            >
              <Mic className="w-3.5 h-3.5" />
              Audio
            </button>
          </div>
        )}
      </div>

      {/* Video Preview Area */}
      {mode === "video" && (state === "previewing" || state === "recording") && (
        <div className="relative rounded-xl overflow-hidden bg-navy-900 aspect-video">
          <video
            ref={videoPreviewRef}
            className="w-full h-full object-cover mirror"
            muted
            playsInline
            style={{ transform: "scaleX(-1)" }}
          />
          {state === "recording" && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 text-white text-sm px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              REC {formatDuration(duration)}
            </div>
          )}
        </div>
      )}

      {/* Audio Recording Indicator */}
      {mode === "audio" && state === "recording" && (
        <div className="flex flex-col items-center justify-center py-10 bg-navy-900 rounded-xl">
          <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center animate-pulse-slow">
            <Mic className="w-10 h-10 text-red-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm font-medium">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Recording {formatDuration(duration)}
          </div>
        </div>
      )}

      {/* Audio Previewing State */}
      {mode === "audio" && state === "previewing" && (
        <div className="flex flex-col items-center justify-center py-10 bg-navy-900 rounded-xl">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
            <Mic className="w-10 h-10 text-gold" />
          </div>
          <p className="mt-4 text-slate-400 text-sm">Microphone ready. Press record to start.</p>
        </div>
      )}

      {/* Playback Area */}
      {state === "recorded" && (
        <div className="bg-navy-900 rounded-xl p-4 space-y-3">
          {mode === "video" ? (
            <video
              ref={videoPlaybackRef}
              className="w-full rounded-lg aspect-video bg-black"
              playsInline
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <audio ref={audioPlaybackRef} className="hidden" />
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-slate-200 hover:text-gold hover:border-gold/30 transition-colors"
              aria-label={isPlaying ? "Pause playback" : "Play recording"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <span className="text-sm text-slate-400">
              Duration: {formatDuration(duration)}
            </span>
          </div>
        </div>
      )}

      {/* Encrypting State */}
      {state === "encrypting" && (
        <div className="flex flex-col items-center justify-center py-10 bg-navy-900 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center animate-pulse-slow">
            <Upload className="w-8 h-8 text-gold" />
          </div>
          <p className="mt-4 text-gold text-sm font-medium">Encrypting recording...</p>
          <p className="text-xs text-slate-500 mt-1">AES-256-GCM • Client-side encryption</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === "idle" && (
          <button
            type="button"
            onClick={startPreview}
            className="btn-gold flex items-center gap-2"
          >
            {mode === "video" ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            Start {mode === "video" ? "Camera" : "Microphone"}
          </button>
        )}

        {state === "previewing" && (
          <button
            type="button"
            onClick={startRecording}
            className="btn-gold flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            Start Recording
          </button>
        )}

        {state === "recording" && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </button>
        )}

        {state === "recorded" && (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="btn-gold flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Encrypt & Save
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-outline"
            >
              Re-record
            </button>
          </>
        )}

        {(state === "idle" || state === "previewing" || state === "recorded") && onCancel && (
          <button
            type="button"
            onClick={() => {
              stopStream();
              onCancel();
            }}
            className="btn-outline"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Security Footer */}
      <div className="pt-2 border-t border-navy-700">
        <p className="text-xs text-slate-600">
          🔒 Recording is encrypted locally before upload. The server never sees your raw media.
        </p>
      </div>
    </div>
  );
}
