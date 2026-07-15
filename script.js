// DOM Element Targets
const slider = document.getElementById('progress');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const trackTitle = document.getElementById('title');
const coverContainer = document.querySelector('.cover');
const playIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>`;
const pauseIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

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
  playBtn.innerHTML = playIcon;
  audio.play().catch(err => {
    console.warn("Audio file missing or blocked, running visual simulation mode instead.", err);
  });
}

function pauseTrack() {
  isPlaying = false;
  playBtn.innerHTML = pauseIcon;
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

function updateSliderBackground() {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value);
    const percent = (val - min) / (max - min);

    const thumbWidth = 18; // must match .star-slider::-webkit-slider-thumb width
    const trackWidth = slider.offsetWidth;
    const fillPx = percent * (trackWidth - thumbWidth) + thumbWidth / 2;

    slider.style.setProperty('--progress', `${fillPx}px`);
}

// Native Event Hookups
slider.addEventListener('input', updateSliderBackground);
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// Initialize application state
loadTrack(currentTrackIndex);
