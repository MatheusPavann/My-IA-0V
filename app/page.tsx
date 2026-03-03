import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/dashboard") // Se já logou, pula pro site

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center p-10 border border-zinc-800 rounded-2xl bg-zinc-900">
        <h1 className="text-2xl font-bold mb-6">My-IA-0V</h1>
        <form action={async () => { "use server"; await signIn("github") }}>
          <button className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition">
            Entrar com GitHub
          </button>
        </form>
      </div>
    </div>
  )
}
