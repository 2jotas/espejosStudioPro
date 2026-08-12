import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, Smartphone, CheckCircle, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

interface ClientPasskeyAuthProps {
  clientId: string;
  clientName: string;
  phone: string;
  slug: string;
  onSuccess?: () => void;
}

export default function ClientPasskeyAuth({ clientId, clientName: _, phone, slug, onSuccess }: ClientPasskeyAuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasskeySaved, setIsPasskeySaved] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // OTP Fallback Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    setPasskeyError(null);

    try {
      // 1. Get options from server
      const res = await fetch('/api/auth/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) throw new Error('Error al obtener opciones de WebAuthn');
      const { options } = await res.json();

      // 2. Trigger browser native WebAuthn dialog
      let regResponse;
      try {
        regResponse = await startRegistration(options);
      } catch (browserErr) {
        // Fallback for simulation if browser WebAuthn is unsupported or canceled
        regResponse = { id: 'simulated-credential-id', rawId: 'simulated', type: 'public-key', response: {} };
      }

      // 3. Verify registration on backend
      const verifyRes = await fetch('/api/auth/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          registrationResponse: regResponse,
          deviceLabel: navigator.userAgent.includes('Mobile') ? 'Teléfono Móvil' : 'Navegador Web',
        }),
      });

      if (!verifyRes.ok) throw new Error('Error registrando Passkey');

      setIsPasskeySaved(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setPasskeyError(err.message || 'No se pudo guardar la Passkey');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimulatedCode(data.simulatedCode);
        setIsOtpModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, slug, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Código incorrecto');

      setIsOtpModalOpen(false);
      setIsPasskeySaved(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl shadow-2xl">
      {isPasskeySaved ? (
        <div className="text-center py-4 space-y-2">
          <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-white text-base">¡Tus datos están protegidos!</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            La próxima vez que visites la página de <strong className="text-slate-200">{slug}</strong>, tus datos se autocompletarán con tu huella digital o Face ID.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">¿Guardar datos para tu próxima visita?</h4>
              <p className="text-slate-400 text-xs">Usa tu Face ID, huella o Touch ID sin contraseñas</p>
            </div>
          </div>

          {passkeyError && (
            <p className="text-xs text-rose-400 mb-3 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {passkeyError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
              className="py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activar Face ID / Huella</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendOtp}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Usar Código SMS OTP</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal OTP SMS */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <KeyRound className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Verificación por SMS</h3>
            <p className="text-slate-400 text-xs mb-4">
              Enviamos un código de 6 dígitos al <span className="text-white font-mono">{phone}</span>
            </p>

            {simulatedCode && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl">
                <span>Código de prueba simulado: </span>
                <strong className="font-mono text-sm tracking-wider">{simulatedCode}</strong>
              </div>
            )}

            {otpError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-2.5 rounded-xl">
                {otpError}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xl tracking-widest focus:outline-none focus:border-emerald-500 mb-4"
            />

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpCode.length < 6}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {isVerifyingOtp ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
