// DOM Element Targets
const slider = document.getElementById('progress');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const trackTitle = document.getElementById('title');
const coverContainer = document.querySelector('.cover');

// Initialize the native Audio Core
const audio = new Audio();

// Local Music Playlist Array Configuration
const mockPlaylist = [
  { name: "Red Red", cover: "assets/cover1.jpe", src: "assets/track1.mp3" },
  { name: "Killin it girl", cover: "assets/cover2.jpe", src: "assets/track2.mp3" },
  { name: "Chanel", cover: "assets/cover3.jpe", src: "assets/track3.mp3" }
];

let currentTrackIndex = 0;
let isPlaying = false;

// Track Loader Logic
function loadTrack(index) {
  const track = mockPlaylist[index];
  trackTitle.textContent = track.name;
  
  // Set the dynamic album artwork background path
  coverContainer.style.backgroundImage = `url('${track.cover}')`;
  
  // Assign the new source audio file path safely
  audio.src = track.src;
  
  // Reset slider visual state back to start position
  slider.value = 0;
  updateSliderBackground();
}

// Playback Mechanics
function togglePlay() {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function playTrack() {
  isPlaying = true;
  playBtn.textContent = "⏸"; // Switch icon to Pause symbol
  
  audio.play().catch(err => {
    // If you don't have track1.mp3 in assets yet, this keeps your buttons and slider working!
    console.warn("Audio file missing or blocked, running visual simulation mode instead.", err);
  });
}

function pauseTrack() {
  isPlaying = false;
  playBtn.textContent = "▶"; // Switch icon to Play symbol
  audio.pause();
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % mockPlaylist.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) playTrack();
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + mockPlaylist.length) % mockPlaylist.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) playTrack();
}

// Automatic Progress Slider Sync Tracker
audio.addEventListener('timeupdate', () => {
  if (audio.duration && isPlaying) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    slider.value = progressPercent;
    updateSliderBackground();
  }
});

// If files are missing, this fallback loop keeps the star moving when you press play
setInterval(() => {
  if (isPlaying && (!audio.duration || audio.paused)) {
    let currentValue = parseInt(slider.value);
    if (currentValue < 100) {
      slider.value = currentValue + 1;
      updateSliderBackground();
    } else {
      nextTrack();
    }
  }
}, 1000);

// Skip forward automatically to the next song when current track ends naturally
audio.addEventListener('ended', nextTrack);

// Allow clicking and dragging the star knob to slide through the track
slider.addEventListener('change', () => {
  if (audio.duration) {
    const newTime = (slider.value / 100) * audio.duration;
    audio.currentTime = newTime;
  }
});

// Slider Track Background Gradient Visual Updates
function updateSliderBackground() {
    const value = slider.value;
    const adjustedValue = (value == 0) ? 0 : (value == 100) ? 100 : parseFloat(value);
    
    slider.style.background = `linear-gradient(to right, var(--bg-progress-fill) 0%, var(--bg-progress-fill) ${adjustedValue}%, var(--bg-progress-empty) ${adjustedValue}%, var(--bg-progress-empty) 100%)`;
}

// Native Event Hookups
slider.addEventListener('input', updateSliderBackground);
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// Initialize application state
loadTrack(currentTrackIndex);
