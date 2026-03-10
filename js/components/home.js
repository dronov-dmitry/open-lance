// Home component - Landing Page
window.router.register('home', async function() {
    return `
        <div class="landing-page">
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">Open-Lance</h1>
                    <p class="hero-subtitle">Платформа для прямого взаимодействия заказчиков и фрилансеров</p>
                    <p class="hero-description">
                        Единый профиль для всех: каждый пользователь может создавать задачи и откликаться на них. 
                        Прямое взаимодействие между заказчиками и исполнителями.
                    </p>
                    <div class="hero-buttons">
                        ${window.auth.isLoggedIn() 
                            ? `<a href="#" data-page="tasks" class="btn btn-primary btn-large">Перейти к задачам</a>`
                            : `<button onclick="document.getElementById('registerModal').classList.add('active')" class="btn btn-primary btn-large">Начать работу</button>
                               <button onclick="window.auth.openLoginModal()" class="btn btn-outline btn-large">Войти</button>`
                        }
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section class="features-section">
                <div class="container">
                    <h2 class="section-title">Возможности платформы</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">👥</div>
                            <h3>Единый профиль</h3>
                            <p>Один аккаунт для всех: создавайте задачи как заказчик или откликайтесь как исполнитель</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">⭐</div>
                            <h3>Система репутации</h3>
                            <p>Два независимых рейтинга: как заказчик и как исполнитель для честной оценки</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💼</div>
                            <h3>Управление задачами</h3>
                            <p>Полный цикл: публикация → отклики → выбор исполнителя → завершение → отзывы</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔒</div>
                            <h3>Безопасность</h3>
                            <p>Контакты открываются только после подтверждения "Мэтча" между заказчиком и исполнителем</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💬</div>
                            <h3>Встроенные сообщения</h3>
                            <p>Прямое общение между участниками прямо на платформе</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>Прозрачность</h3>
                            <p>Публичные профили с историей выполненных задач и отзывами</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- How It Works Section -->
            <section class="how-it-works-section">
                <div class="container">
                    <h2 class="section-title">Как это работает</h2>
                    <div class="steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <h3>Регистрация</h3>
                            <p>Создайте аккаунт и заполните профиль</p>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <h3>Создание или поиск</h3>
                            <p>Опубликуйте задачу или найдите подходящую</p>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <h3>Взаимодействие</h3>
                            <p>Общайтесь, договаривайтесь об условиях</p>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <h3>Выполнение</h3>
                            <p>Работайте и получайте отзывы</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section class="cta-section">
                <div class="container">
                    <h2>Готовы начать?</h2>
                    <p>Присоединяйтесь к сообществу фрилансеров и заказчиков</p>
                    ${window.auth.isLoggedIn() 
                        ? `<a href="#" data-page="tasks" class="btn btn-primary btn-large">Перейти к задачам</a>`
                        : `<button onclick="document.getElementById('registerModal').classList.add('active')" class="btn btn-primary btn-large">Зарегистрироваться</button>`
                    }
                </div>
            </section>

            <!-- Footer -->
            <footer class="landing-footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h4>Open-Lance</h4>
                            <p>Маркетплейс для фрилансеров и заказчиков</p>
                        </div>
                        <div class="footer-section">
                            <h4>Автор</h4>
                            <p>Dronov Dmitry</p>
                            <a href="https://t.me/DmitryDronovBIM" target="_blank" rel="noopener noreferrer" class="footer-link">
                                <span style="margin-right: 5px;">📱</span>Telegram канал
                            </a>
                        </div>
                        <div class="footer-section">
                            <h4>Платформа</h4>
                            <p>Версия 3.0</p>
                            <p>Cloudflare Workers + MongoDB Atlas</p>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; ${new Date().getFullYear()} Open-Lance. Разработано <a href="https://t.me/DmitryDronovBIM" target="_blank" rel="noopener noreferrer">Dronov Dmitry</a></p>
                    </div>
                </div>
            </footer>
        </div>
    `;
});
