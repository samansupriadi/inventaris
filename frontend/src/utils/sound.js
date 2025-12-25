// src/utils/sound.js

// Menggunakan AudioContext browser (Pure Code, tidak butuh file mp3)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export const playBeep = (type = "success") => {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === "success") {
    // Suara "Ting!" (High Pitch, Pendek) - Hijau
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz
    oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } else if (type === "error") {
    // Suara "Tet-tot!" (Low Pitch, Kasar) - Merah
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // 200Hz
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  }
};