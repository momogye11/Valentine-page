// PERSONNALISATION
const personName = "Dibaa"; // Change le prénom ici
const gifUrl = "IMG_3151.jpg"; // Image célébration locale

// ============= IMMERSION: Particules flottantes =============
function createFloatingParticles() {
    const container = document.getElementById('floatingParticles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(particle);
    }
}

// Lance les particules au chargement
createFloatingParticles();

// ============= IMMERSION: Vibrations =============
function vibrate(duration = 100) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// ============= IMMERSION: Sons =============
function playClickSound() {
    // Utilise Web Audio API pour un son subtil
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Elements - Intro & Loading
const introScreen = document.getElementById('introScreen');
const introBtn = document.getElementById('introBtn');
const loadingScreen = document.getElementById('loadingScreen');
const loadingCountdown = document.getElementById('loadingCountdown');

// Elements - Explosion & Cinematic
const explosionScreen = document.getElementById('explosionScreen');
const flashWhite = document.getElementById('flashWhite');
const explosionName = document.getElementById('explosionName');
const confettiCanvas = document.getElementById('confettiCanvas');
const cinematicScreen = document.getElementById('cinematicScreen');
const cinematicMessage = document.getElementById('cinematicMessage');
const bubblesScreen = document.getElementById('bubblesScreen');
const bubblesContainer = document.getElementById('bubblesContainer');
const bubblesCounter = document.getElementById('bubblesCounter');

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
                loadingCountdown.style.background = 'none';
                loadingCountdown.style.webkitTextFillColor = '#FF0000';
                loadingCountdown.style.color = '#FF0000';
                loadingCountdown.style.textShadow = '0 0 50px rgba(255, 0, 0, 0.8)';
                loadingCountdown.style.animation = 'countdownMegaPulse 0.5s ease-in-out infinite';
            }

            if (timeLeft === 0) {
                clearInterval(loadingInterval);

                // Cache le loading screen
                loadingScreen.classList.add('hide');

                // Lance l'EXPLOSION WOW!
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    startExplosion();
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

// ============= EXPLOSION WOW =============
function startExplosion() {
    explosionScreen.classList.add('show');

    // Flash blanc aveuglant + VIBRATION + SHAKE pour iOS!
    setTimeout(() => {
        flashWhite.classList.add('active');
        vibrate(200); // Vibration forte à l'explosion (Android)

        // Shake l'écran pour simuler vibration sur iOS
        explosionScreen.style.animation = 'shake 0.5s ease';
    }, 100);

    // "RITA" explose
    setTimeout(() => {
        explosionName.classList.add('explode');
        vibrate([100, 50, 100]); // Pattern de vibration (Android)
    }, 300);

    // Confettis!
    setTimeout(() => {
        createConfetti();
    }, 500);

    // Transition vers les messages cinématiques
    setTimeout(() => {
        explosionScreen.classList.remove('show');
        startCinematicMessages();
    }, 3000);
}

// Confettis animés
function createConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#FF69B4', '#00CED1'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            if (p.y > canvas.height) {
                particles.splice(index, 1);
            }
        });

        if (particles.length > 0) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// ============= MESSAGES CINÉMATIQUES =============
const cinematicMessages = [
    "Rita...",
    "Tu sais ce qui est fou?",
    "Ça fait à peine deux semaines qu'on se connaît...",
    "Mais c'est comme si...",
    "Tu avais toujours été là",
    "Tu as cette énergie...",
    "Cette authenticité...",
    "Qui fait qu'on ne peut pas t'ignorer",
    "Même sans le vouloir...",
    "Tu rends les gens autour de toi meilleurs",
    "Alors je voulais prendre un moment...",
    "Pour que tu saches à quel point...",
    "Tu comptes déjà 💫"
];

let currentMessageIndex = 0;

function startCinematicMessages() {
    cinematicScreen.classList.add('show');
    showNextMessage();
}

function showNextMessage() {
    if (currentMessageIndex >= cinematicMessages.length) {
        // Tous les messages sont affichés, passer aux bulles
        setTimeout(() => {
            cinematicScreen.classList.remove('show');
            startBubblesGame();
        }, 2000);
        return;
    }

    const message = cinematicMessages[currentMessageIndex];
    cinematicMessage.textContent = '';
    cinematicMessage.classList.add('typing');

    // Effet machine à écrire
    let charIndex = 0;
    const typingInterval = setInterval(() => {
        if (charIndex < message.length) {
            cinematicMessage.textContent += message[charIndex];
            charIndex++;
        } else {
            clearInterval(typingInterval);
            currentMessageIndex++;

            // Pause avant le message suivant
            setTimeout(() => {
                cinematicMessage.classList.remove('typing');
                setTimeout(showNextMessage, 300);
            }, 1500);
        }
    }, 50);
}

// ============= MINI-JEU BULLES =============
const bubbleCompliments = [
    { icon: "✨", text: "Tu illumines chaque conversation" },
    { icon: "😊", text: "Ton sourire est contagieux" },
    { icon: "💯", text: "Tu es authentique et vraie" },
    { icon: "💛", text: "Tu as un cœur en or" },
    { icon: "⭐", text: "Ta présence compte vraiment" },
    { icon: "🌟", text: "Tu mérites le meilleur" },
    { icon: "💝", text: "Tu es une personne incroyable" },
    { icon: "🌈", text: "Deux semaines et déjà un impact" }
];

let discoveredCount = 0;

function startBubblesGame() {
    bubblesScreen.classList.add('show');

    // Créer les bulles
    bubbleCompliments.forEach((compliment, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = `
            <span class="bubble-icon">${compliment.icon}</span>
            <span class="bubble-text">${compliment.text}</span>
        `;

        bubble.addEventListener('click', () => {
            if (!bubble.classList.contains('clicked')) {
                bubble.classList.add('clicked');
                discoveredCount++;
                bubblesCounter.textContent = `${discoveredCount}/8 découvertes`;

                // Son + vibration + animation pulse
                playClickSound();
                vibrate(50); // Android

                // Animation pulse pour feedback visuel (iOS/tous)
                bubble.style.animation = 'bubblePulse 0.3s ease';

                // Toutes les bulles découvertes
                if (discoveredCount === 8) {
                    vibrate([100, 50, 100, 50, 100]); // Android

                    // Shake screen pour iOS
                    bubblesScreen.style.animation = 'shake 0.6s ease';

                    setTimeout(showFinalMessage, 2000);
                }
            }
        });

        bubblesContainer.appendChild(bubble);
    });
}

function showFinalMessage() {
    bubblesScreen.classList.remove('show');

    // Message final touchant
    cinematicScreen.classList.add('show');
    cinematicMessage.textContent = '';
    cinematicMessage.classList.add('typing');

    const finalMessage = "Voilà Rita... Parce que tu comptes vraiment pour moi 💝✨";
    let charIndex = 0;

    const typingInterval = setInterval(() => {
        if (charIndex < finalMessage.length) {
            cinematicMessage.textContent += finalMessage[charIndex];
            charIndex++;
        } else {
            clearInterval(typingInterval);

            // Signature en 3 étapes puis fermeture
            setTimeout(() => {
                currentSignatureStep = 0; // Reset le compteur
                showSignature();
            }, 2000);
        }
    }, 50);
}

// Signature en 4 étapes
const signatureSteps = [
    "Tu comptais vraiment pas skip tout ça hein? 😏",
    "Non j'rigole 😂",
    "Merci d'exister Rita. 💝"
];

let currentSignatureStep = 0;

function showSignature() {
    if (currentSignatureStep >= signatureSteps.length) {
        // Tous les messages affichés, montrer la fermeture
        setTimeout(showFinalClosure, 2000); // Réduit à 2 secondes
        return;
    }

    const message = signatureSteps[currentSignatureStep];
    cinematicMessage.textContent = '';

    // Effet machine à écrire
    let charIndex = 0;
    const typingInterval = setInterval(() => {
        if (charIndex < message.length) {
            cinematicMessage.textContent += message[charIndex];
            charIndex++;
        } else {
            clearInterval(typingInterval);
            currentSignatureStep++;

            // Pause avant le prochain message ou la fermeture
            setTimeout(() => {
                showSignature(); // Appelle toujours, la fonction gère la fin
            }, currentSignatureStep === 1 ? 1500 : 2500); // "Non j'rigole" reste moins longtemps
        }
    }, 50);
}

// Fermeture finale avec fade to black
function showFinalClosure() {
    // Fade to black
    cinematicScreen.style.transition = 'background 3s ease';
    cinematicScreen.style.background = 'black';

    // Fade out le message actuel
    cinematicMessage.style.transition = 'opacity 2s ease';
    cinematicMessage.style.opacity = '0';

    // Après 2 secondes, afficher la signature finale
    setTimeout(() => {
        cinematicMessage.textContent = '';
        cinematicMessage.style.opacity = '1';
        cinematicMessage.style.fontSize = '24px';
        cinematicMessage.style.textAlign = 'right';
        cinematicMessage.style.position = 'absolute';
        cinematicMessage.style.bottom = '40px';
        cinematicMessage.style.right = '40px';
        cinematicMessage.style.fontStyle = 'italic';
        cinematicMessage.style.transition = 'opacity 2s ease';

        // Écrire "Mohamed ✨" simple et classe
        const finalSignature = "Mohamed ✨";
        let charIndex = 0;
        const typingInterval = setInterval(() => {
            if (charIndex < finalSignature.length) {
                cinematicMessage.textContent += finalSignature[charIndex];
                charIndex++;
            } else {
                clearInterval(typingInterval);

                // Fade out après 3 secondes
                setTimeout(() => {
                    cinematicMessage.style.opacity = '0';
                }, 3000);
            }
        }, 100);
    }, 2000);
}
