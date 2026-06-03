import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json();
    let currentSessionId = sessionId;

    // 1. Manejar Sesión
    if (!currentSessionId) {
      // Si no hay sesión, crear una nueva con el primer mensaje como título
      const newSession = await prisma.chatSession.create({
        data: { title: message.substring(0, 30) + (message.length > 30 ? "..." : "") }
      });
      currentSessionId = newSession.id;
    } else {
      // Actualizar updatedAt
      await prisma.chatSession.update({
        where: { id: currentSessionId },
        data: { updatedAt: new Date() }
      });
    }

    // 2. Guardar mensaje del usuario
    await prisma.chatMessage.create({
      data: { role: 'user', content: message, sessionId: currentSessionId }
    });

    if (!genAI) {
      const mockReply = "La clave de Google Gemini (GEMINI_API_KEY) no está configurada.";
      await prisma.chatMessage.create({
        data: { role: 'assistant', content: mockReply, sessionId: currentSessionId }
      });
      return NextResponse.json({ reply: mockReply, sessionId: currentSessionId });
    }

    // 3. Obtener historial solo de ESTA sesión
    const rawHistory = await prisma.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'asc' }
    });

    // Remove the current message we just inserted so we don't send it in history
    rawHistory.pop();

    // Guarantee strictly alternating history (Gemini requirement)
    const formattedHistory: any[] = [];
    let expectedRole = 'user';
    for (const msg of rawHistory) {
      const gRole = msg.role === 'user' ? 'user' : 'model';
      if (gRole === expectedRole) {
        formattedHistory.push({ role: gRole, parts: [{ text: msg.content }] });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    // 4. Inicializar modelo con Herramientas (Function Calling)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: `Eres "Órbita" (ahora llamado Finasist AI), un asistente de voz empresarial experto en contabilidad. Tu objetivo es responder preguntas sobre los datos sincronizados del banco.
MUY IMPORTANTE: Tus respuestas deben ser CORTAS, directas y conversacionales, porque serán leídas por un sintetizador de voz. No uses listas largas ni formatos complejos.
LA MONEDA SIEMPRE ES QUETZALES (GTQ). Nunca digas pesos ni dólares. Cuando hables de dinero, di "quetzales".
SI EL USUARIO PREGUNTA POR PAGOS O DATOS ESPECÍFICOS, USA LA HERRAMIENTA 'consultar_pagos_recientes'. De lo contrario, responde normalmente.`,
      tools: [{
        functionDeclarations: [{
          name: "consultar_pagos_recientes",
          description: "Obtiene los últimos 20 pagos registrados en la base de datos (nombres de clientes, montos, fechas y estados). Úsalo cuando te pregunten sobre quién pagó, cuánto pagaron, o detalles de pagos recientes.",
          parameters: { type: SchemaType.OBJECT, properties: {} }
        }]
      }]
    });

    const chatSession = model.startChat({ history: formattedHistory });
    
    // 5. Enviar mensaje e interceptar si Gemini quiere usar la herramienta
    let result = await chatSession.sendMessage(message);
    let finalReply = "";

    const functionCalls = result.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      // Gemini decidió que necesita datos de la base de datos!
      const call = functionCalls[0];
      if (call.name === "consultar_pagos_recientes") {
        // Ejecutar consulta real en milisegundos
        const ultimosPagos = await prisma.pago.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20
        });
        
        // Devolver los datos a Gemini para que construya la respuesta
        result = await chatSession.sendMessage([{
          functionResponse: {
            name: "consultar_pagos_recientes",
            response: { pagos: ultimosPagos }
          }
        }]);
      }
    }

    finalReply = result.response.text();

    // 6. Guardar respuesta del asistente
    await prisma.chatMessage.create({
      data: { role: 'assistant', content: finalReply, sessionId: currentSessionId }
    });

    return NextResponse.json({ reply: finalReply, sessionId: currentSessionId });
  } catch (error: any) {
    console.error('Error en el chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
