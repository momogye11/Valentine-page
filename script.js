// PERSONNALISATION
const personName = "Rita"; // Change le prénom ici
const gifUrl = "IMG_3151.jpg"; // Image célébration locale

// Elements - Intro & Loading
const introScreen = document.getElementById('introScreen');
const introBtn = document.getElementById('introBtn');
const loadingScreen = document.getElementById('loadingScreen');
const loadingCountdown = document.getElementById('loadingCountdown');

// Elements - Main page
const questionText = document.getElementById('questionText');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const buttonsContainer = document.getElementById('buttonsContainer');
const hintText = document.getElementById('hintText');
const successGif = document.getElementById('successGif');
const gifImage = document.getElementById('gifImage');
const card = document.querySelector('.card');
const countdown = document.getElementById('countdown');
const countdownNumber = document.getElementById('countdownNumber');

// Set initial text and gif
questionText.textContent = `${personName}... j'ai préparé quelque chose pour toi 💫`;
gifImage.src = gifUrl;

// Gestion de l'intro et du loading screen
introBtn.addEventListener('click', () => {
    // Affiche le loading screen IMMÉDIATEMENT (avant de cacher l'intro)
    loadingScreen.classList.add('show');

    // Cache l'intro PAR-DESSUS
    setTimeout(() => {
        introScreen.classList.add('hide');

        // Démarre la musique AUTOMATIQUEMENT
        startAudio();

        // Compte à rebours de 24 secondes BLOQUÉ
        let timeLeft = 24;
        loadingCountdown.textContent = timeLeft;

        const loadingInterval = setInterval(() => {
            timeLeft--;
            loadingCountdown.textContent = timeLeft;

            // Les 5 dernières secondes en rouge intense
            if (timeLeft <= 5) {
                loadingCountdown.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FF0000 100%)';
                loadingCountdown.style.animation = 'countdownMegaPulse 0.5s ease-in-out infinite';
            }

            if (timeLeft === 0) {
                clearInterval(loadingInterval);

                // Cache le loading screen
                loadingScreen.classList.add('hide');

                // Affiche la page principale après 800ms
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    introScreen.style.display = 'none';

                    // Révèle le container de la page principale
                    document.querySelector('.container').classList.add('show');
                }, 800);
            }
        }, 1000);
    }, 100);
});

// Empêche de skip avec ESC ou autres touches
document.addEventListener('keydown', (e) => {
    if (loadingScreen.classList.contains('show')) {
        e.preventDefault();
        return false;
    }
});

// Audio Player (HTML5 - compatible mobile)
let audioStarted = false;
const soundBtn = document.getElementById('sound-btn');

// Crée l'élément audio
const audio = new Audio('Guy2Bezbar - Je pense à toi (Paroles).mp3');
audio.loop = true;
audio.volume = 0.5;

// Précharge l'audio
audio.preload = 'auto';

function startAudio() {
    if (audioStarted) return;
    audioStarted = true;

    console.log('Démarrage de la musique...');

    // Démarre au début de la chanson
    audio.currentTime = 0;

    // Lance la lecture
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('✅ Musique démarrée avec succès');

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

// Click event for "No" button (affiche emoji impatient)
noBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Messages mignons quand elle essaie de fuir
    const cuteMessages = [
        'Allez... juste un petit regard ? 🥺',
        'Tu vas adorer, promis ! 💕',
        'Fais-moi confiance... 🌟',
        'Bon d\'accord, prends ton temps 💫'
    ];

    const randomMessage = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
    questionText.textContent = randomMessage;
    questionText.style.fontSize = '28px';

    // Cache les boutons et le hint
    buttonsContainer.classList.add('hide');
    hintText.classList.add('hide');
});

// Click event for "Yes" button
yesBtn.addEventListener('click', () => {
    isNoBtnActive = false;

    // Hide buttons and hint
    buttonsContainer.classList.add('hide');
    hintText.classList.add('hide');

    // Change text - Message plus touchant et personnel
    questionText.textContent = `Pour toi ${personName} 💝`;

    // Démarre la musique automatiquement
    if (!audioStarted) {
        startAudio();
    }

    // Affiche le compte à rebours
    countdown.classList.add('show');

    // Compte à rebours de 24 à 0
    let timeLeft = 24;
    countdownNumber.textContent = timeLeft;

    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdownNumber.textContent = timeLeft;

        // Animation spéciale pour les dernières secondes
        if (timeLeft <= 5) {
            countdownNumber.style.color = '#FF6B6B';
            countdownNumber.style.animation = 'countdownPulse 0.5s ease-in-out infinite';
        }

        if (timeLeft === 0) {
            clearInterval(countdownInterval);

            // Cache le compte à rebours
            countdown.style.opacity = '0';
            countdown.style.transform = 'scale(0.8)';

            setTimeout(() => {
                countdown.classList.remove('show');

                // Ajoute un message touchant
                const subtitle = document.createElement('p');
                subtitle.style.fontSize = '18px';
                subtitle.style.color = '#764ba2';
                subtitle.style.marginTop = '10px';
                subtitle.style.fontWeight = '400';
                subtitle.style.opacity = '0';
                subtitle.textContent = 'Parce que tu comptes beaucoup pour moi ✨';
                questionText.parentElement.insertBefore(subtitle, countdown);

                // Anime l'apparition du sous-titre
                setTimeout(() => {
                    subtitle.style.transition = 'all 0.8s ease';
                    subtitle.style.opacity = '1';
                }, 100);

                // Affiche l'image après le message
                setTimeout(() => {
                    successGif.classList.add('show');
                }, 800);
            }, 500);
        }
    }, 1000);
});
