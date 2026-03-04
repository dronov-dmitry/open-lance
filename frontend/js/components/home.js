// Home page component
async function renderHomePage() {
    return `
        <div class="home-page">
            <section class="hero">
                <div class="card">
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">
                        Добро пожаловать в Open-Lance
                    </h1>
                    <p style="font-size: 1.2rem; color: #7f8c8d; margin-bottom: 2rem;">
                        P2P платформа для заказчиков и исполнителей. 
                        Создавайте задачи, находите исполнителей, обменивайтесь контактами напрямую.
                    </p>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <a href="#" data-page="tasks" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem;">
                            Посмотреть задачи
                        </a>
                        ${!window.auth.isLoggedIn() ? `
                            <button onclick="document.getElementById('loginModal').classList.add('active')" 
                                    class="btn btn-secondary" style="padding: 1rem 2rem; font-size: 1.1rem;">
                                Начать работу
                            </button>
                        ` : ''}
                    </div>
                </div>
            </section>

            <section style="margin-top: 3rem;">
                <h2 style="text-align: center; margin-bottom: 2rem; font-size: 2rem;">
                    Как это работает
                </h2>
                <div class="grid grid-3">
                    <div class="card" style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                        <h3 style="margin-bottom: 1rem;">Создайте задачу</h3>
                        <p style="color: #7f8c8d;">
                            Опишите, что вам нужно, укажите бюджет и срок выполнения
                        </p>
                    </div>
                    <div class="card" style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                        <h3 style="margin-bottom: 1rem;">Получите отклики</h3>
                        <p style="color: #7f8c8d;">
                            Исполнители оставят свои предложения, выберите подходящего
                        </p>
                    </div>
                    <div class="card" style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🤝</div>
                        <h3 style="margin-bottom: 1rem;">Обменяйтесь контактами</h3>
                        <p style="color: #7f8c8d;">
                            После мэтчинга получите доступ к контактам для обсуждения деталей
                        </p>
                    </div>
                </div>
            </section>

            <section style="margin-top: 3rem;">
                <div class="card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white;">
                    <h2 style="margin-bottom: 1rem; font-size: 2rem;">
                        Преимущества платформы
                    </h2>
                    <div class="grid grid-2" style="gap: 2rem;">
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">🔒 Безопасность</h3>
                            <p style="opacity: 0.9;">
                                Ваши данные защищены. Контакты раскрываются только после мэтчинга.
                            </p>
                        </div>
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">💰 Без комиссии</h3>
                            <p style="opacity: 0.9;">
                                P2P оплата напрямую между заказчиком и исполнителем.
                            </p>
                        </div>
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">⭐ Рейтинги</h3>
                            <p style="opacity: 0.9;">
                                Система взаимных отзывов помогает найти надёжных партнёров.
                            </p>
                        </div>
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">🚀 Быстро</h3>
                            <p style="opacity: 0.9;">
                                Современная serverless архитектура обеспечивает высокую скорость.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section style="margin-top: 3rem; margin-bottom: 3rem;">
                <div class="card" style="text-align: center;">
                    <h2 style="margin-bottom: 1rem; font-size: 2rem;">
                        Готовы начать?
                    </h2>
                    <p style="color: #7f8c8d; margin-bottom: 2rem; font-size: 1.1rem;">
                        Присоединяйтесь к нашему сообществу заказчиков и исполнителей
                    </p>
                    <a href="#" data-page="tasks" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem;">
                        Начать работу
                    </a>
                </div>
            </section>
        </div>
    `;
}

// Register route
window.router.register('home', renderHomePage);
