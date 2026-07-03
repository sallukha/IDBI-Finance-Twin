import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, CornerDownLeft, Sparkles } from "lucide-react";
import { useApp } from "../contexts/AppContext.js";

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface VoiceAssistantProps {
  onSendMessage: (msg: string) => Promise<void>;
  aiLastMessage: string | null;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendMessage, aiLastMessage }) => {
  const { language, t } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [status, setStatus] = useState("Idle");
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "hi" ? "hi-IN" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setMicErrorMsg(null);
        setStatus("Listening...");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setStatus("Speech Recognized!");
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
        const errType = e?.error || "not-allowed";
        
        // Browser speech recognition inside iframe blocks are extremely common
        setMicErrorMsg(
          "Iframe mic block detected! Browsers restrict microphone access inside preview containers. Click the 'Open in a New Tab' button in the top-right of your screen for real-time speech, or use the Simulator Quick Prompts below!"
        );
        setStatus("Iframe Blocked");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  // Handle Voice output whenever AI responds
  useEffect(() => {
    if (aiLastMessage && speechEnabled) {
      speakText(aiLastMessage);
    }
  }, [aiLastMessage, speechEnabled]);

  const toggleListening = () => {
    if (!SpeechRecognition) {
      setStatus("Web Speech not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      // Stop speech if speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Stop current speech
    
    // Clean markdown from text for reading
    const cleanText = text
      .replace(/[#*`_\[\]()\-+]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set parameters
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSubmitSpeech = async () => {
    if (transcript.trim()) {
      const text = transcript;
      setTranscript("");
      setStatus("Processing with FinBuddy...");
      await onSendMessage(text);
      setStatus("Response Ready!");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/10 dark:to-gray-900 border border-blue-100 dark:border-blue-950/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl -mr-6 -mt-6" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              {t("voiceCoach")}
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping" />
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              Speech to Text & Text to Speech
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute system Speech */}
          <button
            onClick={() => {
              setSpeechEnabled(!speechEnabled);
              if (speechEnabled) stopSpeaking();
            }}
            className={`p-2 rounded-lg transition ${
              speechEnabled
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                : "bg-gray-100 text-gray-400 dark:bg-gray-800"
            }`}
            title={speechEnabled ? "Mute Voice Out" : "Unmute Voice Out"}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        {/* BIG MIC ACTIVATION BUTTON */}
        <button
          onClick={toggleListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform duration-300 ${
            isListening
              ? "bg-red-500 text-white animate-pulse scale-105 ring-4 ring-red-500/20"
              : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-blue-600/20"
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
        </button>

        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
          {isListening ? "Listening... Speak now!" : "Click to Speak"}
        </p>

        {/* HELPFUL ERROR FALLBACK MESSAGE FOR IFRAME MIC BLOCKS */}
        {micErrorMsg && (
          <div className="w-full mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed text-center">
            <span className="font-bold block mb-1">⚠️ Microphone Permission Blocked in Iframe</span>
            {micErrorMsg}
          </div>
        )}

        {/* QUICK VOICE SIMULATOR PROMPTS CHIPS */}
        <div className="w-full mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Voice Simulator Prompts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Hey FinBuddy, give me a quick wealth summary!",
              "Is there any suspicious transaction in my history?",
              "Recommend a monthly budget breakdown.",
              "Analyze my spending and savings health."
            ].map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(phrase);
                  setStatus("Simulated Voice Input");
                  setMicErrorMsg(null); // Clear block message when using simulator
                }}
                className="p-2 text-[10px] text-left text-gray-700 hover:text-blue-600 bg-gray-50 hover:bg-blue-50/50 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:text-white rounded-lg border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/40 transition-all font-medium leading-tight"
              >
                🎙️ "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* TRANSCRIPT TEXTBOX */}
        {transcript && (
          <div className="w-full mt-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-xs">
            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider block mb-1">
              Speech Recognized:
            </span>
            <p className="text-xs text-gray-800 dark:text-gray-200 italic mb-2">
              "{transcript}"
            </p>
            <button
              onClick={handleSubmitSpeech}
              className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded-lg transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask FinBuddy AI</span>
              <CornerDownLeft className="w-3 h-3 ml-1" />
            </button>
          </div>
        )}

        {/* SPEECH PLAYBACK STATUS */}
        {isSpeaking && (
          <div className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl py-2 px-3 border border-blue-200/30">
            <div className="flex gap-0.5 items-center">
              <span className="w-1 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="w-1 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Speaking response...
            </span>
            <button
              onClick={stopSpeaking}
              className="text-[10px] text-red-500 font-bold hover:underline ml-auto"
            >
              Stop
            </button>
          </div>
        )}

        {/* ENGINE STATUS */}
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-4 bg-gray-50 dark:bg-gray-900/60 py-0.5 px-2 rounded border border-gray-100 dark:border-gray-800/40">
          Status: {status}
        </span>
      </div>
    </div>
  );
};
