export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-4">
        SillyTavern v2
      </h1>
      <p className="text-gray-400 text-lg">
        LLM Frontend for Power Users
      </p>
      <div className="mt-8 space-x-4">
        <a
          href="/login"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
