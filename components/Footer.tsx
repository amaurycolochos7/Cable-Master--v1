import Link from 'next/link';
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo y slogan */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="mb-4">
                            <img
                                src="/logo.png"
                                alt="Cable Master - La Mejor Programación"
                                className="h-16 w-auto mb-2"
                            />
                        </div>
                        <p className="text-gray-400 text-sm">
                            Internet de alta velocidad por fibra óptica y la mejor programación de televisión en Chiapas.
                        </p>
                    </div>

                    {/* Enlaces rápidos */}
                    <div>
                        <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/public/packages" className="text-gray-400 hover:text-white">
                                    Paquetes
                                </Link>
                            </li>
                            <li>
                                <Link href="/public/promotions" className="text-gray-400 hover:text-white">
                                    Promociones
                                </Link>
                            </li>
                            <li>
                                <Link href="/public/coverage" className="text-gray-400 hover:text-white">
                                    Verificar Cobertura
                                </Link>
                            </li>
                            <li>
                                <Link href="/public/locations" className="text-gray-400 hover:text-white">
                                    Ubicaciones
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h4 className="font-semibold mb-4">Contacto</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center space-x-2">
                                <PhoneIcon className="h-5 w-5 text-primary" />
                                <a href="tel:9612483470" className="text-gray-400 hover:text-white">
                                    961 248 3470
                                </a>
                            </li>
                            <li className="flex items-center space-x-2">
                                <EnvelopeIcon className="h-5 w-5 text-primary" />
                                <a href="mailto:contacto@cablemaster.com" className="text-gray-400 hover:text-white">
                                    contacto@cablemaster.com
                                </a>
                            </li>
                            <li className="flex items-center space-x-2">
                                <MapPinIcon className="h-5 w-5 text-primary" />
                                <span className="text-gray-400">Chiapas, México</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>© 2025 Cable Master. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
