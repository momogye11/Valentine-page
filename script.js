// PERSONNALISATION
const personName = "Anyssa"; // Change le prénom ici
const gifUrl = "IMG_3151.jpg"; // Image célébration locale

// Elements
const questionText = document.getElementById('questionText');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const buttonsContainer = document.getElementById('buttonsContainer');
const hintText = document.getElementById('hintText');
const successGif = document.getElementById('successGif');
const gifImage = document.getElementById('gifImage');
const card = document.querySelector('.card');

// Set initial text and gif
questionText.textContent = `${personName} veux-tu être ma Valentine ?`;
gifImage.src = gifUrl;

// Audio Player (HTML5 - compatible mobile)
let audioStarted = false;
const soundBtn = document.getElementById('sound-btn');

// Crée l'élément audio
const audio = new Audio('ed-sheeran-perfect-official-music-video.mp3');
audio.loop = true;
audio.volume = 0.5;

// Précharge l'audio
audio.preload = 'auto';

function startAudio() {
    if (audioStarted) return;
    audioStarted = true;

    console.log('Démarrage de la musique...');

    // Démarre à 20 secondes pour sauter l'intro
    audio.currentTime = 20;

    // Lance la lecture
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('✅ Musique démarrée avec succès à 20 secondes');

                // Cache le bouton avec animation
                if (soundBtn) {
                    soundBtn.style.opacity = '0';
                    setTimeout(() => {
                        soundBtn.style.display = 'none';
                    }, 300);
                }
            })
            .catch((error) => {
                console.error('❌ Erreur de lecture audio:', error);
                audioStarted = false; // Permet de réessayer
                alert('Impossible de lire la musique. Réessaye !');
            });
    }
}

// Gestion du bouton son
if (soundBtn) {
    // Click pour desktop
    soundBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Bouton cliqué');
        startAudio();
    });

    // Touch pour mobile (plus fiable)
    soundBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📱 Bouton touché');
        startAudio();
    }, { passive: false });
}

// Button "No" fleeing behavior
let isNoBtnActive = true;

function moveNoButton(mouseX, mouseY) {
    if (!isNoBtnActive) return;

    const btnRect = noBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const distance = Math.sqrt(
        Math.pow(mouseX - btnCenterX, 2) +
        Math.pow(mouseY - btnCenterY, 2)
    );

    const threshold = 120; // Distance seuil en pixels - détection normale

    if (distance < threshold) {
        // Déplacer le bouton dans .card pour qu'il soit relatif à la carte entière
        if (noBtn.parentElement !== card) {
            noBtn.classList.add('fleeing');
            card.appendChild(noBtn);
        }

        // Calcule une direction opposée à la souris
        const directionX = btnCenterX - mouseX;
        const directionY = btnCenterY - mouseY;
        const moveDistance = 100; // Distance de déplacement à chaque fuite

        // Normalise la direction
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedX = directionX / length;
        const normalizedY = directionY / length;

        // Calcule position relative à la carte
        const cardRect = card.getBoundingClientRect();
        const currentX = btnRect.left - cardRect.left;
        const currentY = btnRect.top - cardRect.top;

        // Nouvelle position en s'éloignant de la souris
        let newX = currentX + (normalizedX * moveDistance);
        let newY = currentY + (normalizedY * moveDistance);

        // TRES grande marge de sécurité (presque 1/4 du cadre)
        const margin = 120;

        // Si trop proche des bords, téléporte au centre ou position sûre
        const safeZoneMinX = margin;
        const safeZoneMaxX = cardRect.width - btnRect.width - margin;
        const safeZoneMinY = margin;
        const safeZoneMaxY = cardRect.height - btnRect.height - margin;

        // Vérifie si la nouvelle position est dans la zone de danger
        if (newX < safeZoneMinX || newX > safeZoneMaxX || newY < safeZoneMinY || newY > safeZoneMaxY) {
            // Téléporte vers une position aléatoire au centre de la carte
            const centerZoneWidth = cardRect.width * 0.5;
            const centerZoneHeight = cardRect.height * 0.5;
            newX = (cardRect.width - btnRect.width - centerZoneWidth) / 2 + Math.random() * (centerZoneWidth - btnRect.width);
            newY = (cardRect.height - btnRect.height - centerZoneHeight) / 2 + Math.random() * (centerZoneHeight - btnRect.height);
        }

        noBtn.style.left = `${newX}px`;
        noBtn.style.top = `${newY}px`;
    }
}

// Mouse move event for desktop
document.addEventListener('mousemove', (e) => {
    moveNoButton(e.clientX, e.clientY);
});

// Touch event for mobile
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isNoBtnActive) return;

    // Déplacer le bouton dans .card pour qu'il soit relatif à la carte entière
    if (noBtn.parentElement !== card) {
        noBtn.classList.add('fleeing');
        card.appendChild(noBtn);
    }

    const cardRect = card.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    // TRES grande marge pour éviter les bords (120px minimum)
    const margin = 120;

    // Zone centrale sûre (50% du cadre au centre)
    const centerZoneWidth = cardRect.width * 0.5;
    const centerZoneHeight = cardRect.height * 0.5;
    const centerStartX = (cardRect.width - centerZoneWidth) / 2;
    const centerStartY = (cardRect.height - centerZoneHeight) / 2;

    // Déplace dans la zone centrale uniquement
    const newX = centerStartX + Math.random() * (centerZoneWidth - btnRect.width);
    const newY = centerStartY + Math.random() * (centerZoneHeight - btnRect.height);

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
});

// Click event for "No" button (affiche emoji triste)
noBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Affiche l'emoji triste
    questionText.textContent = '😢';
    questionText.style.fontSize = '120px';

    // Cache les boutons et le hint
    buttonsContainer.classList.add('hide');
    hintText.classList.add('hide');
});

// Click event for "Yes" button
yesBtn.addEventListener('click', () => {
    isNoBtnActive = false;

    // Change text
    questionText.textContent = 'OUAIS ! 🎉';

    // Hide buttons and hint
    buttonsContainer.classList.add('hide');
    hintText.classList.add('hide');

    // Show gif
    successGif.classList.add('show');
});
