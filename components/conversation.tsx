/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CameraOff, ArrowLeft, Mic, MicOff } from "lucide-react";
import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatedShinyText } from "./animated-shiny-text";
import { DeclarationRecorder } from "./declaration-recorder";

interface ConversationProps {
  agentType: "declaration" | "comite" | "investisseurs";
  onBack: () => void;
}

export function Conversation({ agentType, onBack }: ConversationProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const [urlFetchFailed, setUrlFetchFailed] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // New states for workflow management
  const [currentPhase, setCurrentPhase] = useState<"declaration" | "questions">(
    "declaration"
  );
  const [declarationComplete, setDeclarationComplete] = useState(false);
  const [declarationTranscript, setDeclarationTranscript] =
    useState<string>("");
  const [showNextPhaseDialog, setShowNextPhaseDialog] = useState(false);

  // New states for dialog and transcript functionality
  const [showSynthesisDialog, setShowSynthesisDialog] = useState(false);
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<any>(null);

  // Enhanced speaking states
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  // Animation controls for the status text
  const statusTextControls = useAnimationControls();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      setConversationStarted(true);
      setInitializing(false);
      startTimer();
      setConversationId(conversation.getId() as string);
      console.log("Conversation ID:", conversation.getId());
    },
    onDisconnect: () => {
      console.log(
        "Disconnected from ElevenLabs conversation with id:",
        conversation.getId()
      );
      setConversationStarted(false);
      setIsAssistantSpeaking(false);
      stopTimer();

      // Automatic disconnection after 15 minutes
      if (elapsedTime >= 900) {
        // 15 minutes = 900 seconds
        setShowSynthesisDialog(true);
      }
    },
    onMessage: (message) => {
      console.log("Message:", message);

      // Enhanced speaking state management
      if (message.source === "ai") {
        setIsAssistantSpeaking(conversation.isSpeaking);
      }
    },
    onError: (error) => {
      console.error("Error:", error);
      setUrlFetchFailed(true);
      setInitializing(false);
    },
  });

  // Get agent configuration with professional video setup
  const getAgentConfig = () => {
    // If we're in declaration phase for declaration agent type
    if (agentType === "declaration" && currentPhase === "declaration") {
      return {
        title: "Déclaration",
        name: "Assistant",
        role: "Enregistrement",
        icon: "noto:studio-microphone",
      };
    }

    // If we're in questions phase for declaration agent type
    if (agentType === "declaration" && currentPhase === "questions") {
      return {
        title: "Questions/Réponses",
        name: "Corentin",
        role: "Coach Eloquence",
        icon: "material-symbols:question-answer",
      };
    }

    switch (agentType) {
      case "comite":
        return {
          title: "Comité d'Entreprise",
          name: "Corentin",
          role: "Coach Eloquence",
          icon: "fluent-color:people-community-16",
        };
      case "investisseurs":
        return {
          title: "Interview TV",
          name: "Corentin",
          role: "Coach Eloquence",
          icon: "fluent-emoji:money-bag",
        };
      default:
        return {
          title: "Déclaration",
          name: "Assistant",
          role: "Enregistrement",
          icon: "noto:studio-microphone",
        };
    }
  };

  const agentConfig = getAgentConfig();

  // Timer functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setElapsedTime(0);
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        // Auto-stop at 15 minutes
        if (prev >= 899) {
          // 14:59
          stopConversation();
          return 900;
        }
        return prev + 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Get transcript and generate review
  const getTranscript = async (conversationId: string) => {
    try {
      setIsGeneratingSynthesis(true);
      toast.loading("Récupération et analyse de votre exercice...", {
        duration: 10000,
      });

      const response = await fetch(`/api/get-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, agentType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get transcript: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscript(data);

      // Generate review using OpenAI
      const reviewResponse = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: data.conversationData.transcript,
          agentType,
        }),
      });

      if (!reviewResponse.ok) {
        throw new Error(
          `Failed to generate review: ${reviewResponse.statusText}`
        );
      }

      const reviewData = await reviewResponse.json();

      // Navigate to results page
      router.push(
        `/results?conversationId=${conversationId}&agentType=${agentType}`
      );

      toast.dismiss();
      toast.success("Analyse terminée !");
      return { transcript: data, review: reviewData };
    } catch (error) {
      console.error("Error processing transcript:", error);
      toast.dismiss();
      toast.error("Impossible de traiter la transcription de l'exercice.");
      return null;
    } finally {
      setIsGeneratingSynthesis(false);
    }
  };

  const handleGenerateSynthesis = async () => {
    if (!conversationId) {
      toast.error("Aucun ID de conversation disponible.");
      return;
    }
    // Keep dialog open and show loading state
    await getTranscript(conversationId);
  };

  const getSignedUrl = async (): Promise<string | null> => {
    try {
      setLoadingSignedUrl(true);

      // Determine the actual agent type to use
      let actualAgentType:
        | "declaration"
        | "questions-reponses"
        | "comite"
        | "investisseurs" = agentType;
      if (agentType === "declaration" && currentPhase === "questions") {
        actualAgentType = "questions-reponses";
      }

      const requestBody: any = { agentType: actualAgentType };

      console.log("📤 Requesting signed URL with body:", requestBody);
      console.log("📤 Current phase:", currentPhase);
      console.log(
        "📤 Declaration transcript available:",
        !!declarationTranscript
      );
      console.log(
        "📤 Declaration transcript length:",
        declarationTranscript?.length || 0
      );

      const response = await fetch("/api/get-signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to get signed url: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📋 Signed URL API response:", data);

      if (data.directUse) {
        return null;
      }
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      setUrlFetchFailed(true);
      return null;
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (cameraEnabled) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach((track) => track.stop());
      }
    } else {
      initializeMedia();
    }
    setCameraEnabled(!cameraEnabled);
  };

  // Toggle microphone
  const toggleMic = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !micEnabled;
      });
    }
    setMicEnabled(!micEnabled);
  };

  // Initialize media
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setCameraEnabled(false);
      return false;
    }
  };

  const startConversation = useCallback(
    async (providedTranscript?: string) => {
      if (conversationStarted || loadingSignedUrl) return;

      try {
        console.log(
          "🚀 Starting conversation for agentType:",
          agentType,
          "phase:",
          currentPhase
        );

        const signedUrlResponse = await getSignedUrl();
        console.log("📋 Signed URL response:", signedUrlResponse);

        // Prepare dynamic variables if we have a transcript
        const dynamicVariables: any = {};
        const transcriptToUse = providedTranscript || declarationTranscript;

        if (
          agentType === "declaration" &&
          currentPhase === "questions" &&
          transcriptToUse
        ) {
          dynamicVariables.transcript = transcriptToUse;
          console.log(
            "📝 Adding transcript to dynamic variables, length:",
            transcriptToUse.length
          );
          console.log(
            "📝 Transcript content preview:",
            transcriptToUse.substring(0, 200) + "..."
          );
        }

        console.log("🔧 Dynamic variables to send:", dynamicVariables);

        if (signedUrlResponse) {
          console.log("🔗 Using signed URL with dynamic variables");

          // Start session with dynamic variables according to ElevenLabs docs
          await conversation.startSession({
            signedUrl: signedUrlResponse,
            ...(Object.keys(dynamicVariables).length > 0 && {
              dynamicVariables,
            }),
          });
        } else if (!urlFetchFailed) {
          console.log("🔗 Using direct agent ID");

          const agentId = (() => {
            // For declaration agent type, use declaration agent for both phases
            if (agentType === "declaration") {
              return process.env.NEXT_PUBLIC_DECLARATION_AGENT_ID;
            }

            // For other agent types
            switch (agentType) {
              case "comite":
                return process.env.NEXT_PUBLIC_COMITE_AGENT_ID;
              case "investisseurs":
                return process.env.NEXT_PUBLIC_INVESTORS_AGENT_ID;
              default:
                return process.env.NEXT_PUBLIC_DECLARATION_AGENT_ID;
            }
          })();

          console.log("🤖 Using agent ID:", agentId);
          console.log(
            "🔧 Dynamic variables for direct connection:",
            dynamicVariables
          );

          // Start session with dynamic variables according to ElevenLabs docs
          await conversation.startSession({
            agentId: agentId || "default_agent_id",
            ...(Object.keys(dynamicVariables).length > 0 && {
              dynamicVariables,
            }),
          });
        }
      } catch (error) {
        console.error("Failed to start conversation:", error);
        setInitializing(false);
      }
    },
    [
      conversation,
      conversationStarted,
      loadingSignedUrl,
      urlFetchFailed,
      agentType,
      currentPhase,
      declarationTranscript,
    ]
  );

  // Wrapper function for button clicks
  const handleStartConversation = () => {
    startConversation();
  };

  const stopConversation = useCallback(async () => {
    const currentConversationId = conversation.getId();
    await conversation.endSession();
    stopTimer();
    setConversationStarted(false);
    setIsAssistantSpeaking(false);

    if (currentConversationId) {
      setConversationId(currentConversationId);

      // For declaration agent, show next phase dialog instead of synthesis
      if (agentType === "declaration" && currentPhase === "declaration") {
        setDeclarationComplete(true);
        setShowNextPhaseDialog(true);
      } else {
        setShowSynthesisDialog(true);
      }
    }
  }, [conversation, agentType, currentPhase]);

  // Handle transition to questions phase
  const handleNextPhase = async () => {
    if (!declarationTranscript) {
      toast.error("Aucune transcription disponible");
      return;
    }

    try {
      // Switch to questions phase
      setCurrentPhase("questions");
      setShowNextPhaseDialog(false);
      setInitializing(true);

      // Reset states for new conversation
      setConversationStarted(false);
      setElapsedTime(0);

      // Start questions phase conversation
      setTimeout(() => {
        startConversation(declarationTranscript);
      }, 1000);
    } catch (error) {
      console.error("Error transitioning to questions phase:", error);
      toast.error("Impossible de passer à la phase questions/réponses.");
    }
  };

  // Initialize everything once on component mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      try {
        const mediaInitialized = await initializeMedia();
        if (mediaInitialized && mounted) {
          // For declaration phase, just initialize media
          if (agentType === "declaration" && currentPhase === "declaration") {
            setInitializing(false);
          } else {
            // For other phases, initialize and start conversation
            setTimeout(() => {
              if (mounted) {
                startConversation();
              }
            }, 1000);
          }
        } else {
          setInitializing(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setInitializing(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
      stopTimer();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [agentType, currentPhase]);

  // Effect for managing status text visibility
  useEffect(() => {
    if (isAssistantSpeaking && conversationStarted) {
      statusTextControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
      });
    } else {
      statusTextControls.start({
        opacity: 0,
        y: 10,
        transition: { duration: 0.3 },
      });
    }
  }, [isAssistantSpeaking, conversationStarted, statusTextControls]);

  // If we're in declaration phase, use the dedicated recorder component
  if (agentType === "declaration" && currentPhase === "declaration") {
    return (
      <DeclarationRecorder
        onTranscriptionComplete={(transcript) => {
          console.log(
            "🎯 Transcript received, transitioning to questions phase"
          );
          console.log("🎯 Transcript content:", transcript);
          console.log("🎯 Transcript length:", transcript.length);

          setDeclarationTranscript(transcript);
          setDeclarationComplete(true);

          // Automatically transition to questions phase
          setCurrentPhase("questions");
          setInitializing(true);

          // Reset states for new conversation
          setConversationStarted(false);
          setElapsedTime(0);

          // Start questions phase conversation after state has updated
          // Use a longer delay to ensure state is properly set
          setTimeout(() => {
            console.log(
              "🚀 About to start questions phase with transcript:",
              transcript
            );
            startConversation(transcript);
          }, 2000);
        }}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col justify-between h-screen bg-white text-gray-900">
      {/* Compact Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          disabled={conversationStarted && !urlFetchFailed}
          className="rounded-full hover:bg-gray-100 border-gray-300 text-gray-700 h-10 w-10 hop-shadow"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Icon icon={agentConfig.icon} className="h-6 w-6 text-[#5347D2]" />
            <h1 className="text-xl font-black hop-text-gradient">
              {agentConfig.title}
            </h1>
            {agentType === "declaration" && (
              <span className="text-xs bg-[#FFBD58]/20 text-[#FFBD58] px-2 py-1 rounded-full ml-2 font-bold">
                {currentPhase === "declaration" ? "Phase 1/2" : "Phase 2/2"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 font-medium">
            {agentConfig.name} • {agentConfig.role}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-xs">
            <div className="font-mono text-[#5347D2] font-bold">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-gray-500">15:00</div>
          </div>
          <div className="w-8 h-8 rounded-lg overflow-hidden hop-shadow">
            <img
              src="https://static.wixstatic.com/media/afad13_0190f051b7e24543b4ae1cb86c46be0a~mv2.png/v1/fill/w_1264,h_852,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Copie%20de%20Red%20and%20Beige%20Bold%20Typography%20Cosmetic%20Brand%20Logo.png"
              alt="Hop Eloquence"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main content - Questions Phase Layout */}
      <div className="flex-grow flex items-center justify-center p-4 bg-gradient-to-br from-[#5347D2]/5 via-white to-[#FFBD58]/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-5xl items-center">
          {/* Left - Assistant Image */}
          <div className="flex justify-center lg:justify-start lg:pl-8 relative">
            <Card className="overflow-hidden w-80 h-80 bg-white border-2 border-gray-200 hop-shadow-lg relative rounded-full">
              <div className="h-full w-full relative rounded-full overflow-hidden">
                <img
                  src="/char.png"
                  alt={agentConfig.name}
                  className="h-full w-full object-cover object-top rounded-full"
                />

                {isAssistantSpeaking && conversationStarted && (
                  <motion.div
                    className="absolute z-50 inset-0 bg-gradient-to-t from-[#5347D2]/20 to-transparent rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </div>
            </Card>

            {/* Status indicator */}
            <div className="absolute top-4 right-[7rem] flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 hop-shadow border border-gray-200 z-[60]">
              {isAssistantSpeaking && conversationStarted && (
                <div className="flex space-x-1 mr-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-[#5347D2] rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: "0.8s",
                      }}
                    />
                  ))}
                </div>
              )}
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  conversationStarted
                    ? isAssistantSpeaking
                      ? "bg-[#5347D2] animate-pulse"
                      : "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-gray-900 text-sm font-medium">
                {conversationStarted
                  ? isAssistantSpeaking
                    ? `${agentConfig.name} parle`
                    : "Écoute"
                  : "Déconnecté"}
              </span>
            </div>
          </div>

          {/* Right - User Camera */}
          <div className="flex justify-center lg:justify-start">
            <Card className="overflow-hidden h-[400px] w-full max-w-md bg-white border-2 border-gray-200 hop-shadow-lg rounded-3xl">
              <div className="h-full w-full relative rounded-3xl overflow-hidden">
                {cameraEnabled ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover transform scale-x-[-1] rounded-3xl"
                    style={{ objectPosition: "center 20%" }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <CameraOff className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 text-sm">Caméra désactivée</p>
                    </div>
                  </div>
                )}

                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 hop-shadow">
                  <span className="text-gray-900 text-xs font-medium">
                    Vous
                  </span>
                </div>

                <div className="absolute bottom-4 right-4">
                  <div
                    className={`p-2 rounded-full hop-shadow ${
                      micEnabled
                        ? "bg-green-500/20 text-green-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {micEnabled ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCamera}
            className="rounded-full h-12 w-12 hop-shadow bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
          >
            {cameraEnabled ? (
              <Icon icon="lucide:camera" className="size-4" />
            ) : (
              <Icon icon="lucide:camera-off" className="size-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleMic}
            className={`rounded-full h-12 w-12 hop-shadow ${
              micEnabled
                ? "bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                : "bg-red-50 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-700"
            }`}
          >
            {micEnabled ? (
              <Mic className="size-4" />
            ) : (
              <MicOff className="size-4" />
            )}
          </Button>

          {/* Questions Phase Controls (ElevenLabs conversation) */}
          {urlFetchFailed ? (
            <Button
              className="rounded-full h-14 w-14 hop-shadow hop-gradient-bg hover:shadow-lg hover:scale-105 text-white"
              size="icon"
              onClick={handleStartConversation}
            >
              <Icon icon="lucide:play" className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              className="rounded-full h-14 w-14 hop-shadow hop-gradient-bg hover:shadow-lg hover:scale-105 text-white"
              size="icon"
              disabled={conversationStarted || loadingSignedUrl}
              onClick={handleStartConversation}
            >
              {initializing || loadingSignedUrl ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Icon icon="lucide:play" className="h-5 w-5" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            disabled={!conversationStarted}
            onClick={stopConversation}
            className="rounded-full h-12 w-12 hop-shadow bg-red-50 border-red-300 hover:bg-red-100 text-red-600 hover:text-red-700 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400"
          >
            <Icon icon="lucide:square" className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500 mt-2">
          <p className="font-medium">
            {conversationStarted
              ? "Conversation active"
              : initializing
              ? "Initialisation..."
              : "Prêt à commencer"}
          </p>
        </div>
      </div>

      {/* Phase Transition Dialog - From Declaration to Questions */}
      <Dialog open={showNextPhaseDialog} onOpenChange={setShowNextPhaseDialog}>
        <DialogContent className="sm:max-w-lg bg-white border-2 border-gray-200 text-gray-900 z-[70] hop-shadow-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-black hop-text-gradient">
              Déclaration terminée !
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 hop-gradient-bg rounded-full flex items-center justify-center mx-auto mb-4 hop-shadow">
              <Icon
                icon="material-symbols:question-answer"
                className="w-8 h-8 text-white"
              />
            </div>

            <h3 className="text-lg mb-3 text-center font-bold text-gray-900">
              Prêt pour les questions ?
            </h3>

            <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
              Votre déclaration a été enregistrée. Passons maintenant aux
              questions-réponses avec Corentin basées sur ce que vous venez de
              dire.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setShowNextPhaseDialog(false);
                setShowSynthesisDialog(true);
              }}
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Terminer ici
            </Button>
            <Button
              onClick={handleNextPhase}
              className="w-full sm:w-auto hop-gradient-bg hover:shadow-lg hover:scale-105 text-white font-bold"
            >
              Continuer vers les questions
              <Icon icon="lucide:arrow-right" className="ml-2 w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Synthesis Dialog */}
      <Dialog open={showSynthesisDialog} onOpenChange={setShowSynthesisDialog}>
        <DialogContent className="sm:max-w-lg bg-white border-2 border-gray-200 text-gray-900 z-[70] hop-shadow-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-black hop-text-gradient">
              Exercice terminé !
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-[#5347D2] hop-shadow">
              <img
                src="https://static.wixstatic.com/media/afad13_0190f051b7e24543b4ae1cb86c46be0a~mv2.png/v1/fill/w_1264,h_852,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Copie%20de%20Red%20and%20Beige%20Bold%20Typography%20Cosmetic%20Brand%20Logo.png"
                alt={agentConfig.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-lg mb-3 text-center font-bold text-gray-900">
              Analyse de performance ?
            </h3>

            <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
              Obtenez une analyse détaillée avec des conseils personnalisés de
              Corentin pour améliorer votre éloquence et votre présence.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowSynthesisDialog(false)}
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              disabled={isGeneratingSynthesis}
            >
              {isGeneratingSynthesis ? "Analyse en cours..." : "Non merci"}
            </Button>
            <Button
              onClick={handleGenerateSynthesis}
              className="w-full sm:w-auto hop-gradient-bg hover:shadow-lg hover:scale-105 text-white font-bold"
              disabled={isGeneratingSynthesis}
            >
              {isGeneratingSynthesis ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Analyse en cours...
                </>
              ) : (
                "Analyser ma performance"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
