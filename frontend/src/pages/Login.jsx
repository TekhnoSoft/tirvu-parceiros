import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simular um pequeno delay para UX (opcional, remove sensação de "piscar")
    // await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const user = await login(email, password);
      if (user.role === 'admin' || user.role === 'consultor') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('E-mail ou senha incorretos. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Lado Esquerdo - Decorativo (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1584A1] to-[#0e5f73] relative overflow-hidden items-center justify-center">
        {/* Elementos de Fundo Abstratos */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl"></div>
           <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 text-white text-center px-12 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo Placeholder - Substituir por imagem se disponível */}
            <div className="mb-8 flex justify-center">
               <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                 <img src="/logo.webp" alt="Tirvu" className="h-16 w-auto" onError={(e) => e.target.style.display = 'none'} />
                 {/* Fallback visual caso a imagem falhe ou para complementar */}
               </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Acelere seus resultados com nossa plataforma de parceiros
            </h1>
            <p className="text-lg text-blue-50 mb-8 font-light">
              Gerencie seus leads, acompanhe suas comissões e tenha acesso a materiais exclusivos em um só lugar.
            </p>

            {/* Feature list rápida */}
            <div className="flex flex-col gap-3 text-left bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10">
               <div className="flex items-center gap-3">
                 <CheckCircle className="w-5 h-5 text-green-300" />
                 <span className="text-sm font-medium">Dashboard em tempo real</span>
               </div>
               <div className="flex items-center gap-3">
                 <CheckCircle className="w-5 h-5 text-green-300" />
                 <span className="text-sm font-medium">Gestão completa de leads</span>
               </div>
               <div className="flex items-center gap-3">
                 <CheckCircle className="w-5 h-5 text-green-300" />
                 <span className="text-sm font-medium">Pagamentos seguros e rápidos</span>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="lg:hidden text-center mb-8">
               <img src="/logo.webp" alt="Tirvu" className="h-16 w-auto" onError={(e) => e.target.style.display = 'none'} />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bem-vindo(a)</h2>
              <p className="mt-2 text-sm text-gray-500">
                Por favor, insira seus dados para acessar sua conta.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md"
                >
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <div className="relative rounded-lg shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none sm:text-sm bg-gray-50 focus:bg-white hover:bg-white"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                   <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                     Senha
                   </label>
                </div>
                <div className="relative rounded-lg shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none sm:text-sm bg-gray-50 focus:bg-white hover:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-primary transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-primary/30 text-sm font-semibold text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Acessar Plataforma
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Ainda não é um parceiro?{' '}
                <a href="https://tirvu-parceiros-lading.vercel.app/" className="font-medium text-primary hover:text-secondary transition-colors">
                  Torne-se um agora
                </a>
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Footer simples */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-400">
           &copy; {new Date().getFullYear()} Tirvu. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default Login;
