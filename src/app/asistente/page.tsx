"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, X } from "lucide-react";

export default function AsistentePro() {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("¡Hola! Soy tu Asistente Pro de Órbita Enterprise. Estoy escuchando...");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Leer sessionId de la URL si venimos del chat flotante
    const urlParams = new URLSearchParams(window.location.search);
    const existingSessionId = urlParams.get('sessionId');
    if (existingSessionId) {
      setSessionId(existingSessionId);
      sessionIdRef.current = existingSessionId;
    }

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-ES';
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          
          if (event.results[0].isFinal) {
            setIsListening(false);
            // PASAR EL REF, NO EL ESTADO (para evitar el bug del closure)
            handleUserMessage(currentTranscript, sessionIdRef.current);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            setAiResponse("Hubo un error con el micrófono. Intenta de nuevo.");
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        // Auto-start listening
        startListening();
      } else {
        setAiResponse("Tu navegador no soporta el reconocimiento de voz.");
        setIsListening(false);
      }
    }
    
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startListening = () => {
    if (synthRef.current) synthRef.current.cancel();
    setTranscript("");
    setIsSpeaking(false);
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch(e) {}
  };

  const stopListeningAndExit = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    router.push("/");
  };

  const interruptAndListen = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    startListening();
  };

  // Se recibe por parámetro para garantizar que se use el actual
  const handleUserMessage = async (message: string, currentSession: string | null) => {
    setAiResponse("Pensando...");
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId: currentSession })
      });
      const data = await res.json();
      
      if (data.sessionId && data.sessionId !== currentSession) {
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      }
      
      if (data.reply) {
        setAiResponse(data.reply);
        speakWithNeuralVoice(data.reply);
      } else if (data.error) {
        setAiResponse("Lo siento, hubo un problema al pensar mi respuesta.");
        speakWithNeuralVoice("Lo siento, hubo un problema técnico.");
      }
    } catch (err) {
      setAiResponse("Hubo un error de conexión.");
      speakWithNeuralVoice("Hubo un error de conexión.");
    }
  };

  const speakWithNeuralVoice = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    const cleanText = text.replace(/[*_~`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    
    const voices = synthRef.current.getVoices();
    let bestVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Neural'));
    if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Premium') || v.name.includes('Google')));
    if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith('es'));
    if (bestVoice) utterance.voice = bestVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Automatically start listening again after finishing speaking
      setTimeout(() => startListening(), 500); 
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      startListening();
    };

    synthRef.current.speak(utterance);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      color: 'white',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      
      {/* Título Superior */}
      <div style={{ position: 'absolute', top: '3rem', textAlign: 'center', zIndex: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '2px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          ÓRBITA
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 300 }}>
          {isListening ? "Escuchando..." : isSpeaking ? "Hablando..." : "Pausado"}
        </p>
      </div>

      {/* Orbe Siri-style */}
      <div style={{
        position: 'relative',
        width: '300px',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'blur(15px) contrast(2)',
        opacity: isSpeaking ? 1 : isListening ? 0.7 : 0.3,
        transform: isSpeaking ? 'scale(1.2)' : 'scale(1)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div className="siri-blob siri-blob-1" style={{ animationPlayState: (isSpeaking || isListening) ? 'running' : 'paused' }} />
        <div className="siri-blob siri-blob-2" style={{ animationPlayState: (isSpeaking || isListening) ? 'running' : 'paused' }} />
        <div className="siri-blob siri-blob-3" style={{ animationPlayState: (isSpeaking || isListening) ? 'running' : 'paused' }} />
        
        {/* Core blanco */}
        <div style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 50px white',
          zIndex: 10
        }} />
      </div>

      {/* Textos (Transcripción / Respuesta) */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10rem', 
        width: '80%', 
        maxWidth: '800px', 
        textAlign: 'center',
        zIndex: 20
      }}>
        <p style={{ 
          fontSize: '1.5rem', 
          fontWeight: 300,
          lineHeight: '1.6', 
          color: 'rgba(255,255,255,0.9)',
          transition: 'opacity 0.3s',
          opacity: (transcript || aiResponse) ? 1 : 0
        }}>
          {isListening && transcript ? `"${transcript}"` : aiResponse}
        </p>
      </div>

      {/* Botones de control */}
      <div style={{ 
        position: 'absolute', 
        bottom: '3rem', 
        display: 'flex', 
        gap: '1.5rem',
        zIndex: 20
      }}>
        <button 
          onClick={interruptAndListen}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '1rem 2rem',
            borderRadius: '999px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        >
          <Mic size={20} /> Interrumpir
        </button>

        <button 
          onClick={stopListeningAndExit}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(10px)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1rem 2rem',
            borderRadius: '999px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
        >
          <X size={20} /> Salir
        </button>
      </div>

      {/* Estilos Globales para el Orbe */}
      <style dangerouslySetInnerHTML={{__html: `
        .siri-blob {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%;
          mix-blend-mode: screen;
          animation: blob-spin 8s linear infinite;
        }
        .siri-blob-1 {
          background: linear-gradient(135deg, #FF3366, #FF9933);
          animation-direction: alternate;
        }
        .siri-blob-2 {
          background: linear-gradient(135deg, #33CCFF, #3366FF);
          width: 220px;
          height: 220px;
          animation-delay: -2s;
          animation-direction: alternate-reverse;
        }
        .siri-blob-3 {
          background: linear-gradient(135deg, #9933FF, #FF33CC);
          width: 180px;
          height: 180px;
          animation-delay: -4s;
        }
        
        @keyframes blob-spin {
          0% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(0deg) scale(1); }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: rotate(120deg) scale(1.1); }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; transform: rotate(240deg) scale(0.9); }
          100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(360deg) scale(1); }
        }
      `}} />
    </div>
  );
}
