import StartForm from "@/components/StartForm";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
                <h1 className="text-center text-3xl font-bold mb-8">TypeRacer</h1>
                <StartForm />
            </main>
        </div>
    );
}
