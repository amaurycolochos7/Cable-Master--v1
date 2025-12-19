import Link from 'next/link';

export const metadata = {
    title: 'Aviso de Privacidad - Cable Master',
    description: 'Aviso de privacidad y protección de datos personales de Cable Master',
};

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="card">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        Aviso de Privacidad
                    </h1>

                    <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                        <p className="text-sm text-gray-500">
                            Última actualización: Diciembre 2024
                        </p>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                1. Identidad y Domicilio del Responsable
                            </h2>
                            <p>
                                <strong>Cable Master</strong>, con domicilio en Chiapa de Corzo, Chiapas, México,
                                es el responsable del uso y protección de sus datos personales, y al respecto le
                                informamos lo siguiente:
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                2. Datos Personales que Recabamos
                            </h2>
                            <p>Para las finalidades señaladas en el presente aviso de privacidad, podemos recabar sus datos personales de distintas formas:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Cuando usted nos los proporciona directamente a través de nuestro sitio web</li>
                                <li>Cuando visita nuestro sitio web o utiliza nuestros servicios en línea</li>
                                <li>Cuando nos contacta por teléfono, WhatsApp o correo electrónico</li>
                            </ul>
                            <p className="mt-4">Los datos personales que recabamos incluyen:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Nombre completo</li>
                                <li>Domicilio</li>
                                <li>Teléfono (fijo y/o celular)</li>
                                <li>Correo electrónico</li>
                                <li>Código postal</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                3. Finalidades del Tratamiento de sus Datos
                            </h2>
                            <p>Sus datos personales serán utilizados para las siguientes finalidades:</p>

                            <h3 className="font-semibold mt-4 mb-2">Finalidades Primarias:</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provisión de servicios de telecomunicaciones (Internet y TV)</li>
                                <li>Gestión de solicitudes de contratación</li>
                                <li>Atención de reportes de fallas y soporte técnico</li>
                                <li>Instalación y mantenimiento de equipos</li>
                                <li>Facturación y cobranza</li>
                                <li>Contacto para seguimiento de servicios</li>
                            </ul>

                            <h3 className="font-semibold mt-4 mb-2">Finalidades Secundarias:</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Envío de información sobre promociones y nuevos servicios</li>
                                <li>Mejora de nuestros servicios</li>
                                <li>Estadísticas internas</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                4. Protección de sus Datos
                            </h2>
                            <p>
                                Cable Master ha implementado medidas de seguridad técnicas, administrativas y físicas
                                para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el
                                uso, acceso o tratamiento no autorizado.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                5. Derechos ARCO
                            </h2>
                            <p>
                                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los
                                utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho
                                solicitar la corrección de su información personal en caso de que esté desactualizada,
                                sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o
                                bases de datos cuando considere que la misma no está siendo utilizada adecuadamente
                                (Cancelación); así como oponerse al uso de sus datos personales para fines específicos
                                (Oposición).
                            </p>
                            <p className="mt-4">
                                Para ejercer sus derechos ARCO, puede contactarnos a través de:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Teléfono:</strong> 961 248 3470</li>
                                <li><strong>WhatsApp:</strong> 961 248 3470</li>
                                <li><strong>Correo:</strong> privacidad@cablemaster.com.mx</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                6. Cambios al Aviso de Privacidad
                            </h2>
                            <p>
                                Nos reservamos el derecho de efectuar en cualquier momento modificaciones o
                                actualizaciones al presente aviso de privacidad. Estas modificaciones estarán
                                disponibles en nuestro sitio web.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                7. Consentimiento
                            </h2>
                            <p>
                                Entendemos que, si usted no manifiesta su oposición para que sus datos personales
                                sean transferidos, se entenderá que ha otorgado su consentimiento para ello.
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 pt-6 border-t">
                        <Link href="/public" className="text-primary hover:underline">
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
