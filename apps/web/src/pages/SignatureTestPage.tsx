import { type Component, createSignal } from 'solid-js';
import { SignatureCapture } from '../components/SignatureCapture';

const SignatureTestPage: Component = () => {
  const [signatureData, setSignatureData] = createSignal<string>('');

  const handleSignature = (data: string) => {
    setSignatureData(data);
    console.log('Signature captured:', data);
  };

  const handleError = (error: string) => {
    console.error('Signature error:', error);
  };

  return (
    <div class="min-h-screen bg-gray-50 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-ctm-text mb-8">Prueba de Captura de Firma Topaz</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SignatureCapture onSignature={handleSignature} onError={handleError} />
          </div>

          <div class="space-y-4">
            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Información de la Firma</h3>

              {signatureData() ? (
                <div class="space-y-4">
                  <div>
                    <div class="block text-sm font-medium text-gray-700 mb-2">Estado:</div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Firma capturada
                    </span>
                  </div>

                  <div>
                    <div class="block text-sm font-medium text-gray-700 mb-2">Tamaño de datos:</div>
                    <span class="text-sm text-gray-600">{signatureData().length} caracteres</span>
                  </div>

                  <div>
                    <div class="block text-sm font-medium text-gray-700 mb-2">Formato:</div>
                    <span class="text-sm text-gray-600">Base64 JPG</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([signatureData()], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `signature-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      class="btn-primary"
                    >
                      Descargar Datos
                    </button>
                  </div>
                </div>
              ) : (
                <div class="text-center text-gray-500 py-8">
                  <p>No hay firma capturada</p>
                  <p class="text-sm mt-2">Usa el panel de la izquierda para capturar una firma</p>
                </div>
              )}
            </div>

            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Instrucciones</h3>
              <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Instala la extensión Topaz SigPlusExtLite en tu navegador</li>
                <li>Conecta tu tableta de firma Topaz al computador</li>
                <li>Haz clic en "Conectar" para establecer la conexión</li>
                <li>Haz clic en "Iniciar Captura" para comenzar a capturar</li>
                <li>Firma en la tableta Topaz</li>
                <li>Haz clic en "Guardar Firma" para obtener los datos</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureTestPage;
