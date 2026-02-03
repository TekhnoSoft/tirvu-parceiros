import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-xl text-gray-600 mb-8">Acesso não autorizado</p>
      <Link to="/" className="text-primary hover:text-secondary underline">
        Voltar para a página inicial
      </Link>
    </div>
  );
};

export default Unauthorized;
