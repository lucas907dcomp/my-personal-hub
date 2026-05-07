export function SplashScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-white tracking-widest">GYMHUB</h1>
      <div className="w-8 h-8 border-2 border-gym-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
