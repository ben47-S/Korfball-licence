import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icône 404 */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-4">
          <span className="text-4xl font-bold text-indigo-600">404</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Page introuvable
        </h1>

        <p className="text-gray-600 mb-6">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button variant="primary" className="w-full">
              Retour à l'accueil
            </Button>
          </Link>
          <Link href="/inscription" className="flex-1">
            <Button variant="secondary" className="w-full">
              Nouvelle inscription
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
