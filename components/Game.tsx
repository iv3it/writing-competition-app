"use client";

import {useEffect, useRef, useState} from "react";
import {socket} from "@/lib/socket";
import ResultsTable from "./ResultsTable";

type Player = {
    id: string;
    nick: string;
    progress: string;
    wpm: number;
    accuracy: number;
};

export default function Game() {
    const [sentence, setSentence] = useState("");
    const [finishedSentence, setFinishedSentence] = useState(false);
    const [input, setInput] = useState("");
    const [players, setPlayers] = useState<Record<string, Player>>({});
    const [roundState, setRoundState] = useState<"playing" | "break">("playing");
    const [timeLeft, setTimeLeft] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        socket.connect();

        const storedPlayerId = localStorage.getItem("playerId");
        const storedNick = localStorage.getItem("nick");

        if (!storedPlayerId || !storedNick) {
            return;
        }

        socket.emit("joinGame", { playerId: storedPlayerId, nick: storedNick });

        socket.on("currentState", (data) => {
            setSentence(data.sentence);
            setRoundState(data.roundState);
            setPlayers(data.players);

            const initialTimeLeft = Math.max(0, Math.floor((data.roundEndTime - Date.now()) / 1000));
            setTimeLeft(initialTimeLeft);
            setIsReady(true);
        });

        socket.on("timerUpdate", (data) => {
            setTimeLeft(data.timeLeft);
            setRoundState(data.roundState);
        });

        socket.on("playersUpdate", (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on("roundStarted", (data) => {
            setSentence(data.sentence);
            setRoundState("playing");
            setInput("");
            setFinishedSentence(false);
        });

        socket.on("roundBreak", () => {
            setRoundState("break");
        });

        return () => {
            socket.off("currentState");
            socket.off("timerUpdate");
            socket.off("playersUpdate");
            socket.off("roundStarted");
            socket.off("roundBreak");
        };
    }, []);

    useEffect(() => {
        if (roundState === "playing" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [roundState]);

    const calculateStats = (value: string) => {
        const elapsedSeconds = 30 - timeLeft;
        const minutes = elapsedSeconds / 60;

        const sentenceWords = sentence.trim().split(" ");
        const typedWords = value.trim().split(" ");

        // counting only full correct words
        let correctWordCount = 0;

        for (let i = 0; i < typedWords.length && i < sentenceWords.length; i++) {
            if (typedWords[i] === sentenceWords[i]) {
                correctWordCount++;
            }
        }

        const wpm = minutes > 0 ? correctWordCount / minutes : 0;

        /// accuracy
        let correctChars = 0;

        for (let i = 0; i < value.length && i < sentence.length; i++) {
            if (value[i] === sentence[i]) {
                correctChars++;
            }
        }

        const accuracy = sentence.length > 0 ? correctChars / sentence.length : 1;

        return {
            wpm: Math.max(0, Math.round(wpm)),
            accuracy: Number(accuracy.toFixed(2)),
        };
    };

    const handleChange = (value: string) => {
        if (roundState !== "playing") return;

        setInput(value);

        const { wpm, accuracy } = calculateStats(value);

        const storedPlayerId = localStorage.getItem("playerId");
        if (!storedPlayerId) return;

        socket.emit("updateProgress", {
            playerId: storedPlayerId,
            progress: value,
            wpm,
            accuracy,
        });

        if (value === sentence) {
            setFinishedSentence(true);
        }
    };

    const renderColoredSentence = () => {
        return sentence.split("").map((char, i) => {
            let className = "";
            if (i < input.length) {
                className = input[i] === char ? "text-emerald-400" : "text-red-400";
            }

            return (
                <span key={i} className={className}>{char}</span>
            );
        });
    };

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading game...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center p-8 gap-6">
            <h1 className="text-3xl font-bold">TypeRacer</h1>

            <div className="text-lg">
                {roundState === "playing" ? "Time left: " : "Next round in: "}
                <span className="font-bold">{timeLeft}s</span>
            </div>

            <div className="max-w-4xl text-xl font-mono mb-2">
                {renderColoredSentence()}
            </div>

            <input
                ref={inputRef}
                className={`border p-3 w-full max-w-4xl transition-all duration-200 bg-white text-black disabled:bg-gray-200 disabled:text-gray-500`}
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={roundState === "playing" ? "Start typing..." : "Waiting for next round..."}
                disabled={finishedSentence || roundState !== "playing"}
                autoFocus={roundState === "playing"}
            />

            <div className="mt-2 text-green-600 font-semibold transition-opacity duration-300" style={{ visibility: finishedSentence ? "visible" : "hidden" }}>Congrats!</div>

            <ResultsTable players={players} />
        </div>
    );
}