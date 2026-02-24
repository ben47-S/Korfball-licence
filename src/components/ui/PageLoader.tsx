'use client';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
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

