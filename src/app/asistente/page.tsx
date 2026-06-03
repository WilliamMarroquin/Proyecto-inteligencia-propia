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
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
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
            handleUserMessage(currentTranscript);
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

  const handleUserMessage = async (message: string) => {
    setAiResponse("Pensando...");
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      
      if (data.reply) {
        setAiResponse(data.reply);
        speakWithNeuralVoice(data.reply);
      }
    } catch (err) {
      setAiResponse("Hubo un error de conexión.");
    }
  };

  const speakWithNeuralVoice = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    const cleanText = text.replace(/[*_~`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    
    // Algotirmo avanzado para seleccionar la voz más humana posible
    const voices = synthRef.current.getVoices();
    
    // 1. Buscar voces "Neural" de Microsoft (Edge las tiene integradas)
    let bestVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Neural'));
    
    // 2. Si no hay Neural, buscar Premium o Google
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Premium') || v.name.includes('Google')));
    }
    
    // 3. Fallback a cualquier voz en español
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang.startsWith('es'));
    }
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#050B14',
      backgroundImage: 'radial-gradient(circle at center, #0B192C 0%, #050B14 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      
      {/* Título Superior */}
      <div style={{ position: 'absolute', top: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#3B82F6', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)', margin: 0 }}>
          Asistente Pro
        </h1>
        <p style={{ color: 'var(--secondary)', marginTop: '0.5rem', fontSize: '1.2rem' }}>
          {isListening ? "Escuchando..." : isSpeaking ? "Hablando..." : "Pausado"}
        </p>
      </div>

      {/* Orbe Brillante Central */}
      <div style={{
        position: 'relative',
        width: '250px',
        height: '250px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Glow animado */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: isSpeaking ? 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(59,130,246,0) 70%)' : 
                      isListening ? 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(16,185,129,0) 70%)' :
                      'radial-gradient(circle, rgba(100,116,139,0.5) 0%, rgba(100,116,139,0) 70%)',
          animation: isSpeaking ? 'pulse 1s infinite alternate' : 
                     isListening ? 'pulse 2s infinite alternate' : 'none',
          transition: 'all 0.5s ease'
        }} />
        
        {/* Bola blanca central */}
        <div style={{
          position: 'absolute',
          width: '100px',
          height: '100px',
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          boxShadow: '0 0 50px #FFFFFF',
          animation: isSpeaking ? 'breath 1.5s infinite alternate' : 'none',
          zIndex: 10
        }} />
      </div>

      {/* Textos (Transcripción / Respuesta) */}
      <div style={{ 
        position: 'absolute', 
        bottom: '8rem', 
        width: '80%', 
        maxWidth: '800px', 
        textAlign: 'center',
        minHeight: '80px'
      }}>
        <p style={{ 
          fontSize: '1.4rem', 
          lineHeight: '1.6', 
          color: isListening ? '#10b981' : '#E2E8F0',
          transition: 'color 0.3s'
        }}>
          {isListening && transcript ? `"${transcript}"` : aiResponse}
        </p>
      </div>

      {/* Botones de control */}
      <div style={{ 
        position: 'absolute', 
        bottom: '3rem', 
        display: 'flex', 
        gap: '2rem' 
      }}>
        <button 
          onClick={interruptAndListen}
          style={{
            backgroundColor: '#EAB308',
            color: '#422006',
            border: 'none',
            padding: '1rem 3rem',
            borderRadius: '999px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Mic size={24} /> Interrumpir
        </button>

        <button 
          onClick={stopListeningAndExit}
          style={{
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            padding: '1rem 3rem',
            borderRadius: '999px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <X size={24} /> Salir
        </button>
      </div>

      {/* Definir animaciones en CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes breath {
          0% { transform: scale(0.95); }
          100% { transform: scale(1.05); }
        }
      `}} />
    </div>
  );
}
