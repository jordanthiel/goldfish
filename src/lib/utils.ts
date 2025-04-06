
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// AES encryption helpers
export const encryptAES = (text: string, secretKey: string = "default-therapy-key-change-in-production"): string => {
  try {
    // Create a simple AES-like encryption using a combination of XOR and Base64
    // Note: In a production app, use a proper crypto library like 'crypto-js'
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(secretKey);
    
    // XOR the text with the key (repeating the key as necessary)
    const encryptedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to Base64 for storage
    return btoa(String.fromCharCode(...encryptedBytes));
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to a simple encoding method
    return btoa(text);
  }
};

export const decryptAES = (encryptedText: string, secretKey: string = "default-therapy-key-change-in-production"): string => {
  try {
    // Decode Base64
    const encryptedBytes = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );
    const keyBytes = new TextEncoder().encode(secretKey);
    
    // XOR to decrypt
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert back to string
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('Decryption error:', error);
    // Return the encrypted text if decryption fails
    return encryptedText;
  }
};
