/**
 * SubD_Zero Portfolio - Global Scripts
 * Handling Video Modals, Audio Visualization, and Scroll Glow Effects
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 0. MOBILE HAMBURGER MENU
    // ---------------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu    = document.getElementById('mobile-menu');
    const mobileClose   = document.getElementById('mobile-menu-close');

    const openMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
        mobileMenu.classList.add('translate-x-0', 'opacity-100');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
        mobileMenu.classList.remove('translate-x-0', 'opacity-100');
        document.body.style.overflow = '';
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobileMenu);

    // Close menu when clicking a nav link inside it
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeMobileMenu);
        });
    }

    // ---------------------------------------------------------
    // 1. GLOBAL ENVIRONMENTAL LIGHT CONTROL (Scroll Glow)
    // ---------------------------------------------------------
    const topGlow = document.querySelector('.nav-glow-bar');
    const bottomGlow = document.querySelector('.bottom-ambient-glow');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const dynamicLine = document.getElementById('dynamic-line');

    const handleScrollGlow = () => {
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

        // Top and Bottom Ambient Glow
        if (topGlow) topGlow.style.opacity = Math.max(0, 1 - scrollPos / 100);
        if (bottomGlow) bottomGlow.style.opacity = Math.min(1, scrollPos / 300);

        // Scroll Indicator (Specific to Index but safe if null)
        if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(0, 1 - scrollPos / 250);
            scrollIndicator.style.transform = `translate(-50%, ${scrollPos * 0.1}px)`;
        }

        if (dynamicLine) {
            const newHeight = 64 + (scrollPos * 0.8);
            dynamicLine.style.height = `${newHeight}px`;
            if (scrollPos > 50) dynamicLine.classList.remove('animate-pulse');
            else dynamicLine.classList.add('animate-pulse');
        }
    };

    window.addEventListener('scroll', handleScrollGlow);
    handleScrollGlow(); // Initial check

    // ---------------------------------------------------------
    // 2. VIDEO MODAL & AUDIO VISUALIZER
    // ---------------------------------------------------------
    const videoModal = document.getElementById('video-modal');
    const modalContainer = document.getElementById('modal-container');
    const modalVideo = document.getElementById('modal-video');
    const closeBtn = document.getElementById('close-modal');
    const modalBg = document.getElementById('modal-bg');
    const openBtns = document.querySelectorAll('.open-video-btn');
    const muteBtn = document.getElementById('mute-btn');
    const muteIcon = document.getElementById('mute-icon');

    let audioContext;
    let analyser;
    let dataArray;
    let source;
    let animationId;

    const audioCanvas = document.getElementById('audio-visualizer');
    let ctx;
    if (audioCanvas) {
        ctx = audioCanvas.getContext('2d');
    }

    const setupCanvas = () => {
        if (!audioCanvas) return;
        audioCanvas.width = audioCanvas.parentElement.offsetWidth;
        audioCanvas.height = audioCanvas.parentElement.offsetHeight;
    };

    const initAudioAnalyzer = () => {
        if (audioContext || !modalVideo) return;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        
        source = audioContext.createMediaElementSource(modalVideo);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        setupCanvas();
    };

    const draw = () => {
        if (!analyser || !ctx || !audioCanvas || !modalVideo) return;
        
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        // Bass calculation for Neon Pulse
        let bassSum = 0;
        const bassRange = 10;
        for (let i = 0; i < bassRange; i++) {
            bassSum += dataArray[i];
        }
        const bassAvg = bassSum / bassRange;
        const bassIntensity = bassAvg / 255;

        // Dynamic Neon Glow on Video
        const glowBlur = 20 + (bassIntensity * 100); 
        const glowSpread = 2 + (bassIntensity * 30);
        const glowOpacity = 0.3 + (bassIntensity * 0.7);
        
        modalVideo.style.boxShadow = `0 0 ${glowBlur}px ${glowSpread}px rgba(0, 255, 194, ${glowOpacity})`;
        modalVideo.style.borderColor = `rgba(170, 255, 220, ${0.5 + bassIntensity})`;

        // Canvas Waveform Drawing
        ctx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#aaffdc";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00FFC2";
        ctx.lineJoin = "round";

        const videoRect = modalVideo.getBoundingClientRect();
        const canvasRect = audioCanvas.getBoundingClientRect();
        
        const startX = (canvasRect.width - videoRect.width) / 2;
        const endX = startX + videoRect.width;
        const topY = (canvasRect.height - videoRect.height) / 2;
        const bottomY = topY + videoRect.height;

        const dataLength = analyser.frequencyBinCount / 1.5; 
        const sliceWidth = videoRect.width / dataLength;

        // Top Wave
        ctx.beginPath();
        let x = startX;
        for (let i = 0; i < dataLength; i++) {
            const v = dataArray[i] / 255.0;
            const spikeHeight = v * 60;
            const y = topY - spikeHeight; 
            if (i === 0) ctx.moveTo(x, topY);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.lineTo(endX, topY);
        ctx.stroke();

        // Bottom Wave
        ctx.beginPath();
        x = startX;
        for (let i = 0; i < dataLength; i++) {
            const v = dataArray[i] / 255.0;
            const spikeHeight = v * 60; 
            const y = bottomY + spikeHeight;
            if (i === 0) ctx.moveTo(x, bottomY);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.lineTo(endX, bottomY);
        ctx.stroke();
    };

    const openModal = (videoSrc) => {
        if (!videoModal || !modalVideo) return;

        modalVideo.src = videoSrc;
        modalVideo.load();
        // Always start muted so browser autoplay policies are satisfied
        modalVideo.muted = true;
        if (muteIcon) muteIcon.textContent = 'volume_off';
        if (muteBtn) muteBtn.setAttribute('aria-label', 'Attiva audio');

        videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            videoModal.classList.add('opacity-100');
            modalContainer.classList.remove('scale-90', 'blur-md');
            modalContainer.classList.add('scale-100', 'blur-0');
            
            initAudioAnalyzer();
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            modalVideo.play().catch(e => console.error("Playback error:", e));
            draw(); 
        }, 10);
    };

    const closeModal = () => {
        if (!videoModal) return;

        videoModal.classList.remove('opacity-100');
        if (modalContainer) {
            modalContainer.classList.add('scale-90', 'blur-md');
        }
        
        setTimeout(() => {
            videoModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            if (modalVideo) {
                modalVideo.pause();
                modalVideo.currentTime = 0;
            }
            cancelAnimationFrame(animationId);
        }, 500);
    };

    // Event Listeners
    openBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const videoSrc = this.getAttribute('data-video-src');
            if (videoSrc) openModal(videoSrc);
        });
    });

    closeBtn?.addEventListener('click', closeModal);
    modalBg?.addEventListener('click', closeModal);
    window.addEventListener('resize', setupCanvas);

    // Mute / Unmute toggle
    if (muteBtn && modalVideo) {
        muteBtn.addEventListener('click', () => {
            modalVideo.muted = !modalVideo.muted;
            const isMuted = modalVideo.muted;
            if (muteIcon) muteIcon.textContent = isMuted ? 'volume_off' : 'volume_up';
            const muteLabel = document.getElementById('mute-label');
            if (muteLabel) muteLabel.textContent = isMuted ? 'Muto' : 'Suono';
            muteBtn.setAttribute('aria-label', isMuted ? 'Attiva audio' : 'Disattiva audio');
            // Resume AudioContext on first unmute (browser policy)
            if (!isMuted && audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        });
    }
});
