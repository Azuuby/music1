// Song list with working demo audio files
const songs = [
  {
    title: "Heaven sent",
    artist: "Tevom",
    cover: "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228",
    file: "assets/mp3/heaven sent.mp3",
    bgVideo: "assets/video/Vid2.mp4"
  },
  {
    title: "Save Your Tears",
    artist: "The Weeknd",
    cover: "https://i.scdn.co/image/ab67616d00001e0295c5d9a42b687a9e1d5dd14b",
    file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4"
  },
  {
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    cover: "https://i.scdn.co/image/ab67616d00001e0283b9b0b9c7b5a0a1a0b8e0e0",
    file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    bgVideo: "https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-1187-large.mp4"
  }
];

// DOM Elements
const player = document.getElementById('player');
const audio = document.getElementById('audio');
const bgVideo = document.getElementById('bgVideo');
const coverImg = document.getElementById('coverImg');
const songTitle = document.getElementById('songTitle');
const artist = document.getElementById('artist');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progressContainer');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeControl = document.getElementById('volume');
const visualizer = document.getElementById('visualizer');
const minimizeBtn = document.getElementById('minimizeBtn');
const restoreBtn = document.getElementById('restoreBtn');

// State
let currentSongIndex = 0;
let isPlaying = false;
let isDragging = false;
let offsetX, offsetY;
let minimized = false;
let playerPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let audioContext, analyser, dataArray;
let bars = [];

// Initialize visualizer bars
function initVisualizer() {
  visualizer.innerHTML = '';
  bars = [];
  
  for (let i = 0; i < 20; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = '2px';
    visualizer.appendChild(bar);
    bars.push(bar);
  }
}

// Initialize audio context
function initAudioContext() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;
  
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Update visualizer
function updateVisualizer() {
  analyser.getByteFrequencyData(dataArray);
  
  for (let i = 0; i < bars.length; i++) {
    const value = dataArray[i % dataArray.length] / 255;
    bars[i].style.height = `${value * 50 + 2}px`;
  }
  
  if (isPlaying) {
    requestAnimationFrame(updateVisualizer);
  }
}

// Load song
function loadSong(songIndex) {
  const song = songs[songIndex];
  
  songTitle.textContent = song.title;
  artist.textContent = song.artist;
  coverImg.src = song.cover;
  audio.src = song.file;
  bgVideo.src = song.bgVideo;
  
  audio.onloadedmetadata = function() {
    durationEl.textContent = formatTime(audio.duration);
  };
  
  if (!audioContext) {
    initAudioContext();
    initVisualizer();
  }
}

// Play song
function playSong() {
  isPlaying = true;
  player.classList.add('playing');
  playBtn.textContent = '⏸';
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  audio.play().catch(e => {
    console.error("Play error:", e);
    audio.pause();
    audio.currentTime = 0;
    setTimeout(() => audio.play(), 100);
  });
  
  bgVideo.play().catch(e => console.error("Video play error:", e));
  updateVisualizer();
}

// Pause song
function pauseSong() {
  isPlaying = false;
  player.classList.remove('playing');
  playBtn.textContent = '▶';
  audio.pause();
  bgVideo.pause();
}

// Previous song
function prevSong() {
  currentSongIndex--;
  if (currentSongIndex < 0) currentSongIndex = songs.length - 1;
  loadSong(currentSongIndex);
  if (isPlaying) playSong();
}

// Next song
function nextSong() {
  currentSongIndex++;
  if (currentSongIndex > songs.length - 1) currentSongIndex = 0;
  loadSong(currentSongIndex);
  if (isPlaying) playSong();
}

// Update progress
function updateProgress(e) {
  const { duration, currentTime } = e.srcElement;
  progress.style.width = `${(currentTime / duration) * 100}%`;
  currentTimeEl.textContent = formatTime(currentTime);
}

// Set progress
function setProgress(e) {
  const width = this.clientWidth;
  audio.currentTime = (e.offsetX / width) * audio.duration;
}

// Format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Toggle minimize/restore player
function toggleMinimize() {
  minimized = !minimized;
  
  if (minimized) {
    // Save current position before minimizing
    const rect = player.getBoundingClientRect();
    playerPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    player.classList.add('minimized');
    
    // Position minimized player at the bottom right
    player.style.left = 'calc(100% - 90px)';
    player.style.top = 'calc(100% - 90px)';
    player.style.transform = 'none';
  } else {
    player.classList.remove('minimized');
    
    // Restore to original position
    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;
    player.style.transform = 'translate(-50%, -50%)';
  }
}

// Make player draggable
function makeDraggable(element) {
  element.addEventListener('mousedown', (e) => {
    if (e.target.closest('.btn, input') || minimized) return;
    
    isDragging = true;
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    element.style.cursor = 'grabbing';
    element.style.transition = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || minimized) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.transform = 'none';
    
    // Update player position
    playerPosition = {
      x: x + element.offsetWidth / 2,
      y: y + element.offsetHeight / 2
    };
  });
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    element.style.cursor = minimized ? 'default' : 'grab';
    element.style.transition = 'all 0.3s ease';
  });
}

// Event listeners
playBtn.addEventListener('click', () => {
  if (!audioContext) initAudioContext();
  isPlaying ? pauseSong() : playSong();
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', nextSong);

progressContainer.addEventListener('click', setProgress);

volumeControl.addEventListener('input', (e) => {
  audio.volume = e.target.value;
});

minimizeBtn.addEventListener('click', toggleMinimize);
restoreBtn.addEventListener('click', toggleMinimize);

// Initialize
loadSong(currentSongIndex);
makeDraggable(player);
initVisualizer();

// Handle window resize
window.addEventListener('resize', () => {
  if (!isDragging && !minimized) {
    player.style.left = '50%';
    player.style.top = '50%';
    player.style.transform = 'translate(-50%, -50%)';
    playerPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }
});