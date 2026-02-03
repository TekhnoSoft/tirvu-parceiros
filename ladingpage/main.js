document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = mobileMenu.querySelectorAll('a');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        if (mobileMenu.classList.contains('hidden')) {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        } else {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        }
    });

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        });
    });


    // --- FAQ Accordion ---
    const faqButtons = document.querySelectorAll('.faq-btn');

    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const icon = button.querySelector('i');

            // Close other open FAQs
            faqButtons.forEach(otherBtn => {
                if (otherBtn !== button) {
                    otherBtn.nextElementSibling.classList.add('hidden');
                    otherBtn.querySelector('i').classList.remove('rotate-180');
                }
            });

            // Toggle current
            content.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
        });
    });


    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    });


    // --- Calculator Logic ---
    const monthlyPriceInput = document.getElementById('monthly-price');
    const salesCountInput = document.getElementById('sales-count');
    const commissionRateInput = document.getElementById('commission-rate');
    const gainPerSaleEl = document.getElementById('gain-per-sale');
    const gainTotalEl = document.getElementById('gain-total');
    const scenarioTabs = document.querySelectorAll('.calc-tab');

    const scenarios = {
        conservador: { price: 250, sales: 2 },
        realista: { price: 500, sales: 5 },
        agressivo: { price: 1000, sales: 10 }
    };

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    function parseCurrency(str) {
        if (typeof str === 'number') return str;
        // Remove everything that is not a digit
        const digits = str.replace(/\D/g, '');
        // Divide by 100 to get decimal value (ATM style)
        return parseFloat(digits) / 100;
    }

    function calculate() {
        // Parse currency from the formatted string
        const price = parseCurrency(monthlyPriceInput.value) || 0;
        const sales = parseFloat(salesCountInput.value) || 0;
        const commission = parseFloat(commissionRateInput.value) || 0;

        const gainPerSale = price * (commission / 100);
        const gainTotal = gainPerSale * sales;

        gainPerSaleEl.textContent = formatCurrency(gainPerSale);
        gainTotalEl.textContent = formatCurrency(gainTotal);
    }

    // Input listeners
    monthlyPriceInput.addEventListener('input', (e) => {
        const value = e.target.value;
        // Handle empty or invalid input
        if (!value) {
            e.target.value = formatCurrency(0);
        } else {
            // Apply mask
            const number = parseCurrency(value);
            e.target.value = formatCurrency(number);
        }
        calculate();
    });

    [salesCountInput, commissionRateInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculate);
        }
    });

    // Tab listeners
    scenarioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            scenarioTabs.forEach(t => {
                t.classList.remove('bg-white', 'text-primary', 'shadow-sm', 'ring-1', 'ring-gray-200');
                t.classList.add('text-gray-500', 'hover:text-gray-900');
            });
            tab.classList.remove('text-gray-500', 'hover:text-gray-900');
            tab.classList.add('bg-white', 'text-primary', 'shadow-sm', 'ring-1', 'ring-gray-200');

            // Apply scenario values
            const scenario = scenarios[tab.dataset.scenario];
            if (scenario) {
                monthlyPriceInput.value = formatCurrency(scenario.price);
                salesCountInput.value = scenario.sales;
                // Trigger calculation animation (optional visual feedback)
                calculate();
            }
        });
    });

    // Initial calculation
    if (monthlyPriceInput) calculate();


    // --- WhatsApp Mask ---
    const phoneInput = document.getElementById('phone');
    
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
        } else {
            value = value.replace(/^(\d*)/, '($1');
        }
        
        e.target.value = value;
    });

    // --- Form Submission (Simulation) ---
    const form = document.getElementById('partner-form');
    
    // IBGE API Integration
    const ufSelect = document.getElementById('uf');
    const citySelect = document.getElementById('city');

    // Fetch States (UF)
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(response => response.json())
        .then(states => {
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.sigla;
                option.textContent = state.sigla;
                ufSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar estados:', error));

    // Handle State Selection
    ufSelect.addEventListener('change', (e) => {
        const selectedUf = e.target.value;
        
        // Reset and disable city select while loading
        citySelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
        citySelect.disabled = true;

        if (selectedUf) {
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`)
                .then(response => response.json())
                .then(cities => {
                    // Clear loading message
                    citySelect.innerHTML = '<option value="" disabled selected>Selecione a Cidade</option>';
                    
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.nome;
                        option.textContent = city.nome;
                        citySelect.appendChild(option);
                    });
                    
                    citySelect.disabled = false;
                })
                .catch(error => {
                    console.error('Erro ao carregar cidades:', error);
                    citySelect.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
                });
        } else {
             citySelect.innerHTML = '<option value="" disabled selected>Selecione o Estado primeiro</option>';
             citySelect.disabled = true;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        
        // Loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
        
        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            uf: document.getElementById('uf').value,
            city: document.getElementById('city').value
        };

        try {
            const response = await fetch('http://localhost:5000/api/public/partners/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Cadastro Enviado!';
                btn.classList.remove('bg-primary', 'hover:bg-secondary');
                btn.classList.add('bg-green-500', 'hover:bg-green-600');
                
                Toastify({
                    text: "Parabéns! Seu cadastro foi recebido com sucesso. Nossa equipe entrará em contato em breve.",
                    duration: 5000,
                    gravity: "top", // `top` or `bottom`
                    position: "center", // `left`, `center` or `right`
                    style: {
                        background: "linear-gradient(to right, #00b09b, #96c93d)",
                    },
                }).showToast();

                form.reset();
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    btn.classList.add('bg-primary', 'hover:bg-secondary');
                    btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                }, 3000);
            } else {
                Toastify({
                    text: 'Erro ao cadastrar: ' + (result.message || 'Erro desconhecido'),
                    duration: 4000,
                    gravity: "top",
                    position: "center",
                    style: {
                        background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                    },
                }).showToast();
                
                btn.disabled = false;
                btn.innerText = originalText;
            }
        } catch (error) {
            console.error('Erro:', error);
            Toastify({
                text: "Erro ao conectar com o servidor.",
                duration: 4000,
                gravity: "top",
                position: "center",
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                },
            }).showToast();
            
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    // --- Smooth Scroll for Anchor Links (Optional fix for fixed header offset) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80; // Height of fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

});
