import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly disponibilidad$ = new Subject<any>();
  private readonly reservaciones$ = new Subject<any>();

  constructor(private ngZone: NgZone) {
    this.connect();
  }

  private connect() {
    try {
      // Extraer únicamente el host base (ej: http://localhost:3000)
      let wsHost = 'http://localhost:3000';
      try {
        wsHost = new URL(environment.apiUrl).origin;
      } catch {
        wsHost = 'http://localhost:3000';
      }

      this.socket = io(`${wsHost}/realtime`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log(`⚡ Conectado exitosamente al WebSocket de INTECAP RealTime (ID: ${this.socket?.id})`);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ Error de conexión al WebSocket RealTime:', err.message);
      });

      this.socket.on('disponibilidad_actualizada', (data) => {
        console.log('📡 [WS] Evento recibido: disponibilidad_actualizada', data);
        this.ngZone.run(() => {
          this.disponibilidad$.next(data);
        });
      });

      this.socket.on('nueva_reservacion', (data) => {
        console.log('📡 [WS] Evento recibido: nueva_reservacion', data);
        this.ngZone.run(() => {
          this.reservaciones$.next(data);
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('⚠️ Desconectado del WebSocket de INTECAP RealTime:', reason);
      });
    } catch (err) {
      console.warn('No se pudo inicializar WebSocket:', err);
    }
  }

  onDisponibilidadUpdate(): Observable<any> {
    return this.disponibilidad$.asObservable();
  }

  onNuevaReservacion(): Observable<any> {
    return this.reservaciones$.asObservable();
  }

  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping_disponibilidad');
    }
  }
}
