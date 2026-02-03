export const maskCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNPJ = (value) => {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value) => {
  value = value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  
  return value
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

export const maskCurrency = (value) => {
  value = value.replace(/\D/g, '');
  value = (value / 100).toFixed(2) + '';
  value = value.replace('.', ',');
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return 'R$ ' + value;
};
