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
      model: "gemini-flash-lite-latest",
      systemInstruction: `Eres "Órbita" (ahora llamado Finasist AI), un asistente de voz empresarial experto en contabilidad. Tu objetivo es responder preguntas sobre los datos sincronizados del banco y la cartera de clientes.
MUY IMPORTANTE: Tus respuestas deben ser CORTAS, directas y conversacionales.
FORMATO DE NÚMEROS: ESCRIBE SIEMPRE LOS NÚMEROS Y FECHAS USANDO DÍGITOS (Ejemplo: "Q4,553.12" y "13/06/2026"). NUNCA escribas los números con letras (no digas "cuatro mil").
LA MONEDA SIEMPRE ES QUETZALES (GTQ). Nunca digas pesos ni dólares. Cuando hables de dinero, di "quetzales" o usa "Q".
- SI PREGUNTAN POR PAGOS RECIENTES O LISTAS, USA 'consultar_pagos_recientes'.
- SI PREGUNTAN POR TOTALES, PAGO MÁS ALTO, MÁS BAJO O ESTADÍSTICAS GLOBALES, USA 'obtener_resumen_estadistico'.
- SI PREGUNTAN QUIÉNES ESTÁN EN MORA O QUIÉNES DEBEN DINERO, USA 'consultar_morosos'.
- SI PREGUNTAN POR EL ESTADO ESPECÍFICO DE UN CLIENTE, USA 'consultar_estado_cliente'.`,
      tools: [{
        functionDeclarations: [
          {
            name: "consultar_pagos_recientes",
            description: "Obtiene los últimos 20 pagos registrados en la base de datos. Úsalo para listas de pagos recientes o buscar quién pagó recientemente.",
            parameters: { type: SchemaType.OBJECT, properties: {} }
          },
          {
            name: "obtener_resumen_estadistico",
            description: "Obtiene estadísticas de TODA la base de datos (total de pagos, suma total de ingresos, pago máximo y mínimo). Úsalo cuando pregunten por el pago más alto, el total de dinero recaudado, o cuántos registros hay en total.",
            parameters: { type: SchemaType.OBJECT, properties: {} }
          },
          {
            name: "consultar_morosos",
            description: "Obtiene la lista de clientes que están actualmente en mora (tienen atrasos en su convenio). Úsalo cuando pregunten quiénes deben dinero, quiénes no han pagado, o quiénes están en mora.",
            parameters: { type: SchemaType.OBJECT, properties: {} }
          },
          {
            name: "consultar_estado_cliente",
            description: "Obtiene el estado de deuda y pagos de un cliente específico por su nombre.",
            parameters: { 
              type: SchemaType.OBJECT, 
              properties: {
                nombreCliente: { type: SchemaType.STRING, description: "Nombre del cliente a buscar" }
              },
              required: ["nombreCliente"]
            }
          }
        ]
      }]
    });

    const chatSession = model.startChat({ history: formattedHistory });
    
    // 5. Enviar mensaje e interceptar si Gemini quiere usar la herramienta
    let result = await chatSession.sendMessage(message);
    let finalReply = "";

    const functionCalls = result.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === "consultar_pagos_recientes") {
        const ultimosPagos = await prisma.pago.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20
        });
        
        result = await chatSession.sendMessage([{
          functionResponse: {
            name: "consultar_pagos_recientes",
            response: { pagos: ultimosPagos }
          }
        }]);
      } else if (call.name === "obtener_resumen_estadistico") {
        const aggr = await prisma.pago.aggregate({
          _count: { id: true },
          _sum: { monto: true },
          _max: { monto: true },
          _min: { monto: true }
        });
        
        result = await chatSession.sendMessage([{
          functionResponse: {
            name: "obtener_resumen_estadistico",
            response: { estadisticas: aggr }
          }
        }]);
      } else if (call.name === "consultar_morosos" || call.name === "consultar_estado_cliente") {
        const args = call.args as any;
        const nombreBuscado = args?.nombreCliente?.toLowerCase();
        
        const clientes = await prisma.cliente.findMany({
          include: { convenios: true, pagos: true }
        });

        const resultados = [];

        for (const cliente of clientes) {
          if (nombreBuscado && !cliente.nombre.toLowerCase().includes(nombreBuscado)) continue;

          const convenio = cliente.convenios[0];
          const pagosTotales = cliente.pagos.reduce((acc, pago) => acc + pago.monto, 0);
          
          let mesesAtraso = 0;
          let saldoPendiente = 0;

          if (convenio) {
            const mesesTranscurridos = Math.max(1, Math.floor((new Date().getTime() - new Date(convenio.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
            const mesesEfectivos = mesesTranscurridos < 2 ? 6 : mesesTranscurridos; 
            const deudaTotal = mesesEfectivos * convenio.montoCuota;
            saldoPendiente = deudaTotal - pagosTotales;
            if (saldoPendiente > 0) mesesAtraso = Math.floor(saldoPendiente / convenio.montoCuota);
          }

          if (call.name === "consultar_estado_cliente" || (call.name === "consultar_morosos" && mesesAtraso > 0)) {
            resultados.push({
              nombre: cliente.nombre,
              pagosRealizados: cliente.pagos.length,
              totalPagado: pagosTotales,
              mesesAtraso: mesesAtraso,
              saldoVencido: saldoPendiente > 0 ? saldoPendiente : 0,
              estado: mesesAtraso > 0 ? "Moroso" : "Al dia"
            });
          }
        }

        result = await chatSession.sendMessage([{
          functionResponse: {
            name: call.name,
            response: { datos: resultados.length > 0 ? resultados : "No se encontraron resultados." }
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
