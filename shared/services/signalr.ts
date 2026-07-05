import * as signalR from "@microsoft/signalr";
import { authManager } from "./authManager";

const BASE_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL;

export type HubConfig = {
  endpoint: string;
};

export function createHub({ endpoint }: HubConfig) {
  let connection: signalR.HubConnection | null = null;

  function getConnection() {
    if (connection) return connection;

    // Create a new connection if it doesn't exist
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}${endpoint}`, {
        accessTokenFactory: async () => authManager.getAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .build();

    return connection;
  }

  async function connect() {
    const conn = getConnection();

    if (conn.state === signalR.HubConnectionState.Connected) {
      console.warn("Already connected to hub:", endpoint);
      return;
    }

    if (conn.state !== signalR.HubConnectionState.Disconnected) {
      console.warn("Hub is not disconnected. Current state:", conn.state);
      return;
    }

    await conn.start();
    console.log("Connected to hub:", endpoint);
  }

  async function disconnect() {
    if (!connection) return;
    await connection.stop();
    connection = null;
    console.log("Disconnected from hub:", endpoint);
  }

  function on(event: string, handler: (...args: any[]) => void) {
    const conn = getConnection();
    conn.on(event, handler);
  }

  function off(event: string, handler: (...args: any[]) => void) {
    if (!connection) return;
    connection.off(event, handler);
  }

  async function invoke<T = any>(
    methodName: string,
    ...args: any[]
  ): Promise<T> {
    await connect();
    return (await getConnection().invoke(methodName, ...args)) as T;
  }

  return {
    connect,
    disconnect,
    on,
    off,
    invoke,
  };
}
