export type GameEngine = {
  onSessionCreated(sessionId: string): void;
};

export function createGameEngine(): GameEngine {
  return {
    onSessionCreated(_sessionId: string) {
      // Game state initialization will live here as the domain grows.
    }
  };
}
