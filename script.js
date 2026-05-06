// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let servicesData = null;

// ========== БЕЗОПАСНАЯ РАБОТА С LOCALSTORAGE ==========
function safeGetSubmissions() {
    try {
        const rawData = localStorage.getItem('formSubmissions');
        if (!rawData) {
            return [];
        }
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch (e) {
        console.error('Ошибка чтения formSubmissions:', e);
        return [];
    }
}

function safeSetSubmissions(submissions) {
    try {
        localStorage.setItem('formSubmissions', JSON.stringify(submissions));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения formSubmissions:', e);
        return false;
    }
}

// ========== ЗАГРУЗКА КАТАЛОГА ИЗ JSON ==========
async function loadCatalog() {
    try {
        const response = await fetch('data/services.json');
        
        if (!response.ok) {
            throw new Error('Файл services.json не найден!');
        }
        
        servicesData = await response.json();
        
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid && servicesData.categories) {
            categoriesGrid.innerHTML = '';
            
            const categoryImages = {
                'polygraphy': 'img/broshura.jpg',
                'souvenirs': 'img/suvenir.jpg',
                'design': 'img/design.jpg'
            };
            
            for (let i = 0; i < servicesData.categories.length; i++) {
                const cat = servicesData.categories[i];
                const card = document.createElement('div');
                card.className = 'catalog-card';
                card.setAttribute('data-category-id', cat.id);
                card.setAttribute('data-category-index', i);
                
                let categoryImage = categoryImages[cat.id];
                if (!categoryImage) {
                    categoryImage = 'img/placeholder.jpg';
                }
                
                let priceText = 'от 500 ₽';
                if (cat.services && cat.services[0] && cat.services[0].price) {
                    priceText = cat.services[0].price;
                }
                
                let iconClass = cat.icon || 'fa-book';
                let catName = cat.name || 'Услуга';
                let catDesc = cat.description || 'Описание услуги';
                let servicesCount = cat.services ? cat.services.length : 0;
                
                card.innerHTML = `
                    <div class="catalog-card-image">
                        <img src="${categoryImage}" alt="${escapeHtml(catName)}" class="catalog-img" onerror="this.style.display='none'">
                        <div class="catalog-card-overlay">
                            <span class="catalog-badge">${escapeHtml(priceText)}</span>
                        </div>
                    </div>
                    <div class="catalog-card-content">
                        <div class="catalog-header">
                            <i class="fas ${iconClass} catalog-icon"></i>
                            <h3>${escapeHtml(catName)}</h3>
                        </div>
                        <p>${escapeHtml(catDesc)}</p>
                        <div class="catalog-features">
                            <span><i class="fas fa-check"></i> ${servicesCount} услуг</span>
                            <span><i class="fas fa-check"></i> Индивидуально</span>
                        </div>
                        <button class="catalog-link view-services-btn" data-category-index="${i}">
                            Смотреть услуги
                        </button>
                    </div>
                `;
                
                categoriesGrid.appendChild(card);
            }
        }
        
        const buttons = document.querySelectorAll('.view-services-btn');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function(e) {
                const categoryIndex = this.getAttribute('data-category-index');
                if (servicesData && servicesData.categories && servicesData.categories[categoryIndex]) {
                    showServicesModal(servicesData.categories[categoryIndex]);
                } else {
                    showNotification('Ошибка загрузки услуг', 'error');
                }
            });
        }
        
        console.log('Каталог загружен успешно');
        
    } catch (error) {
        console.error('Ошибка загрузки каталога:', error);
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = `
                <div class="catalog-card" style="grid-column: span 3; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e55f7a; margin-bottom: 20px;"></i>
                    <h3>Не удалось загрузить каталог</h3>
                    <p>Проверьте: папка data и файл services.json</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">Обновить</button>
                </div>
            `;
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showServicesModal(category) {
    const modal = document.getElementById('servicesModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalList = document.getElementById('modalServicesList');
    
    if (!modal || !modalTitle || !modalList) return;
    
    let iconClass = category.icon || 'fa-book';
    let catName = category.name || 'Услуги';
    modalTitle.innerHTML = `<i class="fas ${iconClass}"></i> ${escapeHtml(catName)}`;
    modalList.innerHTML = '';
    
    if (category.services && category.services.length > 0) {
        for (let i = 0; i < category.services.length; i++) {
            const service = category.services[i];
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.innerHTML = `
                <div class="service-info">
                    <h4>${escapeHtml(service.name)}</h4>
                    <p>${escapeHtml(service.description)}</p>
                    <span class="service-price">${escapeHtml(service.price)}</span>
                </div>
                <button class="btn-order-service" data-service="${escapeHtml(service.name)}">
                    Заказать <i class="fas fa-shopping-cart"></i>
                </button>
            `;
            modalList.appendChild(serviceItem);
        }
    }
    
    modal.style.display = 'flex';
    
    const orderButtons = document.querySelectorAll('.btn-order-service');
    for (let i = 0; i < orderButtons.length; i++) {
        orderButtons[i].addEventListener('click', function() {
            const serviceName = this.getAttribute('data-service');
            const serviceSelect = document.getElementById('service');
            if (serviceSelect) {
                let found = false;
                for (let j = 0; j < serviceSelect.options.length; j++) {
                    if (serviceSelect.options[j].value === serviceName || 
                        serviceSelect.options[j].text === serviceName) {
                        serviceSelect.selectedIndex = j;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = serviceName;
                    option.text = serviceName;
                    serviceSelect.appendChild(option);
                    serviceSelect.value = serviceName;
                }
            }
            modal.style.display = 'none';
            const orderSection = document.getElementById('order');
            if (orderSection) {
                orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showNotification('Вы выбрали: ' + serviceName, 'success');
        });
    }
}

function searchServices(query) {
    if (!servicesData || !servicesData.categories) return [];
    if (!query || !query.trim()) return [];
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (let i = 0; i < servicesData.categories.length; i++) {
        const category = servicesData.categories[i];
        if (category.services) {
            for (let j = 0; j < category.services.length; j++) {
                const service = category.services[j];
                const serviceName = service.name || '';
                const serviceDesc = service.description || '';
                if (serviceName.toLowerCase().indexOf(lowerQuery) !== -1 || 
                    serviceDesc.toLowerCase().indexOf(lowerQuery) !== -1) {
                    results.push({
                        ...service,
                        categoryName: category.name
                    });
                }
            }
        }
    }
    
    return results;
}

function showSearchModal(query) {
    const results = searchServices(query);
    const modal = document.getElementById('searchModal');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!modal || !resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="service-item">
                <div class="service-info">
                    <h4>Ничего не найдено</h4>
                    <p>Попробуйте другое слово для поиска</p>
                </div>
            </div>`;
    } else {
        for (let i = 0; i < results.length; i++) {
            const service = results[i];
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.innerHTML = `
                <div class="service-info">
                    <h4>${escapeHtml(service.name)}</h4>
                    <p><small>${escapeHtml(service.categoryName)}</small> — ${escapeHtml(service.description)}</p>
                    <span class="service-price">${escapeHtml(service.price)}</span>
                </div>
                <button class="btn-order-service" data-service="${escapeHtml(service.name)}">
                    Заказать <i class="fas fa-shopping-cart"></i>
                </button>
            `;
            resultsContainer.appendChild(serviceItem);
        }
    }
    
    modal.style.display = 'flex';
    
    const orderButtons = document.querySelectorAll('#searchModal .btn-order-service');
    for (let i = 0; i < orderButtons.length; i++) {
        orderButtons[i].addEventListener('click', function() {
            const serviceName = this.getAttribute('data-service');
            const serviceSelect = document.getElementById('service');
            if (serviceSelect) {
                let found = false;
                for (let j = 0; j < serviceSelect.options.length; j++) {
                    if (serviceSelect.options[j].value === serviceName || 
                        serviceSelect.options[j].text === serviceName) {
                        serviceSelect.selectedIndex = j;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = serviceName;
                    option.text = serviceName;
                    serviceSelect.appendChild(option);
                    serviceSelect.value = serviceName;
                }
            }
            modal.style.display = 'none';
            const orderSection = document.getElementById('order');
            if (orderSection) {
                orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showNotification('Вы выбрали: ' + serviceName, 'success');
        });
    }
}

function initFormSubmit() {
    const form = document.getElementById('orderForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const contactInput = document.getElementById('contact');
            const serviceSelect = document.getElementById('service');
            const messageText = document.getElementById('message');
            
            const name = nameInput ? nameInput.value.trim() : '';
            const contact = contactInput ? contactInput.value.trim() : '';
            const service = serviceSelect ? serviceSelect.value : '';
            const message = messageText ? messageText.value : '';
            
            if (!name || !contact) {
                showNotification('Пожалуйста, заполните имя и контактные данные', 'error');
                return;
            }
            
            const formData = {
                id: Date.now(),
                name: name,
                contact: contact,
                service: service,
                message: message || 'не указано',
                date: new Date().toLocaleString('ru-RU')
            };
            
            let submissions = safeGetSubmissions();
            submissions.push(formData);
            safeSetSubmissions(submissions);
            
            console.log('Заявка сохранена:', formData);
            
            showNotification('Заявка отправлена! Мы свяжемся с вами.', 'success');
            form.reset();
            updateAdminStats();
        });
    }
}

const ADMIN_CREDENTIALS = {
    login: 'admin',
    password: 'samrau2026'
};

function checkAdminLogin() {
    const loginInput = document.getElementById('adminLogin');
    const passwordInput = document.getElementById('adminPassword');
    
    const login = loginInput ? loginInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    
    if (login === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
        const loginForm = document.getElementById('adminLoginForm');
        const panel = document.getElementById('adminPanel');
        if (loginForm) loginForm.style.display = 'none';
        if (panel) panel.style.display = 'block';
        updateAdminStats();
        showNotification('Вход выполнен', 'success');
    } else {
        showNotification('Неверный логин или пароль', 'error');
    }
}

function updateAdminStats() {
    const submissions = safeGetSubmissions();
    
    const statsDiv = document.getElementById('adminStats');
    const listDiv = document.getElementById('adminSubmissionsList');
    
    if (statsDiv) {
        let uniqueContacts = 0;
        if (submissions.length > 0) {
            const contactsSet = new Set();
            for (let i = 0; i < submissions.length; i++) {
                contactsSet.add(submissions[i].contact);
            }
            uniqueContacts = contactsSet.size;
        }
        
        let lastDate = 'нет';
        if (submissions.length > 0 && submissions[submissions.length-1] && submissions[submissions.length-1].date) {
            lastDate = submissions[submissions.length-1].date;
        }
        
        statsDiv.innerHTML = `
            <p><strong>Всего заявок:</strong> ${submissions.length}</p>
            <p><strong>Уникальных клиентов:</strong> ${uniqueContacts}</p>
            <p><strong>Последняя заявка:</strong> ${lastDate}</p>
        `;
    }
    
    if (listDiv) {
        if (submissions.length === 0) {
            listDiv.innerHTML = '<p>Пока нет заявок</p>';
        } else {
            listDiv.innerHTML = '';
            const reversed = [...submissions].reverse();
            for (let i = 0; i < reversed.length; i++) {
                const sub = reversed[i];
                const item = document.createElement('div');
                item.className = 'submission-item';
                item.innerHTML = `
                    <p><strong>Заявка #${sub.id}</strong> | ${sub.date}</p>
                    <p><strong>Имя:</strong> ${escapeHtml(sub.name)}</p>
                    <p><strong>Контакт:</strong> ${escapeHtml(sub.contact)}</p>
                    <p><strong>Услуга:</strong> ${escapeHtml(sub.service)}</p>
                    <p><strong>Сообщение:</strong> ${escapeHtml(sub.message)}</p>
                `;
                listDiv.appendChild(item);
            }
        }
    }
}

function logoutAdmin() {
    const loginForm = document.getElementById('adminLoginForm');
    const panel = document.getElementById('adminPanel');
    const loginInput = document.getElementById('adminLogin');
    const passwordInput = document.getElementById('adminPassword');
    
    if (loginForm) loginForm.style.display = 'block';
    if (panel) panel.style.display = 'none';
    if (loginInput) loginInput.value = '';
    if (passwordInput) passwordInput.value = '';
    showNotification('Вы вышли из админ-панели', 'info');
}

function showNotification(message, type = 'info') {
    const oldNotifications = document.querySelectorAll('.notification');
    for (let i = 0; i < oldNotifications.length; i++) {
        oldNotifications[i].remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    notification.innerHTML = '<i class="fas ' + iconClass + '"></i><span>' + escapeHtml(message) + '</span>';
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.classList.add('show');
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }, 10);
}

function initFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    for (let i = 0; i < faqItems.length; i++) {
        const item = faqItems[i];
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                for (let j = 0; j < faqItems.length; j++) {
                    faqItems[j].classList.remove('active');
                }
                if (!isActive) item.classList.add('active');
            });
        }
    }
}

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    let currentSlide = 0;
    
    if (slides.length === 0) return;
    
    function showSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        for (let i = 0; i < slides.length; i++) {
            slides[i].classList.remove('active');
        }
        for (let i = 0; i < dots.length; i++) {
            dots[i].classList.remove('active-dot');
        }
        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active-dot');
        currentSlide = index;
    }
    
    if (prevArrow) {
        prevArrow.addEventListener('click', function() {
            showSlide(currentSlide - 1);
        });
    }
    if (nextArrow) {
        nextArrow.addEventListener('click', function() {
            showSlide(currentSlide + 1);
        });
    }
    for (let i = 0; i < dots.length; i++) {
        dots[i].addEventListener('click', function() {
            showSlide(i);
        });
    }
    
    setInterval(function() {
        showSlide(currentSlide + 1);
    }, 5000);
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    function performSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim();
        if (query.length > 0) {
            showSearchModal(query);
        } else {
            showNotification('Введите текст для поиска', 'info');
        }
    }
    
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
}

function initModals() {
    const closeBtns = document.querySelectorAll('.modal-close');
    const modals = document.querySelectorAll('.modal');
    
    for (let i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener('click', function() {
            for (let j = 0; j < modals.length; j++) {
                modals[j].style.display = 'none';
            }
        });
    }
    
    window.addEventListener('click', function(e) {
        for (let i = 0; i < modals.length; i++) {
            if (e.target === modals[i]) {
                modals[i].style.display = 'none';
            }
        }
    });
}

let adminKeyCount = 0;
let adminTimer = null;
let adminACount = 0;
let adminATimer = null;

function initSecretAdmin() {
    document.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();
        
        const expectedSequence = ['a', 'd', 'm', 'i', 'n'];
        
        if (key === expectedSequence[adminKeyCount]) {
            adminKeyCount++;
            if (adminKeyCount === expectedSequence.length) {
                adminKeyCount = 0;
                const adminModal = document.getElementById('adminModal');
                if (adminModal) adminModal.style.display = 'flex';
                showNotification('Режим администратора', 'info');
            }
            if (adminTimer) clearTimeout(adminTimer);
            adminTimer = setTimeout(function() {
                adminKeyCount = 0;
            }, 2000);
        } else if (key !== expectedSequence[0]) {
            adminKeyCount = 0;
        }
        
        if (key === 'a') {
            adminACount++;
            if (adminATimer) clearTimeout(adminATimer);
            if (adminACount >= 3) {
                adminACount = 0;
                const adminModal = document.getElementById('adminModal');
                if (adminModal) adminModal.style.display = 'flex';
                showNotification('Режим администратора', 'info');
            }
            adminATimer = setTimeout(function() {
                adminACount = 0;
            }, 800);
        } else if (key !== 'a') {
            adminACount = 0;
        }
    });
    
    if (window.location.hash === '#admin2026') {
        const adminModal = document.getElementById('adminModal');
        if (adminModal) adminModal.style.display = 'flex';
        window.location.hash = '';
    }
}

function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    for (let i = 0; i < links.length; i++) {
        const anchor = links[i];
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#admin') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

// ========== ПОРТФОЛИО СЛАЙДЕР (ГАРАНТИРОВАННО РАБОТАЕТ) ==========
let portfolioCurrentIndex = 0;
let portfolioSlidesPerView = 4;
let portfolioTotalSlides = 0;
let portfolioSlideWidth = 0;
let portfolioSliderTrack = null;
let portfolioGap = 25;

function initPortfolioSlider() {
    console.log('Запуск слайдера портфолио...');
    
    portfolioSliderTrack = document.getElementById('portfolioSliderTrack');
    const prevBtn = document.getElementById('prevPortfolioBtn');
    const nextBtn = document.getElementById('nextPortfolioBtn');
    const dotsContainer = document.getElementById('portfolioDots');
    
    if (!portfolioSliderTrack) {
        console.log('Ошибка: слайдер портфолио не найден');
        return;
    }
    
    const slides = document.querySelectorAll('.portfolio-slide');
    portfolioTotalSlides = slides.length;
    
    if (portfolioTotalSlides === 0) {
        console.log('Ошибка: нет слайдов в портфолио');
        return;
    }
    
    console.log('Найдено слайдов: ' + portfolioTotalSlides);
    
    function updateSlidesPerView() {
        const windowWidth = window.innerWidth;
        if (windowWidth <= 600) {
            portfolioSlidesPerView = 1;
        } else if (windowWidth <= 900) {
            portfolioSlidesPerView = 2;
        } else if (windowWidth <= 1200) {
            portfolioSlidesPerView = 3;
        } else {
            portfolioSlidesPerView = 4;
        }
        return portfolioSlidesPerView;
    }
    
    function updateSlideWidth() {
        const wrapper = document.querySelector('.portfolio-slider-wrapper');
        if (!wrapper) return;
        
        const wrapperWidth = wrapper.clientWidth;
        portfolioSlideWidth = (wrapperWidth - (portfolioGap * (portfolioSlidesPerView - 1))) / portfolioSlidesPerView;
        
        const slidesList = document.querySelectorAll('.portfolio-slide');
        for (let i = 0; i < slidesList.length; i++) {
            slidesList[i].style.width = portfolioSlideWidth + 'px';
        }
        
        return portfolioSlideWidth;
    }
    
    function updateSliderPosition() {
        if (!portfolioSliderTrack) return;
        const shift = portfolioCurrentIndex * (portfolioSlideWidth + portfolioGap);
        portfolioSliderTrack.style.transform = 'translateX(-' + shift + 'px)';
        updateDots();
    }
    
    function createDots() {
        if (!dotsContainer) return;
        
        const dotsCount = Math.ceil(portfolioTotalSlides / portfolioSlidesPerView);
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('portfolio-dot');
            if (i === 0) dot.classList.add('active');
            
            dot.addEventListener('click', (function(index) {
                return function() {
                    portfolioCurrentIndex = index * portfolioSlidesPerView;
                    const maxIndex = portfolioTotalSlides - portfolioSlidesPerView;
                    if (portfolioCurrentIndex > maxIndex) portfolioCurrentIndex = maxIndex;
                    if (portfolioCurrentIndex < 0) portfolioCurrentIndex = 0;
                    updateSliderPosition();
                };
            })(i));
            
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateDots() {
        const dots = document.querySelectorAll('.portfolio-dot');
        const activeIndex = Math.floor(portfolioCurrentIndex / portfolioSlidesPerView);
        for (let i = 0; i < dots.length; i++) {
            if (i === activeIndex) {
                dots[i].classList.add('active');
            } else {
                dots[i].classList.remove('active');
            }
        }
    }
    
    function nextSlide() {
        console.log('Следующий слайд');
        const maxSlide = portfolioTotalSlides - portfolioSlidesPerView;
        if (portfolioCurrentIndex + portfolioSlidesPerView < portfolioTotalSlides) {
            portfolioCurrentIndex = portfolioCurrentIndex + portfolioSlidesPerView;
        } else {
            portfolioCurrentIndex = maxSlide;
        }
        if (portfolioCurrentIndex < 0) portfolioCurrentIndex = 0;
        updateSliderPosition();
    }
    
    function prevSlide() {
        console.log('Предыдущий слайд');
        if (portfolioCurrentIndex - portfolioSlidesPerView >= 0) {
            portfolioCurrentIndex = portfolioCurrentIndex - portfolioSlidesPerView;
        } else {
            portfolioCurrentIndex = 0;
        }
        updateSliderPosition();
    }
    
    function handleResize() {
        console.log('Изменение размера окна');
        updateSlidesPerView();
        updateSlideWidth();
        
        portfolioCurrentIndex = 0;
        updateSliderPosition();
        
        createDots();
    }
    
    updateSlidesPerView();
    updateSlideWidth();
    createDots();
    updateSliderPosition();
    
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    window.addEventListener('resize', handleResize);
    
    console.log('Слайдер портфолио запущен успешно!');
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт загружается...');
    
    loadCatalog();
    initSlider();
    initFaq();
    initFormSubmit();
    initSearch();
    initModals();
    initSecretAdmin();
    initSmoothScroll();
    
    const testData = safeGetSubmissions();
    if (testData.length === 0) {
        safeSetSubmissions([]);
    }
    
    console.log('Сайт готов к работе');
    console.log('Для входа в админ-панель: нажмите A, D, M, I, N последовательно или A 3 раза подряд');
});

// Запускаем слайдер портфолио после полной загрузки
window.addEventListener('load', function() {
    setTimeout(function() {
        initPortfolioSlider();
    }, 300);
});