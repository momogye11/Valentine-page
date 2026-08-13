const CONFIG = {
    recipient: "Morgane",
    sender: "Mohamed",
    dates: "du 14 au 16 août 2026",
    destination: "Lamantin Beach",
    musicFile: "/media/music",
    callNumber: "+221782957169",
    messageNumber: "0695052125"
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.getElementById("intro");
const startButton = document.getElementById("startButton");
const conversation = document.getElementById("conversation");
const conversationScroll = document.getElementById("conversationScroll");
const messages = document.getElementById("messages");
const messageTemplate = document.getElementById("messageTemplate");
const revealTemplate = document.getElementById("revealTemplate");
const typingIndicator = document.getElementById("typingIndicator");
const presenceText = document.getElementById("presenceText");
const replyArea = document.getElementById("replyArea");
const replyPrompt = document.getElementById("replyPrompt");
const replyOptions = document.getElementById("replyOptions");
const confettiCanvas = document.getElementById("confettiCanvas");
const introCanvas = document.getElementById("introCanvas");

const audio = new Audio(CONFIG.musicFile);
audio.loop = true;
audio.volume = 0;
audio.preload = "auto";

let interactionLocked = false;
let finalChoice = null;
let detailsIntroduced = false;
let declineRetryOffered = false;
const viewedDetailTopics = new Set();
let activeConfettiFrame = null;
let introAnimationFrame = null;
let introResizeHandler = null;
let introVisibilityHandler = null;
let musicFadeFrame = null;
let musicStartPromise = null;

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

function scrollToLatest() {
    requestAnimationFrame(() => {
        conversationScroll.scrollTo({
            top: conversationScroll.scrollHeight,
            behavior: prefersReducedMotion ? "auto" : "smooth"
        });
    });
}

function vibrate(pattern = 35) {
    if (!prefersReducedMotion && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function trackEvent(type, details = {}) {
    try {
        window.valentineAnalytics?.track(type, details);
    } catch {
        // Response tracking must never interrupt Morgane's conversation.
    }
}

function trackImmediate(type, details = {}) {
    try {
        return window.valentineAnalytics?.trackImmediate(type, details) ?? Promise.resolve();
    } catch {
        return Promise.resolve();
    }
}

function startAnalytics() {
    try {
        void window.valentineAnalytics?.start()?.catch(() => {});
    } catch {
        // The invitation remains usable even if tracking is unavailable.
    }
}

function initializeIntroAtmosphere() {
    if (prefersReducedMotion || !introCanvas) return;

    const context = introCanvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let reflections = [];
    let previousFrame = 0;

    function resize() {
        const previousWidth = width;
        const previousHeight = height;
        width = window.innerWidth;
        height = window.innerHeight;
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        introCanvas.width = Math.round(width * pixelRatio);
        introCanvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (reflections.length && Math.abs(previousWidth - width) < 8) {
            const heightRatio = previousHeight ? height / previousHeight : 1;
            reflections.forEach((reflection) => {
                reflection.y *= heightRatio;
            });
            return;
        }
        reflections = Array.from({ length: width < 480 ? 24 : 32 }, (_, index) => ({
            x: width * (0.08 + Math.random() * 0.84),
            y: height * (0.45 + Math.random() * 0.46),
            length: 8 + Math.random() * 34,
            phase: Math.random() * Math.PI * 2,
            speed: 0.35 + Math.random() * 0.55,
            alpha: 0.08 + Math.random() * 0.22,
            warm: index % 4 === 0
        }));
    }

    function draw(timestamp) {
        introAnimationFrame = requestAnimationFrame(draw);
        if (timestamp - previousFrame < 32) return;
        previousFrame = timestamp;
        context.clearRect(0, 0, width, height);

        const time = timestamp / 1000;
        reflections.forEach((reflection) => {
            const shimmer = 0.45 + Math.sin(time * reflection.speed * 4 + reflection.phase) * 0.45;
            const drift = Math.sin(time * reflection.speed + reflection.phase) * 11;
            context.beginPath();
            context.moveTo(reflection.x + drift - reflection.length / 2, reflection.y);
            context.lineTo(reflection.x + drift + reflection.length / 2, reflection.y);
            context.strokeStyle = reflection.warm
                ? `rgba(232, 213, 183, ${reflection.alpha * shimmer})`
                : `rgba(133, 194, 179, ${reflection.alpha * shimmer})`;
            context.lineWidth = reflection.warm ? 1.2 : 0.8;
            context.stroke();
        });
    }

    introResizeHandler = resize;
    introVisibilityHandler = () => {
        if (document.hidden && introAnimationFrame !== null) {
            cancelAnimationFrame(introAnimationFrame);
            introAnimationFrame = null;
        } else if (!document.hidden && !intro.hidden && introAnimationFrame === null) {
            previousFrame = 0;
            introAnimationFrame = requestAnimationFrame(draw);
        }
    };
    window.addEventListener("resize", introResizeHandler, { passive: true });
    document.addEventListener("visibilitychange", introVisibilityHandler);
    resize();
    introAnimationFrame = requestAnimationFrame(draw);
}

function stopIntroAtmosphere() {
    if (introAnimationFrame !== null) {
        cancelAnimationFrame(introAnimationFrame);
        introAnimationFrame = null;
    }
    if (introResizeHandler) {
        window.removeEventListener("resize", introResizeHandler);
        introResizeHandler = null;
    }
    if (introVisibilityHandler) {
        document.removeEventListener("visibilitychange", introVisibilityHandler);
        introVisibilityHandler = null;
    }
    if (introCanvas) introCanvas.hidden = true;
}

function launchConfetti(options = {}) {
    if (prefersReducedMotion || !confettiCanvas) return;

    const context = confettiCanvas.getContext("2d");
    if (!context) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    confettiCanvas.width = width * pixelRatio;
    confettiCanvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const colors = ["#f4dfba", "#df8064", "#ffffff", "#7fc4b3", "#f0b84c", "#e89ab0"];
    const amount = options.amount || 150;
    if (activeConfettiFrame !== null) {
        cancelAnimationFrame(activeConfettiFrame);
    }

    const particles = Array.from({ length: amount }, () => ({
        x: width * (0.1 + Math.random() * 0.8),
        y: -20 - Math.random() * height * 0.32,
        vx: (Math.random() - 0.5) * 270,
        vy: 150 + Math.random() * 280,
        gravity: 130 + Math.random() * 150,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 10,
        wave: Math.random() * Math.PI * 2
    }));

    const startedAt = performance.now();
    const duration = options.duration || 3200;
    let previousFrame = startedAt;

    function draw(now) {
        const delta = Math.min((now - previousFrame) / 1000, 0.034);
        previousFrame = now;
        context.clearRect(0, 0, width, height);

        particles.forEach((particle) => {
            particle.vy += particle.gravity * delta;
            particle.vx *= Math.pow(0.62, delta);
            particle.x += (particle.vx + Math.sin(particle.wave) * 28) * delta;
            particle.y += particle.vy * delta;
            particle.wave += 4.2 * delta;
            particle.rotation += particle.spin * delta;

            context.save();
            context.translate(particle.x, particle.y);
            context.rotate(particle.rotation);
            context.fillStyle = particle.color;
            context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
            context.restore();
        });

        if (now - startedAt < duration) {
            activeConfettiFrame = requestAnimationFrame(draw);
        } else {
            context.clearRect(0, 0, width, height);
            activeConfettiFrame = null;
        }
    }

    activeConfettiFrame = requestAnimationFrame(draw);
}

function fadeMusicIn() {
    if (musicFadeFrame !== null) cancelAnimationFrame(musicFadeFrame);
    const targetVolume = 0.32;
    const initialVolume = audio.volume;
    const startedAt = performance.now();

    function fade(timestamp) {
        const progress = Math.min(Math.max((timestamp - startedAt) / 1200, 0), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        audio.volume = Math.min(Math.max(initialVolume + (targetVolume - initialVolume) * eased, 0), 1);
        if (progress < 1) {
            musicFadeFrame = requestAnimationFrame(fade);
        } else {
            musicFadeFrame = null;
        }
    }

    musicFadeFrame = requestAnimationFrame(fade);
}

function startMusic() {
    if (!audio.paused) {
        if (audio.volume < 0.31) fadeMusicIn();
        return Promise.resolve();
    }
    if (musicStartPromise) return musicStartPromise;

    musicStartPromise = audio.play()
        .then(fadeMusicIn)
        .catch(() => {
            // La plupart des navigateurs bloquent le son avant le premier geste.
            // Le clic d’entrée ci-dessous relance alors la lecture immédiatement.
        })
        .finally(() => {
            musicStartPromise = null;
        });
    return musicStartPromise;
}

// Tente l’autoplay dès l’ouverture, puis garantit le démarrage au premier geste
// si le navigateur exige une interaction utilisateur.
startMusic();
document.addEventListener("pointerdown", startMusic, { once: true, capture: true });
document.addEventListener("keydown", startMusic, { once: true, capture: true });
initializeIntroAtmosphere();

function setLocked(locked) {
    interactionLocked = locked;
    replyArea.classList.toggle("is-waiting", locked);
    Array.from(replyOptions.children).forEach((button) => {
        button.disabled = locked;
    });
}

async function showTyping(duration = 720) {
    presenceText.textContent = "écrit…";
    typingIndicator.hidden = false;
    scrollToLatest();
    await wait(prefersReducedMotion ? 80 : duration);
    typingIndicator.hidden = true;
    presenceText.textContent = "en ligne";
}

function addMessage(author, text, options = {}) {
    const fragment = messageTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".message");
    const authorLabel = fragment.querySelector(".message__author");
    const bubble = fragment.querySelector(".message__bubble");

    const isRecipient = author === "morgane";
    article.classList.toggle("message--morgane", isRecipient);
    article.classList.toggle("message--emphasis", Boolean(options.emphasis));
    authorLabel.textContent = isRecipient ? CONFIG.recipient : CONFIG.sender;
    bubble.textContent = text;
    messages.appendChild(fragment);
    scrollToLatest();
}

async function say(text, options = {}) {
    setLocked(true);
    await showTyping(options.delay ?? Math.min(1150, 480 + text.length * 12));
    addMessage("mohamed", text, options);
    await wait(prefersReducedMotion ? 30 : 180);
    setLocked(false);
}

function clearReplies() {
    replyOptions.replaceChildren();
}

function ask(stepId, prompt, choices) {
    clearReplies();
    replyPrompt.textContent = prompt;
    replyOptions.classList.toggle("reply-options--grid", choices.length >= 4);

    choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `reply-button${choice.primary ? " reply-button--primary" : ""}`;
        button.textContent = choice.label;
        button.addEventListener("click", async () => {
            if (interactionLocked) return;
            setLocked(true);
            trackEvent("choice_selected", {
                stepId,
                choiceId: choice.id,
                choiceLabel: choice.label
            });
            addMessage("morgane", choice.label);
            clearReplies();
            vibrate(index === 0 ? 45 : 25);
            await wait(prefersReducedMotion ? 40 : 260);
            await choice.action();
        }, { once: true });
        replyOptions.appendChild(button);
    });

    setLocked(false);
    scrollToLatest();
    requestAnimationFrame(() => replyOptions.querySelector("button")?.focus({ preventScroll: true }));
}

async function startConversation() {
    startMusic();
    startAnalytics();
    startButton.disabled = true;

    const introRect = intro.getBoundingClientRect();
    const buttonRect = startButton.getBoundingClientRect();
    intro.style.setProperty("--ring-x", `${buttonRect.left + buttonRect.width / 2 - introRect.left}px`);
    intro.style.setProperty("--ring-y", `${buttonRect.top + buttonRect.height / 2 - introRect.top}px`);
    intro.classList.add("is-leaving");
    await wait(prefersReducedMotion ? 20 : 720);
    stopIntroAtmosphere();
    intro.hidden = true;
    conversation.hidden = false;
    conversationScroll.focus({ preventScroll: true });

    await say("Morgane… j’ai une petite question 👀");
    await say("Le week-end du 14 août, t’avais déjà prévu quelque chose ? 😌");
    ask("availability", "Dis la vérité 😂", [
        {
            id: "busy",
            label: "Oui… pourquoi ? 🤨",
            action: async () => {
                await say("Ok, je note 👀 Laisse-moi quand même finir avant de paniquer 😂");
                await askPerfectWeekendQuestion();
            }
        },
        {
            id: "free",
            label: "Rien de prévu 😌",
            action: async () => {
                await say("Parfait… garde-le libre. Je dis ça, je dis rien 😂");
                await askPerfectWeekendQuestion();
            }
        },
        {
            id: "depends",
            label: "Ça dépend de ce que tu prépares 👀",
            action: async () => {
                await say("Tu me connais trop bien, ça devient grave 😂");
                await askPerfectWeekendQuestion();
            }
        }
    ]);
}

async function askPerfectWeekendQuestion() {
    await say("Bon, j’ai besoin d’une info très importante 😌");
    await say("Pour toi, le programme parfait pour souffler un peu, c’est quoi ? 👀");
    ask("break_style", "Choisis bien, je prends des notes 😂", [
        {
            id: "sleep",
            label: "Dormir jusqu’à midi 😴",
            action: async () => {
                await say("Ah donc madame veut surtout qu’on la laisse tranquille 😭😂");
                await beginRevealLeadIn();
            }
        },
        {
            id: "pool",
            label: "Piscine + soleil ☀️",
            action: async () => {
                await say("Je vois… dans ta tête, le transat est déjà réservé 😂");
                await beginRevealLeadIn();
            }
        },
        {
            id: "food",
            label: "Bien manger d’abord 😂",
            action: async () => {
                await say("Enfin une réponse sérieuse, je respecte 😭😂");
                await beginRevealLeadIn();
            }
        },
        {
            id: "why",
            label: "Pourquoi toutes ces questions ? 🤨",
            action: async () => {
                await say("Deux questions et le mode FBI est déjà activé 😂");
                await beginRevealLeadIn();
            }
        }
    ]);
}

async function beginRevealLeadIn() {
    await say("Bon, en vrai… j’avais envie de te faire une surprise 🤍");
    await say("Pas un cadeau qui finit au fond d’un tiroir 😭");
    await say("Plutôt une vraie pause : rien à gérer, juste profiter 🌴☀️", { emphasis: true });
    await say("Et oui… j’ai vraiment tout organisé 😂");
    ask("reveal", "Tu veux voir ? 👀", [
        {
            id: "show",
            label: "Oui, montre-moi 😭",
            primary: true,
            action: revealTrip
        },
        {
            id: "nervous",
            label: "J’ai peur de toi là 😂",
            action: async () => {
                await say("Tu peux 😂 Mais promis, la surprise vaut le coup 👀");
                await revealTrip();
            }
        }
    ]);
}

async function revealTrip() {
    await say("Ok… regarde bien 👀", { emphasis: true });
    setLocked(true);
    await wait(prefersReducedMotion ? 40 : 450);
    messages.appendChild(revealTemplate.content.cloneNode(true));
    trackEvent("trip_revealed", { stepId: "trip" });
    launchConfetti();
    vibrate([50, 35, 80]);
    scrollToLatest();
    await wait(prefersReducedMotion ? 50 : 1000);
    await say("Surpriseee 🥳🎉");
    await say("Du 14 au 16 août : deux nuits au Lamantin Beach 🌊☀️");
    await say("Et oui, c’est déjà réservé 😌");
    await say("Deux nuits… oui madame, j’ai vraiment pensé à tout 😂🤍");
    await say("Ah oui… il y a aussi la fête JELANI au programme 🥳");
    await say("Les tickets JELANI sont déjà pris et inclus dans la surprise. Madame n’a rien à gérer 😂🎟️");
    await say("Bon… maintenant que tu sais tout, est-ce que madame valide le programme ? 👀😂", { emphasis: true });
    askFinalChoice();
}

function askFinalChoice() {
    ask("final", "Alors madame ? 👀", [
        {
            id: "accept",
            label: "Oui, je viens 😭🤍",
            primary: true,
            action: acceptTrip
        },
        {
            id: "details",
            label: "Je veux les détails 👀",
            action: askForDetails
        },
        {
            id: "thinking",
            label: "Laisse-moi réfléchir 🤍",
            action: askWhatMakesHerHesitate
        },
        {
            id: "decline_first",
            label: "Je ne peux pas 😕",
            action: handleFirstDecline
        }
    ]);
}

async function acceptTrip() {
    finalChoice = "Oui, je viens au Lamantin Beach du 14 au 16 août, avec les tickets pour la fête JELANI 😭🤍";
    trackEvent("final_response", {
        stepId: "outcome",
        choiceId: "accepted",
        choiceLabel: finalChoice,
        outcome: "accepted"
    });
    await say("Attends… c’est vraiment oui là ? 😭😂");
    await say("Ok, je reste calme… enfin j’essaie 🥳");
    await say("Je t’envoie tout le programme 🤍");
    launchConfetti({ amount: 90, duration: 2400 });
    showFinalPanel(
        "Bon bah… c’est oui 😭🤍",
        "Appelle-moi directement avant que tu changes d’avis 😂📞",
        "call"
    );
}

async function askForDetails() {
    if (!detailsIntroduced) {
        detailsIntroduced = true;
        await say("Je savais que le mode FBI allait revenir 😂🕵🏽‍♀️");
        await say("Vas-y madame, choisis ton dossier 👇😂");
    } else {
        await say("Ahhh, l’enquête n’était donc pas finie 😭😂");
    }
    showDetailMenu("Tu veux savoir quoi ? 👀");
}

function detailLabel(id, label) {
    return `${viewedDetailTopics.has(id) ? "✓ " : ""}${label}`;
}

function showDetailMenu(prompt = "Autre question, madame l’inspectrice ? 😂") {
    ask("detail_topic", prompt, [
        {
            id: "program",
            label: detailLabel("program", "On fait quoi là-bas ? 👀"),
            action: async () => {
                viewedDetailTopics.add("program");
                await say("Piscine, plage, bien manger, la fête JELANI… et surtout souffler 😌🌊☀️");
                await say("Et si madame veut dormir jusqu’à midi, je ne juge pas… trop 😂");
                showDetailMenu();
            }
        },
        {
            id: "rooms",
            label: detailLabel("rooms", "Deux chambres, t’es sûr ? 😂"),
            action: async () => {
                viewedDetailTopics.add("rooms");
                await say("Oui oui, deux vraies chambres séparées 😂");
                await say("J’ai anticipé l’enquête avant même qu’elle commence. Range le badge FBI 🕵🏽‍♀️🤍");
                showDetailMenu();
            }
        },
        {
            id: "party_tickets",
            label: detailLabel("party_tickets", "JELANI aussi ? 🥳🎟️"),
            action: async () => {
                viewedDetailTopics.add("party_tickets");
                await say("Oui madame, la fête JELANI est bien prévue pendant le séjour 🥳👀");
                await say("Et les tickets JELANI sont déjà pris. J’ai encore anticipé 😂🎟️");
                showDetailMenu();
            }
        },
        {
            id: "secret",
            label: detailLabel("secret", "Avoue, tu caches quoi ? 🤨😂"),
            action: async () => {
                viewedDetailTopics.add("secret");
                await say("Rien de louche, promis 😂 Le séjour ET JELANI, c’était déjà beaucoup 👀");
                await say("Du 14 au 16, deux chambres et tickets JELANI inclus. Madame a le dossier complet ✅");
                showDetailMenu();
            }
        },
        {
            id: "accept",
            label: "Ok, je valide 😭🤍",
            primary: true,
            action: acceptTrip
        },
        {
            id: "think",
            label: "Je réfléchis encore 😂🤍",
            action: askWhatMakesHerHesitate
        },
        {
            id: "decline",
            label: "Ça donne envie, mais je peux pas 😕",
            action: handleFirstDecline
        }
    ]);
}

async function askWhatMakesHerHesitate() {
    await say("Ahhh… madame ouvre une réunion avec elle-même maintenant ? 😭😂");
    ask("hesitation_reason", "C’est quoi qui te fait hésiter ? 👀", [
        {
            id: "dates",
            label: "Les dates peut-être 😭",
            action: async () => {
                await say("Ahhh… donc mon vrai rival, c’est ton calendrier 😭😂");
                await say("Vérifie tranquillement, si ça bloque je comprends 🤍");
                askAfterHesitation();
            }
        },
        {
            id: "organisation",
            label: "Je dois m’organiser 👀",
            action: async () => {
                await say("Le mode planning est activé, je reconnais 😂");
                await say("Regarde tout ça calmement, aucune pression 🤍");
                askAfterHesitation();
            }
        },
        {
            id: "too_surprised",
            label: "La surprise me surprend trop 😂",
            action: async () => {
                await say("J’avoue… j’ai peut-être un peu abusé sur l’effet surprise 😭😂");
                await say("Prends le temps de digérer tout ça, madame 🤍");
                askAfterHesitation();
            }
        },
        {
            id: "needs_time",
            label: "J’ai juste besoin de temps 🤍",
            action: async () => {
                await say("Donc madame veut me laisser dans le suspense maintenant ? 😭😂");
                await say("Ça marche, le plus important c’est que tu sois à l’aise 🤍");
                askAfterHesitation();
            }
        }
    ]);
}

function askAfterHesitation() {
    ask("after_hesitation", "Bon… verdict provisoire ? 👀😂", [
        {
            id: "accept",
            label: "Bon… oui, je viens 😭🤍",
            primary: true,
            action: acceptTrip
        },
        {
            id: "details",
            label: "Je veux voir les détails 👀",
            action: askForDetails
        },
        {
            id: "later",
            label: "Je te réponds plus tard 🤍",
            action: finalizeThinking
        },
        {
            id: "decline",
            label: "Non, ça va pas être possible 😕",
            action: handleFirstDecline
        }
    ]);
}

async function finalizeThinking() {
    finalChoice = "J’ai besoin d’un peu de temps pour réfléchir au séjour du 14 au 16 août 🤍";
    trackEvent("final_response", {
        stepId: "outcome",
        choiceId: "thinking",
        choiceLabel: finalChoice,
        outcome: "thinking"
    });
    await say("Ça marche, je range mon discours commercial pour aujourd’hui 😂🤍");
    await say("Prends ton temps, vraiment. Aucune pression.");
    showFinalPanel("Suspense accepté 😂🤍", "Ta réponse est déjà prête, tu n’as rien à rédiger.");
}

async function handleFirstDecline() {
    if (declineRetryOffered) {
        await finalizeDecline();
        return;
    }
    declineRetryOffered = true;
    await say("Attends… même avec piscine, soleil, deux chambres ET JELANI ? 😭😂");
    await say("Bon, j’aurai tenté de vendre mon programme jusqu’au bout 😌");
    await say("Mais en vrai, si tu peux pas, je comprends 🤍 Zéro pression.");
    ask("decline_retry", "Je tente une toute dernière fois ? 😂", [
        {
            id: "retry",
            label: "Vas-y, tente encore 😂",
            primary: true,
            action: makeLastPlayfulAttempt
        },
        {
            id: "decline_confirmed",
            label: "Non vraiment, je peux pas 🤍",
            action: finalizeDecline
        }
    ]);
}

async function makeLastPlayfulAttempt() {
    await say("Ahhh 😭 Bon, écoute bien mon dernier argument 😂");
    await say("Deux nuits, deux chambres, piscine, soleil, JELANI… et toi, tu n’organises absolument rien 😌🌴");
    await say("Voilà. Fin de ma publicité 😂🤍");
    ask("retry_final", "Alors ? 👀", [
        {
            id: "accept",
            label: "Bon… oui je viens 😭🤍",
            primary: true,
            action: acceptTrip
        },
        {
            id: "details",
            label: "J’ai encore des questions 👀",
            action: askForDetails
        },
        {
            id: "decline",
            label: "Non vraiment 🤍",
            action: finalizeDecline
        }
    ]);
}

async function finalizeDecline() {
    finalChoice = "Je ne pourrai pas venir au séjour du 14 au 16 août.";
    trackEvent("final_response", {
        stepId: "outcome",
        choiceId: "declined",
        choiceLabel: finalChoice,
        outcome: "declined"
    });
    await say("Ok, là j’arrête vraiment ma pub 😂");
    await say("Je comprends, aucun souci 🤍 Merci de me l’avoir dit franchement.");
    showFinalPanel("C’est noté 🤍", "Tu peux m’envoyer ta réponse sans avoir à tout réécrire.");
}

function buildTextMessage() {
    return [
        `Coucou ${CONFIG.sender} 👀`,
        "",
        finalChoice || `Je te réponds pour le séjour ${CONFIG.dates} au ${CONFIG.destination}.`
    ].join("\n");
}

function showFinalPanel(title, copy, action = "message") {
    clearReplies();
    replyArea.hidden = true;
    const isCall = action === "call";

    const panel = document.createElement("section");
    panel.className = "final-panel";
    panel.dataset.action = action;
    panel.innerHTML = `
        <p class="final-panel__eyebrow">DERNIÈRE ÉTAPE</p>
        <h2></h2>
        <p class="final-panel__copy"></p>
        <button class="send-button" type="button">
            <span></span>
            <span aria-hidden="true">→</span>
        </button>
        <p class="send-help"></p>
    `;
    panel.querySelector("h2").textContent = title;
    panel.querySelector(".final-panel__copy").textContent = copy;
    panel.querySelector(".send-button span:first-child").textContent = isCall
        ? "Appelle-moi maintenant 📞"
        : "Envoyer mon message 💬";
    panel.querySelector(".send-help").textContent = isCall
        ? "Ton téléphone ouvrira l’appel. Rien ne démarre sans ta confirmation."
        : "L’app Messages s’ouvrira avec le texte déjà écrit. Rien ne part sans ton dernier clic.";
    panel.querySelector(".send-button").addEventListener("click", async () => {
        await Promise.race([trackImmediate("contact_action", {
            stepId: "contact",
            action: isCall ? "call" : "sms",
            choiceLabel: isCall ? "Appeler Mohamed" : "Envoyer un SMS à Mohamed"
        }), wait(350)]);
        if (isCall) {
            const callDigits = CONFIG.callNumber.replace(/\D/g, "");
            const cleanCallNumber = CONFIG.callNumber.trim().startsWith("+")
                ? `+${callDigits}`
                : callDigits;
            window.location.href = `tel:${cleanCallNumber}`;
            return;
        }

        const cleanMessageNumber = CONFIG.messageNumber.replace(/\D/g, "");
        const encodedMessage = encodeURIComponent(buildTextMessage());
        window.location.href = `sms:${cleanMessageNumber}?body=${encodedMessage}`;
    });

    messages.appendChild(panel);
    presenceText.textContent = "attend ta réponse";
    scrollToLatest();
}

startButton.addEventListener("click", startConversation, { once: true });

window.setTimeout(() => {
    startButton.disabled = false;
    startButton.classList.add("is-ready");
}, prefersReducedMotion ? 0 : 3400);
