export function encodePassphrase(passphrase: string) {
  return encodeURIComponent(passphrase);
}

export function decodePassphrase(base64String: string) {
  return decodeURIComponent(base64String);
}

export function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}

export function randomString(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function isLowPowerDevice() {
  return navigator.hardwareConcurrency < 6;
}

// Room Code Management
export function generateRoomCode(): string {
  // Generate a 6-digit alphanumeric code (more user-friendly)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function validateRoomCode(code: string): boolean {
  // Validate format: 6 characters, alphanumeric, uppercase
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
}

export function roomCodeToRoomId(code: string): string {
  // Convert room code to room ID format
  return `room-${code.toLowerCase()}`;
}

export function roomIdToRoomCode(roomId: string): string | null {
  // Extract room code from room ID
  const match = roomId.match(/^room-([a-z0-9]{6})$/);
  return match ? match[1].toUpperCase() : null;
}

// Enhanced room ID generation with code support
export function generateRoomWithCode(): { roomId: string; code: string } {
  const code = generateRoomCode();
  const roomId = roomCodeToRoomId(code);
  return { roomId, code };
}
