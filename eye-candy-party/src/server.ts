import type * as Party from 'partykit/server';

interface GameMessage {
  type: string;
  data: unknown;
  playerId?: string;
}

interface PlayerInfo {
  id: string;
  connId: string;
  lastUpdate: number;
}

export default class Server implements Party.Server {
  private players = new Map<string, PlayerInfo>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // console.log(`Player connected: ${conn.id} to room: ${this.room.id}`);

    // Notify others that a player joined
    this.room.broadcast(
      JSON.stringify({
        type: 'player-joined',
        playerId: conn.id,
        timestamp: Date.now(),
      }),
      [conn.id]
    );

    // Send current player list to the new connection
    const currentPlayers = Array.from(this.players.values()).map((p) => ({
      id: p.id,
      connId: p.connId,
    }));

    if (currentPlayers.length > 0) {
      conn.send(
        JSON.stringify({
          type: 'existing-players',
          players: currentPlayers,
        })
      );
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    // console.log(`\n[${new Date().toISOString()}] Message from ${sender.id}:`);
    // console.log(`Raw message: ${message}`);

    try {
      const msg = JSON.parse(message) as GameMessage;
      // console.log(`Parsed message:`, msg);

      const playerId = msg.playerId || sender.id;
      // console.log(`Message type: ${msg.type}, playerId: ${playerId}`);

      // Route message by type
      switch (msg.type) {
        case 'player-state':
          // console.log(`→ Handling player-state for ${playerId}`);
          this.handlePlayerState(playerId, msg.data, sender);
          break;

        case 'chat':
          // console.log(`→ Handling chat from ${playerId}`);
          this.handleChat(playerId, msg.data, sender);
          break;

        default:
          // Generic broadcast for unknown types (extensible for future games)
          // console.log(`→ Broadcasting ${msg.type} from ${playerId}`);
          this.room.broadcast(
            JSON.stringify({
              type: msg.type,
              playerId,
              data: msg.data,
              timestamp: Date.now(),
            }),
            [sender.id]
          );
      }
    } catch (err) {
      console.error('Failed to parse message:', err, 'Raw:', message);
    }
  }

  onClose(conn: Party.Connection) {
    const player = Array.from(this.players.values()).find(
      (p) => p.connId === conn.id
    );
    if (player) {
      this.players.delete(player.id);
    }

    // console.log(`Player disconnected: ${conn.id}`);
    this.room.broadcast(
      JSON.stringify({
        type: 'player-left',
        playerId: player?.id || conn.id,
        timestamp: Date.now(),
      })
    );
  }

  private handlePlayerState(
    playerId: string,
    data: unknown,
    sender: Party.Connection
  ) {
    // Track this player
    this.players.set(playerId, {
      id: playerId,
      connId: sender.id,
      lastUpdate: Date.now(),
    });

    // Broadcast to all other players
    this.room.broadcast(
      JSON.stringify({
        type: 'player-state',
        playerId,
        data,
        timestamp: Date.now(),
      }),
      [sender.id]
    );
  }

  private handleChat(
    playerId: string,
    data: unknown,
    sender: Party.Connection
  ) {
    // Broadcast chat to everyone (including sender)
    this.room.broadcast(
      JSON.stringify({
        type: 'chat',
        playerId,
        message: data,
        timestamp: Date.now(),
      })
    );
  }
}

Server satisfies Party.Worker;
