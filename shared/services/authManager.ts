import * as SecureStore from "expo-secure-store";

type AuthEvent = {
  onUnauthorized: () => void;
};

class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private events: AuthEvent[] = [];

  async loadTokens() {
    this.accessToken = await SecureStore.getItemAsync("access_token");
    this.refreshToken = await SecureStore.getItemAsync("refresh_token");
    console.log("Loaded tokens:", this.accessToken, this.refreshToken);
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    SecureStore.setItemAsync("access_token", access);
    SecureStore.setItemAsync("refresh_token", refresh);
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  getDeviceId() {
    // Placeholder for actual device ID logic
    return "device-id-placeholder";
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    SecureStore.deleteItemAsync("access_token");
    SecureStore.deleteItemAsync("refresh_token");
  }

  setEvent(event: AuthEvent) {
    this.events.push(event);
  }

  handleUnauthorized() {
    this.clearTokens();
    // Notify all registered events about unauthorized access
    this.events.forEach((e) => {
      e.onUnauthorized();
    });
  }
}

export const authManager = new AuthManager();
