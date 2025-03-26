import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';
import * as logger from "firebase-functions/logger";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Notifica a admin/restaurante cuando hay un nuevo pedido
 */
export const notificarNuevoPedido = onCall({
  maxInstances: 10,
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado para realizar esta acción');
  }

  const { pedidoId, clienteId } = request.data as { pedidoId: string; clienteId: string };
  
  try {
    // Obtener datos del cliente
    const clienteSnap = await db.collection('users').doc(clienteId).get();
    const clienteData = clienteSnap.data();
    
    if (!clienteData) {
      throw new Error('Cliente no encontrado');
    }
    
    // Obtener tokens de dispositivos de administradores
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    // Reunir tokens para notificación
    const tokens: string[] = [];
    
    adminsSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        tokens.push(...userData.fcmTokens);
      }
    });
    
    if (tokens.length === 0) {
      console.log('No hay tokens disponibles para enviar notificaciones');
      return { success: false, message: 'No hay dispositivos registrados' };
    }
    
    // Preparar mensaje para envío múltiple
    const message = {
      notification: {
        title: '¡Nuevo pedido recibido!',
        body: `${clienteData.name || 'Un cliente'} ha realizado un nuevo pedido.`
      },
      data: {
        pedidoId: pedidoId,
        clienteId: clienteId,
        tipo: 'nuevo_pedido'
      },
      tokens: tokens
    };
    
    // Enviar notificación
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notificaciones enviadas: ${response.successCount} / ${tokens.length}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Error al enviar notificación:', error);
    throw new HttpsError('internal', 'Error al enviar notificación');
  }
});

/**
 * Notifica al cliente cuando su pedido ha sido aceptado
 */
export const notificarPedidoAceptado = onCall({
  maxInstances: 10,
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado para realizar esta acción');
  }

  const { pedidoId, repartidorId } = request.data as { pedidoId: string; repartidorId: string };
  
  try {
    // Obtener datos del pedido
    const pedidoSnap = await db.collection('pedidos').doc(pedidoId).get();
    const pedidoData = pedidoSnap.data();
    
    if (!pedidoData) {
      throw new Error('Pedido no encontrado');
    }
    
    // Obtener datos del cliente
    const clienteSnap = await db.collection('users').doc(pedidoData.userId).get();
    const clienteData = clienteSnap.data();
    
    if (!clienteData) {
      throw new Error('Cliente no encontrado');
    }
    
    // Obtener datos del repartidor
    const repartidorSnap = await db.collection('users').doc(repartidorId).get();
    const repartidorData = repartidorSnap.data();
    
    if (!repartidorData) {
      throw new Error('Repartidor no encontrado');
    }
    
    // Obtener tokens del cliente
    const tokens = clienteData.fcmTokens || [];
    
    if (tokens.length === 0) {
      console.log('No hay tokens disponibles para enviar notificaciones');
      return { success: false, message: 'No hay dispositivos registrados' };
    }
    
    // Preparar mensaje para envío múltiple
    const message = {
      notification: {
        title: '¡Tu pedido está en camino!',
        body: `${repartidorData.name || 'Tu repartidor'} ha aceptado tu pedido.`
      },
      data: {
        pedidoId: pedidoId,
        repartidorId: repartidorId,
        tipo: 'pedido_aceptado'
      },
      tokens: tokens
    };
    
    // Enviar notificación
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notificaciones enviadas: ${response.successCount} / ${tokens.length}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Error al enviar notificación:', error);
    throw new HttpsError('internal', 'Error al enviar notificación');
  }
});

/**
 * Notifica al cliente cuando su pedido ha sido entregado
 */
export const notificarPedidoEntregado = onCall({
  maxInstances: 10,
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado para realizar esta acción');
  }

  const { pedidoId } = request.data as { pedidoId: string };
  
  try {
    // Obtener datos del pedido
    const pedidoSnap = await db.collection('pedidos').doc(pedidoId).get();
    const pedidoData = pedidoSnap.data();
    
    if (!pedidoData) {
      throw new Error('Pedido no encontrado');
    }
    
    // Obtener datos del cliente
    const clienteSnap = await db.collection('users').doc(pedidoData.userId).get();
    const clienteData = clienteSnap.data();
    
    if (!clienteData) {
      throw new Error('Cliente no encontrado');
    }
    
    // Obtener tokens del cliente
    const tokens = clienteData.fcmTokens || [];
    
    if (tokens.length === 0) {
      console.log('No hay tokens disponibles para enviar notificaciones');
      return { success: false, message: 'No hay dispositivos registrados' };
    }
    
    // Preparar mensaje para envío múltiple
    const message = {
      notification: {
        title: '¡Tu pedido ha sido entregado!',
        body: 'Tu pedido ha sido entregado con éxito. ¡Buen provecho!'
      },
      data: {
        pedidoId: pedidoId,
        tipo: 'pedido_entregado'
      },
      tokens: tokens
    };
    
    // Enviar notificación
    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Notificaciones enviadas: ${response.successCount} / ${tokens.length}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Error al enviar notificación:', error);
    throw new HttpsError('internal', 'Error al enviar notificación');
  }
});

// Trigger que actualiza los datos cuando un estado de pedido cambia
export const actualizarEstadoPedido = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  const pedidoId = event.params.pedidoId;
  
  // Verificar que los datos existan
  if (!event.data?.before?.data() || !event.data?.after?.data()) {
    logger.info('No hay datos disponibles para procesar');
    return;
  }
  
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  
  // Si el estado no cambió, no hacemos nada
  if (newData.estado === oldData.estado) {
    return;
  }
  
  // Registrar timestamp según el nuevo estado
  const updates: Record<string, any> = {};
  
  if (newData.estado === 'en camino' && !newData.aceptadoEn) {
    updates.aceptadoEn = admin.firestore.FieldValue.serverTimestamp();
  } else if (newData.estado === 'entregado' && !newData.entregadoEn) {
    updates.entregadoEn = admin.firestore.FieldValue.serverTimestamp();
  } else if (newData.estado === 'cancelado' && !newData.canceladoEn) {
    updates.canceladoEn = admin.firestore.FieldValue.serverTimestamp();
  }
  
  // Si hay actualizaciones, aplicarlas
  if (Object.keys(updates).length > 0) {
    await db.collection('pedidos').doc(pedidoId).update(updates);
  }
});