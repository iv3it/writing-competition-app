"use client";

type Player = {
    id: string;
    nick: string;
    progress: string;
    wpm: number;
    accuracy: number;
};

export default function ResultsTable({ players }: {
    players: Record<string, Player>;
}) {
    const playersArray = Object.values(players);

    return (
        <table className="w-full max-w-4xl border mt-6">
            <thead>
                <tr className="border-b">
                    <th className="py-2 px-4 border">Live progress</th>
                    <th className="py-2 px-4 border">Nick</th>
                    <th className="py-2 px-4 border">WPM</th>
                    <th className="py-2 px-4 border">Accuracy</th>
                </tr>
            </thead>
            <tbody>
                {playersArray.map((player) => (
                    <tr key={player.id} className="border-b text-right">
                        <td className="py-2 px-4 border w-full">{player.progress}</td>
                        <td className="py-2 px-4 border">{player.nick}</td>
                        <td className="py-2 px-4 border">{player.wpm}</td>
                        <td className="py-2 px-4 border">{player.accuracy}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}