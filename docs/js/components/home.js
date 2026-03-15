// Home component - Landing Page
window.router.register('home', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    return `
        <div class="landing-page">
            <section class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">${t('home.title')}</h1>
                    <p class="hero-subtitle">${t('home.subtitle')}</p>
                    <p class="hero-description">${t('home.description')}</p>
                    <div class="hero-buttons">
                        ${window.auth.isLoggedIn() 
                            ? `<a href="#" data-page="tasks" class="btn btn-primary btn-large">${t('home.goToTasks')}</a>`
                            : `<button onclick="document.getElementById('registerModal').classList.add('active')" class="btn btn-primary btn-large">${t('home.getStarted')}</button>
                               <button onclick="window.auth.openLoginModal()" class="btn btn-outline btn-large">${t('nav.login')}</button>`
                        }
                    </div>
                </div>
            </section>
            <section class="features-section">
                <div class="container">
                    <h2 class="section-title">${t('home.featuresTitle')}</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">👥</div>
                            <h3>${t('home.feature1Title')}</h3>
                            <p>${t('home.feature1Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">⭐</div>
                            <h3>${t('home.feature2Title')}</h3>
                            <p>${t('home.feature2Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💼</div>
                            <h3>${t('home.feature3Title')}</h3>
                            <p>${t('home.feature3Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔒</div>
                            <h3>${t('home.feature4Title')}</h3>
                            <p>${t('home.feature4Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💬</div>
                            <h3>${t('home.feature5Title')}</h3>
                            <p>${t('home.feature5Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>${t('home.feature6Title')}</h3>
                            <p>${t('home.feature6Text')}</p>
                        </div>
                    </div>
                </div>
            </section>
            <section class="how-it-works-section">
                <div class="container">
                    <h2 class="section-title">${t('home.howTitle')}</h2>
                    <div class="steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <h3>${t('home.step1')}</h3>
                            <p>${t('home.step1Text')}</p>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <h3>${t('home.step2')}</h3>
                            <p>${t('home.step2Text')}</p>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <h3>${t('home.step3')}</h3>
                            <p>${t('home.step3Text')}</p>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <h3>${t('home.step4')}</h3>
                            <p>${t('home.step4Text')}</p>
                        </div>
                    </div>
                </div>
            </section>
            <section class="cta-section">
                <div class="container">
                    <h2>${t('home.ctaTitle')}</h2>
                    <p>${t('home.ctaText')}</p>
                    ${window.auth.isLoggedIn() 
                        ? `<a href="#" data-page="tasks" class="btn btn-primary btn-large">${t('home.goToTasks')}</a>`
                        : `<button onclick="document.getElementById('registerModal').classList.add('active')" class="btn btn-primary btn-large">${t('auth.registerBtn')}</button>`
                    }
                </div>
            </section>
            <footer class="landing-footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h4>Open-Lance</h4>
                            <p>${t('home.footerMarketplace')}</p>
                        </div>
                        <div class="footer-section">
                            <h4>${t('home.footerAuthor')}</h4>
                            <p>Dronov Dmitry</p>
                            <a href="https://t.me/DmitryDronovBIM" target="_blank" rel="noopener noreferrer" class="footer-link">
                                <span style="margin-right: 5px;">📱</span>${t('home.telegramChannel')}
                            </a>
                        </div>
                        <div class="footer-section">
                            <h4>${t('home.footerPlatform')}</h4>
                            <p>${t('home.footerVersion')}</p>
                            <p>${t('home.footerTech')}</p>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; ${new Date().getFullYear()} Open-Lance. ${t('home.footerDeveloped')} <a href="https://t.me/DmitryDronovBIM" target="_blank" rel="noopener noreferrer">Dronov Dmitry</a></p>
                    </div>
                </div>
            </footer>
        </div>
    `;
});
