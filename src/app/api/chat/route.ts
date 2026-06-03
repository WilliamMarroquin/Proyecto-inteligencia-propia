import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

// Inicializa Gemini de forma segura
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Guardar el mensaje del usuario en BD
    await prisma.chatMessage.create({
      data: { role: 'user', content: message }
    });

    if (!genAI) {
      const mockReply = "La clave de Google Gemini (GEMINI_API_KEY) no está configurada en tu archivo .env. Por favor añádela para usar el asistente.";
      
      // Guardar el mensaje del asistente en BD
      await prisma.chatMessage.create({
        data: { role: 'assistant', content: mockReply }
      });
      
      return NextResponse.json({ reply: mockReply });
    }

    // Obtener los últimos mensajes de la BD para tener contexto
    const history = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 10 // Limitar el historial para no exceder tokens
    });

    // Formatear historial para Gemini
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Obtener contexto en tiempo real de la base de datos
    const totalPagos = await prisma.pago.count();
    
    // Obtener los pagos sincronizados más recientes (últimos 100)
    const ultimosPagos = await prisma.pago.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const sumaTotalReciente = ultimosPagos.reduce((acc, pago) => acc + pago.monto, 0);

    // Instrucciones del sistema (contexto general para Gemini)
    const systemInstruction = `Eres "Órbita", un asistente de voz empresarial experto en contabilidad. Tu objetivo es responder preguntas sobre los datos sincronizados del banco.
MUY IMPORTANTE: Tus respuestas deben ser CORTAS, directas y conversacionales, como si hablaras por teléfono, porque serán leídas por un sintetizador de voz. No uses listas largas ni formatos complejos.

CONTEXTO EN TIEMPO REAL DE LA BASE DE DATOS:
- Total de pagos históricos en el sistema: ${totalPagos}
- Cantidad de pagos en el último lote sincronizado: ${ultimosPagos.length}
- Suma total de abonos en el último lote: Q${sumaTotalReciente.toFixed(2)}

Aquí tienes los datos exactos del último lote sincronizado (en formato JSON, utilízalos para responder si te preguntan por montos, clientes o fechas de pagos específicos):
${JSON.stringify(ultimosPagos, null, 2)}
`;

    // Inicializar modelo
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction 
    });

    // Iniciar chat con historial
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Enviar el nuevo mensaje (notar que ya lo agregamos al historial, pero startChat requiere el historial SIN el mensaje actual, o podemos simplemente mandar el history vacío y mandar todo el contexto en el mensaje.
    // Para simplificar y evitar problemas de duplicados en el último mensaje:
    const historyWithoutLast = formattedHistory.slice(0, -1);
    const chatSession = model.startChat({ history: historyWithoutLast });
    const result = await chatSession.sendMessage(message);

    const assistantReply = result.response.text();

    // Guardar respuesta en BD
    await prisma.chatMessage.create({
      data: { role: 'assistant', content: assistantReply }
    });

    return NextResponse.json({ reply: assistantReply });
  } catch (error: any) {
    console.error('Error en el chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
