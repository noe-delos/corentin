/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Conversation } from "@/components/conversation";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Toaster } from "sonner";
import { Dancing_Script, PT_Serif, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dancing-script",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-pt-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

type AgentType = "declaration" | "comite" | "investisseurs";

interface Agent {
  id: AgentType;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  firstMessage: string;
  iconBgClass?: string;
}

const agents: Agent[] = [
  {
    id: "declaration",
    title: "Conférence de presse",
    description: "Pitchez votre projet et répondez aux questions de la presse",
    icon: "noto:studio-microphone",
    firstMessage:
      "Bonjour, vous avez la parole pour votre déclaration. Prenez votre temps.",
  },
  {
    id: "comite",
    title: "Comité social et économique (CSE)",
    description: "Faites face aux élus du personnel",
    image: "/gov.png",
    iconBgClass: "bg-white",
    firstMessage: "Bonjour, présentez-nous les résultats de l'exercice.",
  },
  {
    id: "investisseurs",
    title: "Interview TV",
    description: "Répondez à un journaliste imprévisible",
    icon: "noto:movie-camera",
    firstMessage:
      "Bonjour, présentez-nous votre projet et votre demande de financement.",
  },
];

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

  const handleBack = () => {
    setSelectedAgent(null);
  };

  if (selectedAgent) {
    return <Conversation agentType={selectedAgent} onBack={handleBack} />;
  }

  return (
    <div
      className={`min-h-screen bg-white text-gray-900 ${dancingScript.variable} ${ptSerif.variable} ${inter.variable}`}
    >
      <Toaster position="top-center" />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden hop-shadow">
                <img
                  src="https://static.wixstatic.com/media/afad13_0190f051b7e24543b4ae1cb86c46be0a~mv2.png/v1/fill/w_1264,h_852,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Copie%20de%20Red%20and%20Beige%20Bold%20Typography%20Cosmetic%20Brand%20Logo.png"
                  alt="Hop Eloquence"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-4xl font-black hop-text-gradient font-inter">
                  Hop Eloquence
                </h1>
                <p className="text-gray-600 text-sm font-medium">
                  Tes idées méritent bien plus qu'une simple prise de parole...
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-[#5347D2]"
                >
                  <Icon icon="mdi:youtube" className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-[#5347D2]"
                >
                  <Icon icon="mdi:instagram" className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-[#5347D2]"
                >
                  <Icon icon="mdi:linkedin" className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-[#5347D2]/5 via-white to-[#FFBD58]/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
              <span className="text-gray-900">Apprends à faire vivre</span>
              <br />
              <span className="hop-text-gradient">une expérience oratoire</span>
            </h2>
            <p className="text-xl text-gray-600 mb-4 font-medium">
              Coach, Formateur et Enseignant{" "}
              <span className="text-[#FFBD58] font-bold">
                en éloquence et rhétorique
              </span>
            </p>
            <p className="text-lg text-gray-500 mb-2">
              Créateur de contenu •{" "}
              <span className="text-[#FFBD58] font-bold">400K+ abonnés</span>
            </p>
            <p className="text-lg text-gray-500 mb-8">
              <span className="text-[#FFBD58] font-bold">
                2x Vice-champion du monde
              </span>{" "}
              de débat francophone
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-16"
          >
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden hop-shadow-lg border-4 border-white">
              <img
                src="https://static.wixstatic.com/media/afad13_0190f051b7e24543b4ae1cb86c46be0a~mv2.png/v1/fill/w_1264,h_852,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Copie%20de%20Red%20and%20Beige%20Bold%20Typography%20Cosmetic%20Brand%20Logo.png"
                alt="Corentin - Hop Eloquence"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[#5347D2] font-bold text-lg mt-4">C'est moi !</p>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <motion.h3
            className="text-5xl font-black mb-4 text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choisissez votre{" "}
            <span
              className={`${dancingScript.className} text-[#5347D2] text-6xl`}
            >
              Simulation
            </span>
          </motion.h3>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Sessions de 15 minutes avec analyse personnalisée
          </motion.p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="h-full"
            >
              <Card
                className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl rounded-2xl bg-white border-2 border-gray-100 hover:border-[#5347D2]/20 overflow-hidden hop-shadow hover:hop-shadow-lg"
                onClick={() => setSelectedAgent(agent.id)}
              >
                <CardHeader className="text-center pb-4 bg-gradient-to-br from-gray-50 to-white">
                  <div
                    className={`w-20 h-20 ${
                      agent.iconBgClass || "hop-gradient-bg"
                    } rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-hop`}
                  >
                    {agent.icon ? (
                      <Icon
                        icon={agent.icon}
                        className={`w-10 h-10 ${
                          agent.iconBgClass ? "text-gray-700" : "text-white"
                        }`}
                      />
                    ) : agent.image ? (
                      <Image
                        src={agent.image}
                        alt={agent.title}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                    ) : null}
                  </div>
                  <CardTitle
                    className={cn(
                      "text-2xl font-black text-gray-900 mb-3",
                      index === 1 && "text-xl"
                    )}
                  >
                    {agent.title}
                  </CardTitle>
                  <CardDescription
                    className={cn(
                      "text-gray-600 font-medium",
                      index === 0 && "text-sm"
                    )}
                  >
                    {agent.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <Button
                    className="w-full font-bold py-6 text-lg text-white hop-gradient-bg hover:shadow-lg hover:scale-105 rounded-xl transition-all duration-300 border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgent(agent.id);
                    }}
                  >
                    Commencer
                    <Icon icon="lucide:arrow-right" className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* About Section */}
        <motion.section
          className="mt-24 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h4 className="text-3xl font-black text-gray-900 mb-6">
            Pourquoi <span className="text-[#5347D2]">Hop Eloquence</span> ?
          </h4>
          <div className="bg-gradient-to-br from-[#5347D2]/5 to-[#FFBD58]/5 rounded-2xl p-8 hop-shadow">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              "Bien s'exprimer, ça s'apprend ! Mon enjeu n'est pas de
              t'apprendre à jouer un personnage et déclamer un texte que tu n'as
              pas écrit."
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong className="text-[#5347D2]">
                C'est de t'apprendre à t'exprimer à partir de qui tu es et de
                tes idées à toi.
              </strong>
              La parole comme un moyen de porter un message et des idées qui
              comptent.
            </p>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-gray-500">
            <p className="font-medium">
              &copy; 2025 Hop Eloquence. Tous droits réservés.
            </p>
            <p className="text-sm mt-2">
              Auteur de{" "}
              <span className="text-[#FFBD58] font-bold">
                "L'art d'avoir toujours réponse à tout"
              </span>
              , Eyrolles
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
