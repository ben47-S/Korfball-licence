export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>

        <h2 className="mt-6 text-xl font-semibold text-gray-900">
          Chargement...
        </h2>
        <p className="mt-2 text-gray-600">
          Veuillez patienter un instant
        </p>
      </div>
    </div>
  );
}
