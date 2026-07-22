// DOM Element Targets
const slider = document.getElementById('progress');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const trackTitle = document.getElementById('title');
const titleTrack = document.getElementById('titleTrack');
const titleText = document.getElementById('titleText');
const titleText2 = document.getElementById('titleText2');
const coverContainer = document.querySelector('.cover');
const playIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>`;
const pauseIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

let isPlaying = false;
let isDragging = false;
let ignorePlayStateUntil = 0;
let lastTitle = '';

document.fonts.ready.then(() => {
  if (lastTitle) setupTitleMarquee(lastTitle); // re-measure now that Pixeboy is actually loaded
});

async function spotifyFetch(endpoint, options = {}) {
  const token = await window.electronAPI.getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/me/player${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    console.warn('Token invalid — clearing and re-authenticating...');
    await window.electronAPI.logout();
    const freshToken = await window.electronAPI.getAccessToken(); // triggers fresh login
    return fetch(`https://api.spotify.com/v1/me/player${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${freshToken}`,
        ...(options.headers || {})
      }
    });
  }

  return res;
}

async function fetchPlaybackState() {
  const res = await spotifyFetch('');
  if (res.status === 204) return null;
  if (!res.ok) {
    console.error('fetchPlaybackState failed:', res.status, await res.text());
    return null;
  }
  return res.json();
}

async function syncUI() {
  if (isDragging) return;

  const state = await fetchPlaybackState();
  if (!state || !state.item) {
    lastTitle = "Nothing playing";
    setupTitleMarquee("Nothing playing");
    return;
  }

  if (state.item.name !== lastTitle) {
    lastTitle = state.item.name;
    setupTitleMarquee(state.item.name);
  }
  coverContainer.style.backgroundImage = `url('${state.item.album.images[0].url}')`;

  const progressPercent = (state.progress_ms / state.item.duration_ms) * 100;
  slider.value = progressPercent;
  updateSliderBackground();

  if (Date.now() > ignorePlayStateUntil) {
  isPlaying = state.is_playing;
  playBtn.innerHTML = isPlaying ? playIcon : pauseIcon;
}
}

function setupTitleMarquee(name) {
  trackTitle.classList.remove('is-scrolling');
  titleTrack.classList.remove('marquee');
  titleTrack.style.animation = 'none';
  titleTrack.style.transform = 'translateX(0)';
  titleText.textContent = name;
  titleText2.textContent = '';
  titleText2.style.display = 'none';

  requestAnimationFrame(() => {
    const overflow = titleText.scrollWidth - trackTitle.clientWidth;

    if (overflow > 0) {
      trackTitle.classList.add('is-scrolling');
      titleText2.textContent = name;
      titleText2.style.display = 'inline-block';

      requestAnimationFrame(() => {
        const singleWidth = titleText.getBoundingClientRect().width;
        const speed = 25;
        const duration = singleWidth / speed;
        titleTrack.style.setProperty('--marquee-duration', `${duration}s`);
        titleTrack.style.animation = '';
        titleTrack.classList.add('marquee');
      });
    }
  });
}

function togglePlay() {
  const wasPlaying = isPlaying;
  isPlaying = !wasPlaying;
  playBtn.innerHTML = isPlaying ? playIcon : pauseIcon;
  ignorePlayStateUntil = Date.now() + 2000; // give Spotify 2s to catch up before trusting polls again

  spotifyFetch(wasPlaying ? '/pause' : '/play', { method: 'PUT' })
    .then(async res => {
      if (!res.ok) {
        console.error('togglePlay failed:', res.status, await res.text());
        isPlaying = wasPlaying;
        playBtn.innerHTML = isPlaying ? playIcon : pauseIcon;
        ignorePlayStateUntil = 0; // request failed, no need to protect a bad guess
      }
    });
}

function nextTrack() {
  spotifyFetch('/next', { method: 'POST' })
    .then(async res => {
      if (!res.ok) console.error('nextTrack failed:', res.status, await res.text());
      syncUI();
    });
}

function prevTrack() {
  spotifyFetch('/previous', { method: 'POST' })
    .then(async res => {
      if (!res.ok) console.error('prevTrack failed:', res.status, await res.text());
      syncUI();
    });
}

function updateSliderBackground() {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value);
    const percent = (val - min) / (max - min);

    const thumbWidth = 18;
    const trackWidth = slider.offsetWidth;
    const fillPx = percent * (trackWidth - thumbWidth) + thumbWidth / 2;

    slider.style.setProperty('--progress', `${fillPx}px`);
}

slider.addEventListener('input', updateSliderBackground);
slider.addEventListener('mousedown', () => isDragging = true);
slider.addEventListener('change', async () => {
  isDragging = false;
  const state = await fetchPlaybackState();
  if (!state || !state.item) return;
  const newPositionMs = Math.floor((slider.value / 100) * state.item.duration_ms);
  await spotifyFetch(`/seek?position_ms=${newPositionMs}`, { method: 'PUT' });
  syncUI();
});

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

setInterval(syncUI, 1000);
syncUI();
