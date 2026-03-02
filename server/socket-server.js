import {createServer} from "http";
import {Server} from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

let players = {};
let roundState = "playing";
let currentSentence = "";
let roundEndTime = Date.now();
const roundDuration = 30;
const breakDuration = 5;

const sentences = [
    "Maine Coons are one of the largest domestic cat breeds, known for their thick water-resistant fur, tufted ears, bushy tails, and exceptionally gentle and sociable personalities.",
    "Abyssinians are highly active and curious cats with short ticked coats, elegant athletic builds, and a playful nature that keeps them constantly exploring their surroundings.",
    "Siamese cats are famous for their striking blue almond-shaped eyes, color-pointed coats, and highly vocal temperament that makes them very expressive companions.",
    "Persian cats are admired for their long luxurious fur, round expressive faces, and calm, affectionate demeanor that makes them well suited for quiet indoor living.",
    "Bengal cats have a wild appearance with their leopard-like spotted coats, muscular bodies, and energetic personalities that require plenty of stimulation and play.",
    "Ragdoll cats are large, gentle felines known for their soft semi-long coats and their tendency to go limp in their owner's arms, which is how they earned their name.",
    "Sphynx cats stand out because of their hairless bodies, warm suede-like skin, large ears, and affectionate personalities that crave human attention and warmth.",
    "Scottish Folds are easily recognized by their unique folded ears, round eyes, and sweet temperament that makes them calm and adaptable family pets."
];

const getRandomSentence = () => {
    return sentences[Math.floor(Math.random() * sentences.length)];
}

const startGlobalTimer = () => {
    setInterval(() => {
        const timeLeft = Math.max(0, Math.floor((roundEndTime - Date.now()) / 1000));

        io.emit("timerUpdate", {
            timeLeft,
            roundState,
        });
    }, 1000);
}

const startPlayingRound = () => {
    roundState = "playing";
    currentSentence = getRandomSentence();
    roundEndTime = Date.now() + (roundDuration * 1000);

    // reset
    Object.keys(players).forEach((id) => {
        players[id].progress = "";
        players[id].wpm = 0;
        players[id].accuracy = 1;
    });

    io.emit("roundStarted", {
        sentence: currentSentence,
        roundEndTime,
    });

    setTimeout(startBreakRound, roundDuration * 1000);
}

const startBreakRound = () => {
    roundState = "break";
    roundEndTime = Date.now() + breakDuration * 1000;

    io.emit("roundBreak", {
        roundEndTime,
        players,
    });

    setTimeout(startPlayingRound, breakDuration * 1000);
}

// start first round
startPlayingRound();
startGlobalTimer();

// socket
io.on("connection", (socket) => {
    socket.on("joinGame", ({ playerId, nick }) => {
        players[playerId] = {
            id: playerId,
            nick,
            progress: "",
            wpm: 0,
            accuracy: 1,
            socketId: socket.id,
        };

        io.emit("playersUpdate", players);

        socket.emit("currentState", {
            roundState,
            sentence: currentSentence,
            roundEndTime,
            players,
        });
    });

    socket.on("updateProgress", ({ playerId, progress, wpm, accuracy }) => {
        if (!players[playerId]) return;

        players[playerId].progress = progress;
        players[playerId].wpm = wpm;
        players[playerId].accuracy = accuracy;

        io.emit("playersUpdate", players);
    });

    socket.on("disconnect", () => {
        const playerEntry = Object.entries(players).find(
            ([_, p]) => p.socketId === socket.id
        );

        if (playerEntry) {
            const [playerId] = playerEntry;
            delete players[playerId];
            io.emit("playersUpdate", players);
        }

        console.log("User disconnected:", socket.id);
    });
});

httpServer.listen(3001, () => {
    console.log("Socket server running on 3001");
});