// PERSONNALISATION
const personName = "Morgane"; // Change le prénom ici
const senderName = "Mohamed"; // Affiché dès l'intro : la page n'est jamais anonyme

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

// Elements - Intro & Loading
const introScreen = document.getElementById('introScreen');
const introBtn = document.getElementById('introBtn');
const loadingScreen = document.getElementById('loadingScreen');
const loadingCountdown = document.getElementById('loadingCountdown');
const skipLoadingBtn = document.getElementById('skipLoadingBtn');

// Elements - Explosion & Cinematic
const explosionScreen = document.getElementById('explosionScreen');
const flashWhite = document.getElementById('flashWhite');
const explosionName = document.getElementById('explosionName');
const confettiCanvas = document.getElementById('confettiCanvas');
const cinematicScreen = document.getElementById('cinematicScreen');
const cinematicMessage = document.getElementById('cinematicMessage');
const skipCinematicBtn = document.getElementById('skipCinematicBtn');

// Elements - Choix final
const choiceScreen = document.getElementById('choiceScreen');
const choiceQuestion = document.getElementById('choiceQuestion');
const choiceButtons = document.getElementById('choiceButtons');
const choiceHint = document.getElementById('choiceHint');
const choiceAnswer = document.getElementById('choiceAnswer');
const choiceSignature = document.getElementById('choiceSignature');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');

// ============= AUDIO =============
let audioStarted = false;
// Nom de fichier volontairement sans espace ni accent : ça casse le chargement une fois hébergé.
const audio = new Audio('music.mp3');
audio.loop = true;
audio.volume = 0.35;
audio.preload = 'auto';

function startAudio() {
    if (audioStarted) return;
    audioStarted = true;

    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        // Si le navigateur refuse la lecture, on laisse simplement la page continuer sans son.
        playPromise.catch(() => {
            audioStarted = false;
        });
    }
}

// ============= ÉTAPE 1: INTRO -> TRANSITION =============
let loadingInterval = null;
let loadingDone = false;

function finishLoading() {
    if (loadingDone) return;
    loadingDone = true;

    clearInterval(loadingInterval);
    loadingScreen.classList.add('hide');

    setTimeout(() => {
        loadingScreen.style.display = 'none';
        startExplosion();
    }, 600);
}

introBtn.addEventListener('click', () => {
    // Affiche la transition IMMÉDIATEMENT (avant de cacher l'intro)
    loadingScreen.classList.add('show');

    setTimeout(() => {
        introScreen.classList.add('hide');
        startAudio();

        let timeLeft = 5;
        loadingCountdown.textContent = timeLeft;

        loadingInterval = setInterval(() => {
            timeLeft--;
            loadingCountdown.textContent = timeLeft;

            if (timeLeft <= 0) {
                finishLoading();
            }
        }, 1000);
    }, 100);
});

skipLoadingBtn.addEventListener('click', finishLoading);

// ============= ÉTAPE 2: EXPLOSION =============
function startExplosion() {
    explosionScreen.classList.add('show');

    setTimeout(() => {
        flashWhite.classList.add('active');
        vibrate(200);
        explosionScreen.style.animation = 'shake 0.5s ease';
    }, 100);

    setTimeout(() => {
        explosionName.classList.add('explode');
        vibrate([100, 50, 100]);
    }, 300);

    setTimeout(() => {
        createConfetti();
    }, 500);

    setTimeout(() => {
        explosionScreen.classList.remove('show');
        startCinematicMessages();
    }, 2800);
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

// ============= ÉTAPE 3: MESSAGES CINÉMATIQUES =============
const cinematicMessages = [
    `${personName}.`,
    "Ça fait un bail, je sais.",
    "Je vais pas te faire un roman, t'inquiète.",
    "On a bossé ensemble, on s'est perdus de vue, c'est la vie.",
    "Mais j'ai repensé à un truc tout bête.",
    "Un resto. Un soir. Toi, moi.",
    "On rattrape le temps, on rigole, et basta."
];

let currentMessageIndex = 0;
let typingInterval = null;
let cinematicDone = false;

function startCinematicMessages() {
    cinematicScreen.classList.add('show');
    showNextMessage();
}

function showNextMessage() {
    if (cinematicDone) return;

    if (currentMessageIndex >= cinematicMessages.length) {
        setTimeout(finishCinematic, 1200);
        return;
    }

    const message = cinematicMessages[currentMessageIndex];
    cinematicMessage.textContent = '';
    cinematicMessage.classList.add('typing');

    // Effet machine à écrire
    let charIndex = 0;
    typingInterval = setInterval(() => {
        if (charIndex < message.length) {
            cinematicMessage.textContent += message[charIndex];
            charIndex++;
        } else {
            clearInterval(typingInterval);
            currentMessageIndex++;

            setTimeout(() => {
                cinematicMessage.classList.remove('typing');
                setTimeout(showNextMessage, 250);
            }, 1300);
        }
    }, 45);
}

function finishCinematic() {
    if (cinematicDone) return;
    cinematicDone = true;

    clearInterval(typingInterval);
    cinematicScreen.classList.remove('show');
    showChoiceScreen();
}

skipCinematicBtn.addEventListener('click', finishCinematic);

// ============= ÉTAPE 4: LE CHOIX (les deux réponses sont vraies) =============
function showChoiceScreen() {
    choiceScreen.classList.add('show');
}

function revealAnswer(text) {
    // Une fois qu'elle a répondu, on ne redemande pas : les boutons disparaissent.
    choiceButtons.classList.add('hide');
    choiceHint.classList.add('hide');
    choiceQuestion.classList.add('answered');

    choiceAnswer.textContent = text;
    choiceAnswer.classList.add('show');

    setTimeout(() => {
        choiceSignature.classList.add('show');
    }, 1400);
}

yesBtn.addEventListener('click', () => {
    vibrate([100, 50, 100]);
    createConfetti();
    revealAnswer("Sérieux ? Parfait. Dis-moi juste le jour qui t'arrange, je m'occupe du reste 🤝");
});

noBtn.addEventListener('click', () => {
    // Un "non" est un vrai non : pas de relance, pas de culpabilisation.
    revealAnswer("Tranquille, c'est noté. Aucun souci et aucune relance, promis. Prends soin de toi 👌");
});
