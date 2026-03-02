"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function StartForm() {
    const [nick, setNick] = useState("");
    const router = useRouter();

    const handleStart = () => {
        if (!nick.trim()) return;
        localStorage.setItem("nick", nick.trim());

        let playerId = localStorage.getItem("playerId");

        if (!playerId) {
            playerId = uuidv4();
            localStorage.setItem("playerId", playerId);
        }

        router.push("/game");
    };

    useEffect(() => {
        let savedNick = localStorage.getItem("nick");

        if(savedNick) {
            setNick(savedNick);
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <Input
                placeholder="Enter your nick"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="w-72"
            />
            <Button onClick={handleStart}>Start playing</Button>
        </div>
    );
}