/**
 * i18n — переключение языка интерфейса (RU, UK, DE, EN)
 */
(function() {
    const STORAGE_KEY = 'app-lang';
    const DEFAULT_LANG = 'ru';

    const translations = {
        ru: {
            nav: { home: 'Главная', tasks: 'Задачи', myTasks: 'Мои задачи', freelancers: 'Фрилансеры', messages: 'Сообщения', profile: 'Профиль', login: 'Войти', logout: 'Выйти', menu: 'Меню' },
            auth: {
                loginTitle: 'Вход в систему', email: 'Email', password: 'Пароль', loginBtn: 'Войти', noAccount: 'Нет аккаунта?', registerLink: 'Зарегистрироваться',
                registerTitle: 'Регистрация', confirmPassword: 'Подтвердите пароль', registerBtn: 'Зарегистрироваться', hasAccount: 'Уже есть аккаунт?',
                emailNotVerified: 'Email не подтвержден', resendVerifyText: 'Email не подтвержден. Нажмите кнопку ниже, чтобы отправить письмо для подтверждения email повторно.',
                resendBtn: 'Отправить письмо повторно', userExistsResend: 'Пользователь с таким email уже существует. Возможно, email не был подтвержден. Нажмите кнопку ниже, чтобы отправить письмо повторно.',
                loggingIn: 'Входим...', registerSuccess: 'Регистрация успешна! Письмо для подтверждения email отправлено на вашу почту. Проверьте почту и перейдите по ссылке для подтверждения.',
                loginSuccess: 'Вы успешно вошли в систему!', confirmLogout: 'Вы уверены, что хотите выйти?',
                passMismatch: 'Пароли не совпадают', passMinLength: 'Пароль должен быть не менее 6 символов', registering: 'Регистрируем...',
                pleaseCaptcha: 'Пожалуйста, пройдите проверку (капча)', emailRequired: 'Email не указан', sending: 'Отправка...',
                resendSuccess: 'Письмо для подтверждения email отправлено. Проверьте почту.', getLinkAgain: 'Получить ссылку повторно',
                emailAlreadyVerified: 'Этот email уже подтвержден. Вы можете войти в систему.', invalidEmail: 'Неверный формат email адреса.',
                verifyError: 'Ошибка подтверждения Email. Возможно, ссылка устарела.', verifySuccess: 'Email успешно подтвержден! Теперь вы можете войти.'
            },
            home: {
                title: 'Open-Lance', subtitle: 'Платформа для прямого взаимодействия заказчиков и фрилансеров',
                description: 'Единый профиль для всех: каждый пользователь может создавать задачи и откликаться на них. Прямое взаимодействие между заказчиками и исполнителями.',
                goToTasks: 'Перейти к задачам', getStarted: 'Начать работу', featuresTitle: 'Возможности платформы',
                feature1Title: 'Единый профиль', feature1Text: 'Один аккаунт для всех: создавайте задачи как заказчик или откликайтесь как исполнитель',
                feature2Title: 'Система репутации', feature2Text: 'Два независимых рейтинга: как заказчик и как исполнитель для честной оценки',
                feature3Title: 'Управление задачами', feature3Text: 'Полный цикл: публикация → отклики → выбор исполнителя → завершение → отзывы',
                feature4Title: 'Честные отзывы', feature4Text: 'Рейтинг формируется только по реальным сделкам: отзыв можно оставить лишь после совместной работы по задаче',
                feature5Title: 'Встроенные сообщения', feature5Text: 'Прямое общение между участниками прямо на платформе',
                feature6Title: 'Прозрачность', feature6Text: 'Публичные профили с историей выполненных задач и отзывами',
                howTitle: 'Как это работает', step1: 'Регистрация', step1Text: 'Создайте аккаунт и заполните профиль',
                step2: 'Создание или поиск', step2Text: 'Опубликуйте задачу или найдите подходящую', step3: 'Взаимодействие', step3Text: 'Общайтесь, договаривайтесь об условиях',
                step4: 'Выполнение', step4Text: 'Работайте и получайте отзывы', ctaTitle: 'Готовы начать?', ctaText: 'Присоединяйтесь к сообществу фрилансеров и заказчиков',
                footerMarketplace: 'Маркетплейс для фрилансеров и заказчиков', footerAuthor: 'Автор', footerPlatform: 'Платформа', footerVersion: 'Версия 3.0',
                footerTech: 'Cloudflare Workers + MongoDB Atlas', footerDeveloped: 'Разработано', telegramChannel: 'Telegram канал'
            },
            tasks: {
                allOpen: 'Все открытые задачи', createTask: 'Создать задачу', budget: 'Бюджет', deadline: 'Срок', published: 'Опубликована', more: 'Подробнее', delete: 'Удалить',
                noTasks: 'На данный момент нет открытых задач.', noName: 'Без имени', loadList: 'Загрузка списка задач...',
                confirmDelete: 'Вы уверены, что хотите УДАЛИТЬ эту задачу?', deleted: 'Задача удалена', deleteError: 'Ошибка удаления',
                authRequired: 'Войдите в систему, чтобы просматривать список задач', loadError: 'Ошибка загрузки',
                unauthorizedTitle: 'Требуется вход в аккаунт', unauthorizedDesc: 'Список задач доступен только авторизованным пользователям.'
            },
            myTasks: {
                title: 'Мои задачи', asCustomer: 'Мои задания (как заказчик)', asWorker: 'Мои отклики (как исполнитель)',
                noCreated: 'У вас пока нет созданных задач', noApplications: 'Вы пока не откликались на задачи',
                responded: 'Откликнулись:', yourMessage: 'Ваше сообщение:', task: 'Задача', loadMy: 'Загрузка ваших задач...',
                authRequired: 'Войдите в систему, чтобы просмотреть свои задачи', loadError: 'Ошибка загрузки'
            },
            status: {
                OPEN: 'Открыта', MATCHED: 'В работе', COMPLETED: 'Завершена', CANCELLED: 'Отменена',
                PENDING: 'Ожидает решения', ACCEPTED: 'Принят', REJECTED: 'Отклонен',
                pendingReview: 'Ожидает рассмотрения', youAccepted: 'Вы приняты на выполнение задачи'
            },
            taskDetails: {
                error: 'Ошибка', taskNotFound: 'Задача не найдена или ID не указан', backToTasks: 'Вернуться к задачам',
                yourResponse: 'Ваш отклик', changeResponse: 'Изменить отклик', withdrawResponse: 'Отозвать отклик', saveChanges: 'Сохранить изменения', cancel: 'Отмена',
                applyToTask: 'Откликнуться на задачу', messageToCustomer: 'Сообщение заказчику', sendResponse: 'Отправить отклик',
                applyPlaceholder: 'Опишите ваш опыт и почему вы подходите для этой задачи...',
                selectWorker: 'Выбрать исполнителя', completeTask: 'Завершить задачу', leaveReview: 'Оставить отзыв', reviewCustomer: 'Отзыв заказчику', reviewWorker: 'Оставить отзыв исполнителю'
            },
            common: { authRequired: 'Необходима авторизация', more: 'Подробнее', unreadBadge: 'Непрочитанные сообщения' },
            toast: { error: 'Ошибка', success: 'Успешно', warning: 'Внимание', info: 'Информация' },
            router: { pageNotFound: 'Страница не найдена', loadError: 'Ошибка загрузки страницы' },
            messages: {
                authRequired: 'Войдите в систему, чтобы просматривать личные сообщения', loadMessages: 'Загрузка сообщений...',
                noInbox: 'У вас нет входящих сообщений', noSent: 'Вы еще не отправляли сообщения', markRead: 'Отметить как прочитанное', reply: 'Ответить',
                loadError: 'Ошибка загрузки сообщений', messageRead: 'Сообщение прочитано', admin: 'Админ', noName: 'Без имени',
                title: 'Личные сообщения', inbox: 'Входящие', sent: 'Отправленные', replyTitle: 'Отправить сообщение', replyPlaceholder: 'Введите ваше сообщение...', sendBtn: 'Отправить', enterText: 'Введите текст сообщения', sentSuccess: 'Сообщение отправлено'
            },
            users: {
                confirmMakeAdmin: 'Вы уверены, что хотите назначить этого пользователя администратором?', roleUpdated: 'Роль успешно обновлена',
                confirmBan: 'Вы уверены, что хотите заблокировать этого пользователя?', userBanned: 'Пользователь заблокирован',
                loginToReview: 'Войдите в систему, чтобы оставить отзыв', cannotReview: 'Вы не можете оставить отзыв этому пользователю',
                reviewTooShort: 'Отзыв слишком короткий (минимум 5 символов)', reviewSent: 'Отзыв успешно добавлен!', reviewError: 'Ошибка при отправке отзыва',
                reviewAfterAccept: 'Вы можете оставить отзыв только после принятия отклика на задачу',
                pageTitle: 'Зарегистрированные пользователи', noUsersYet: 'Пользователей пока нет.',
                more: 'Подробнее', writeMessage: 'Написать сообщение', reviewBtn: 'Отзыв', leaveReviewTitle: 'Оставить отзыв',
                reviewPlaceholder: 'Расскажите об опыте работы с пользователем...', cancel: 'Отмена', publish: 'Опубликовать',
                roleAdmin: 'Администратор', roleClient: 'Заказчик', bannedBadge: 'ЗАБЛОКИРОВАН', makeAdmin: 'Сделать админом', banUser: 'Заблокировать',
                noName: 'Без имени', ratingClientLabel: 'Рейтинг заказчика:', ratingWorkerLabel: 'Рейтинг фрилансера:', perHour: 'в час',
                specializationLabel: 'Специализация:', allSpecializations: 'Все специализации', resetFilter: 'Сбросить',
                sortBy: 'Сортировать по:', noSort: 'Без сортировки', sortRatingWorker: 'Рейтинг фрилансера', sortRatingClient: 'Рейтинг заказчика',
                sortHourlyRate: 'Стоимость в час', sortDesc: 'По убыванию', sortAsc: 'По возрастанию',
                found: 'Найдено:', userCountOne: 'пользователь', userCountFew: 'пользователя', userCountMany: 'пользователей',
                noUsersFound: 'Пользователи не найдены', noUsersBySpec: 'по выбранной специализации', tryOtherSpec: 'Попробуйте выбрать другую специализацию.',
                loadError: 'Ошибка при загрузке пользователей'
            },
            profile: {
                authToEdit: 'Войдите, чтобы просматривать и редактировать свой профиль', loading: 'Загрузка профиля...', loadError: 'Ошибка загрузки профиля',
                saving: 'Сохранение...', save: 'Сохранить', hourlyRatePositive: 'Стоимость в час должна быть положительным числом', updated: 'Профиль успешно обновлен!', updateError: 'Ошибка обновления',
                fillPasswordFields: 'Заполните все поля для смены пароля', passwordsMismatch: 'Новые пароли не совпадают', passwordMinLength: 'Новый пароль — минимум 6 символов', processing: 'Обработка...', passwordChanged: 'Пароль успешно изменен', passwordError: 'Ошибка смены пароля', changePasswordBtn: 'Изменить пароль', changePasswordTitle: 'Смена пароля',
                editTitle: 'Редактирование профиля', cancel: 'Отмена', nameLabel: 'Имя / Никнейм', namePlaceholder: 'Иван Иванов', titleLabel: 'Специальность (Заголовок)', titlePlaceholder: 'Fullstack Разработчик',
                specializationsLabel: 'Специализация', specializationsHint: 'Укажите специализации через запятую (например: JavaScript, React)', bioLabel: 'О себе', bioPlaceholder: 'Опишите навыки и опыт...',
                portfolioLabel: 'URL Портфолио (сайт/GitHub/Behance)', portfolioPlaceholder: 'https://github.com/username', telegramLabel: 'URL Telegram-канала', telegramPlaceholder: 'https://t.me/channel',
                hourlyRateLabel: 'Стоимость в час (₽)', hourlyRateHint: 'Необязательно', currencyLabel: 'Валюта отображения',
                ratingWorker: 'Рейтинг Исполнителя', ratingClient: 'Рейтинг Заказчика', perHour: 'В час',
                noName: 'Имя не указано', noTitle: 'Специальность не указана', specializationsTitle: 'Специализация', aboutTitle: 'О себе', noBio: 'Информация о себе не заполнена.',
                portfolioLink: 'Портфолио / Сайт', telegramLink: 'Telegram-канал',
                reviewsTitle: 'Отзывы', leaveReview: 'Оставить отзыв', yourReview: 'Ваш отзыв', ratingLabel: 'Оценка', commentLabel: 'Комментарий', commentPlaceholder: 'Расскажите об опыте работы...', publish: 'Опубликовать',
                noReviews: 'У этого пользователя пока нет отзывов.', reviewer: 'Пользователь', editReview: 'Редактировать', rating1to5: 'Выберите рейтинг от 1 до 5', commentTooShort: 'Комментарий слишком короткий (минимум 5 символов)', reviewUpdated: 'Отзыв обновлён', reviewSaveError: 'Ошибка при сохранении отзыва',
                editProfile: 'Редактировать профиль', writeMessage: 'Написать сообщение', newMessage: 'Новое сообщение', messagePlaceholder: 'Введите ваше сообщение...', send: 'Отправить', messageSent: 'Сообщение отправлено!', sendError: 'Ошибка при отправке',
                rating5: 'Отлично', rating4: 'Хорошо', rating3: 'Нормально', rating2: 'Плохо', rating1: 'Ужасно'
            },
            createTask: {
                title: 'Создать задачу', taskTitle: 'Название задачи*', taskTitlePlaceholder: 'Например: Разработать лендинг',
                description: 'Описание*', descriptionPlaceholder: 'Подробно опишите задачу...', budget: 'Бюджет (₽)*', budgetPlaceholder: '5000',
                deadline: 'Срок выполнения*', skills: 'Требуемые навыки (через запятую)', skillsPlaceholder: 'JavaScript, React, Node.js',
                fillRequired: 'Заполните все обязательные поля', budgetPositive: 'Бюджет должен быть больше нуля', setDeadline: 'Укажите срок выполнения',
                created: 'Задача успешно создана', createError: 'Ошибка создания задачи'
            },
            app: {
                apiUnavailable: 'API недоступен', refreshPage: 'Попробуйте обновить страницу.', turnstileDomain: 'Капча Turnstile (400020): добавьте в виджет домен «',
                turnstileAdd: '». Если открываете по 127.0.0.1 — добавьте и 127.0.0.1.', genericError: 'Произошла ошибка. Попробуйте обновить страницу.',
                requestError: 'Произошла ошибка при выполнении запроса.', turnstileUnavailable: 'Капча Turnstile недоступна. Добавьте домен в Cloudflare: Turnstile -> ваш виджет -> Domains.'
            }
        },
        uk: {
            nav: { home: 'Головна', tasks: 'Завдання', myTasks: 'Мої завдання', freelancers: 'Фрілансери', messages: 'Повідомлення', profile: 'Профіль', login: 'Увійти', logout: 'Вийти', menu: 'Меню' },
            auth: {
                loginTitle: 'Вхід в систему', email: 'Email', password: 'Пароль', loginBtn: 'Увійти', noAccount: 'Немає облікового запису?', registerLink: 'Зареєструватися',
                registerTitle: 'Реєстрація', confirmPassword: 'Підтвердіть пароль', registerBtn: 'Зареєструватися', hasAccount: 'Вже є обліковий запис?',
                emailNotVerified: 'Email не підтверджено', resendVerifyText: 'Email не підтверджено. Натисніть кнопку нижче, щоб надіслати лист для підтвердження email повторно.',
                resendBtn: 'Надіслати лист повторно', userExistsResend: 'Користувач з таким email вже існує. Можливо, email не було підтверджено. Натисніть кнопку нижче, щоб надіслати лист повторно.',
                loggingIn: 'Входимо...', registerSuccess: 'Реєстрація успішна! Лист для підтвердження email надіслано на вашу пошту. Перевірте пошту та перейдіть за посиланням.',
                loginSuccess: 'Ви успішно увійшли в систему!', confirmLogout: 'Ви впевнені, що хочете вийти?',
                passMismatch: 'Паролі не збігаються', passMinLength: 'Пароль повинен бути не менше 6 символів', registering: 'Реєструємо...',
                pleaseCaptcha: 'Будь ласка, пройдіть перевірку (капча)', emailRequired: 'Email не вказано', sending: 'Надсилання...',
                resendSuccess: 'Лист для підтвердження email надіслано. Перевірте пошту.', getLinkAgain: 'Отримати посилання повторно',
                emailAlreadyVerified: 'Цей email вже підтверджено. Ви можете увійти в систему.', invalidEmail: 'Невірний формат email адреси.',
                verifyError: 'Помилка підтвердження Email. Можливо, посилання застаріло.', verifySuccess: 'Email успішно підтверджено! Тепер ви можете увійти.'
            },
            home: {
                title: 'Open-Lance', subtitle: 'Платформа для прямого взаємодії замовників та фрілансерів',
                description: 'Єдиний профіль для всіх: кожен користувач може створювати завдання та відгукуватися на них. Пряма взаємодія між замовниками та виконавцями.',
                goToTasks: 'Перейти до завдань', getStarted: 'Почати роботу', featuresTitle: 'Можливості платформи',
                feature1Title: 'Єдиний профіль', feature1Text: 'Один акаунт для всіх: створюйте завдання як замовник або відгукуйтеся як виконавець',
                feature2Title: 'Система репутації', feature2Text: 'Два незалежні рейтинги: як замовник і як виконавець для чесної оцінки',
                feature3Title: 'Управління завданнями', feature3Text: 'Повний цикл: публікація → відгуки → вибір виконавця → завершення → відгуки',
                feature4Title: 'Чесні відгуки', feature4Text: 'Рейтинг формується лише за реальними угодами: відгук можна залишити лише після спільної роботи',
                feature5Title: 'Вбудовані повідомлення', feature5Text: 'Пряме спілкування між учасниками прямо на платформі',
                feature6Title: 'Прозорість', feature6Text: 'Публічні профілі з історією виконаних завдань та відгуками',
                howTitle: 'Як це працює', step1: 'Реєстрація', step1Text: 'Створіть акаунт та заповніть профіль',
                step2: 'Створення або пошук', step2Text: 'Опублікуйте завдання або знайдіть підходяще', step3: 'Взаємодія', step3Text: 'Спілкуйтеся, домовляйтеся про умови',
                step4: 'Виконання', step4Text: 'Працюйте та отримуйте відгуки', ctaTitle: 'Готові почати?', ctaText: 'Приєднуйтеся до спільноти фрілансерів та замовників',
                footerMarketplace: 'Маркетплейс для фрілансерів та замовників', footerAuthor: 'Автор', footerPlatform: 'Платформа', footerVersion: 'Версія 3.0',
                footerTech: 'Cloudflare Workers + MongoDB Atlas', footerDeveloped: 'Розроблено', telegramChannel: 'Telegram канал'
            },
            tasks: {
                allOpen: 'Усі відкриті завдання', createTask: 'Створити завдання', budget: 'Бюджет', deadline: 'Строк', published: 'Опубліковано', more: 'Детальніше', delete: 'Видалити',
                noTasks: 'На даний момент немає відкритих завдань.', noName: 'Без імені', loadList: 'Завантаження списку завдань...',
                confirmDelete: 'Ви впевнені, що хочете ВИДАЛИТИ це завдання?', deleted: 'Завдання видалено', deleteError: 'Помилка видалення',
                authRequired: 'Увійдіть в систему, щоб переглядати список завдань', loadError: 'Помилка завантаження',
                unauthorizedTitle: 'Потрібен вхід в акаунт', unauthorizedDesc: 'Список завдань доступний лише авторизованим користувачам.'
            },
            myTasks: {
                title: 'Мої завдання', asCustomer: 'Мої завдання (як замовник)', asWorker: 'Мої відгуки (як виконавець)',
                noCreated: 'У вас поки немає створених завдань', noApplications: 'Ви поки не відгукувалися на завдання',
                responded: 'Відгукнулися:', yourMessage: 'Ваше повідомлення:', task: 'Завдання', loadMy: 'Завантаження ваших завдань...',
                authRequired: 'Увійдіть в систему, щоб переглянути свої завдання', loadError: 'Помилка завантаження'
            },
            status: {
                OPEN: 'Відкрита', MATCHED: 'В роботі', COMPLETED: 'Завершена', CANCELLED: 'Скасована',
                PENDING: 'Очікує рішення', ACCEPTED: 'Прийнято', REJECTED: 'Відхилено',
                pendingReview: 'Очікує розгляду', youAccepted: 'Вас прийнято на виконання завдання'
            },
            taskDetails: {
                error: 'Помилка', taskNotFound: 'Завдання не знайдено або ID не вказано', backToTasks: 'Повернутися до завдань',
                yourResponse: 'Ваш відгук', changeResponse: 'Змінити відгук', withdrawResponse: 'Відкликати відгук', saveChanges: 'Зберегти зміни', cancel: 'Скасувати',
                applyToTask: 'Відгукнутися на завдання', messageToCustomer: 'Повідомлення замовнику', sendResponse: 'Надіслати відгук',
                applyPlaceholder: 'Опишіть ваш досвід та чому ви підходите для цього завдання...',
                selectWorker: 'Обрати виконавця', completeTask: 'Завершити завдання', leaveReview: 'Залишити відгук', reviewCustomer: 'Відгук замовнику', reviewWorker: 'Залишити відгук виконавцю'
            },
            common: { authRequired: 'Необхідна авторизація', more: 'Детальніше', unreadBadge: 'Непрочитані повідомлення' },
            toast: { error: 'Помилка', success: 'Успішно', warning: 'Увага', info: 'Інформація' },
            router: { pageNotFound: 'Сторінку не знайдено', loadError: 'Помилка завантаження сторінки' },
            messages: {
                authRequired: 'Увійдіть в систему, щоб переглядати особисті повідомлення', loadMessages: 'Завантаження повідомлень...',
                noInbox: 'У вас немає вхідних повідомлень', noSent: 'Ви ще не надсилали повідомлень', markRead: 'Позначити як прочитане', reply: 'Відповісти',
                loadError: 'Помилка завантаження повідомлень', messageRead: 'Повідомлення прочитано', admin: 'Адмін', noName: 'Без імені',
                title: 'Особисті повідомлення', inbox: 'Вхідні', sent: 'Надіслані', replyTitle: 'Надіслати повідомлення', replyPlaceholder: 'Введіть ваше повідомлення...', sendBtn: 'Надіслати', enterText: 'Введіть текст повідомлення', sentSuccess: 'Повідомлення надіслано'
            },
            users: {
                confirmMakeAdmin: 'Ви впевнені, що хочете призначити цього користувача адміністратором?', roleUpdated: 'Роль успішно оновлено',
                confirmBan: 'Ви впевнені, що хочете заблокувати цього користувача?', userBanned: 'Користувача заблоковано',
                loginToReview: 'Увійдіть в систему, щоб залишити відгук', cannotReview: 'Ви не можете залишити відгук цьому користувачу',
                reviewTooShort: 'Відгук занадто короткий (мінімум 5 символів)', reviewSent: 'Відгук успішно додано!', reviewError: 'Помилка при надсиланні відгуку',
                reviewAfterAccept: 'Ви можете залишити відгук лише після прийняття відгуку на завдання',
                pageTitle: 'Зареєстровані користувачі', noUsersYet: 'Користувачів поки немає.',
                more: 'Детальніше', writeMessage: 'Написати повідомлення', reviewBtn: 'Відгук', leaveReviewTitle: 'Залишити відгук',
                reviewPlaceholder: 'Розкажіть про досвід роботи з користувачем...', cancel: 'Скасувати', publish: 'Опублікувати',
                roleAdmin: 'Адміністратор', roleClient: 'Замовник', bannedBadge: 'ЗАБЛОКОВАНО', makeAdmin: 'Зробити адміном', banUser: 'Заблокувати',
                noName: 'Без імені', ratingClientLabel: 'Рейтинг замовника:', ratingWorkerLabel: 'Рейтинг фрілансера:', perHour: 'на годину',
                specializationLabel: 'Спеціалізація:', allSpecializations: 'Усі спеціалізації', resetFilter: 'Скинути',
                sortBy: 'Сортувати за:', noSort: 'Без сортування', sortRatingWorker: 'Рейтинг фрілансера', sortRatingClient: 'Рейтинг замовника',
                sortHourlyRate: 'Вартість на годину', sortDesc: 'За спаданням', sortAsc: 'За зростанням',
                found: 'Знайдено:', userCountOne: 'користувач', userCountFew: 'користувачі', userCountMany: 'користувачів',
                noUsersFound: 'Користувачі не знайдені', noUsersBySpec: 'за обраною спеціалізацією', tryOtherSpec: 'Спробуйте обрати іншу спеціалізацію.',
                loadError: 'Помилка при завантаженні користувачів'
            },
            profile: {
                authToEdit: 'Увійдіть, щоб переглядати та редагувати свій профіль', loading: 'Завантаження профілю...', loadError: 'Помилка завантаження профілю',
                saving: 'Збереження...', save: 'Зберегти', hourlyRatePositive: 'Вартість на годину має бути додатним числом', updated: 'Профіль успішно оновлено!', updateError: 'Помилка оновлення',
                fillPasswordFields: 'Заповніть усі поля для зміни пароля', passwordsMismatch: 'Нові паролі не збігаються', passwordMinLength: 'Новий пароль — мінімум 6 символів', processing: 'Обробка...', passwordChanged: 'Пароль успішно змінено', passwordError: 'Помилка зміни пароля', changePasswordBtn: 'Змінити пароль', changePasswordTitle: 'Зміна пароля',
                editTitle: 'Редагування профілю', cancel: 'Скасувати', nameLabel: "Ім'я / Нікнейм", namePlaceholder: 'Іван Іванов', titleLabel: 'Спеціальність (Заголовок)', titlePlaceholder: 'Fullstack Розробник',
                specializationsLabel: 'Спеціалізація', specializationsHint: 'Вкажіть спеціалізації через кому', bioLabel: 'Про себе', bioPlaceholder: 'Опишіть навички та досвід...',
                portfolioLabel: 'URL Портфоліо', portfolioPlaceholder: 'https://github.com/username', telegramLabel: 'URL Telegram-каналу', telegramPlaceholder: 'https://t.me/channel',
                hourlyRateLabel: 'Вартість на годину (₴)', hourlyRateHint: 'Необов\'язково', currencyLabel: 'Валюта відображення',
                ratingWorker: 'Рейтинг Виконавця', ratingClient: 'Рейтинг Замовника', perHour: 'На годину',
                noName: 'Ім\'я не вказано', noTitle: 'Спеціальність не вказана', specializationsTitle: 'Спеціалізація', aboutTitle: 'Про себе', noBio: 'Інформація не заповнена.',
                portfolioLink: 'Портфоліо / Сайт', telegramLink: 'Telegram-канал',
                reviewsTitle: 'Відгуки', leaveReview: 'Залишити відгук', yourReview: 'Ваш відгук', ratingLabel: 'Оцінка', commentLabel: 'Коментар', commentPlaceholder: 'Розкажіть про досвід роботи...', publish: 'Опублікувати',
                noReviews: 'У цього користувача поки немає відгуків.', reviewer: 'Користувач', editReview: 'Редагувати', rating1to5: 'Оберіть рейтинг від 1 до 5', commentTooShort: 'Коментар занадто короткий (мінімум 5 символів)', reviewUpdated: 'Відгук оновлено', reviewSaveError: 'Помилка збереження відгуку',
                editProfile: 'Редагувати профіль', writeMessage: 'Написати повідомлення', newMessage: 'Нове повідомлення', messagePlaceholder: 'Введіть ваше повідомлення...', send: 'Надіслати', messageSent: 'Повідомлення надіслано!', sendError: 'Помилка надсилання',
                rating5: 'Відмінно', rating4: 'Добре', rating3: 'Нормально', rating2: 'Погано', rating1: 'Жахливо'
            },
            createTask: {
                title: 'Створити завдання', taskTitle: 'Назва завдання*', taskTitlePlaceholder: 'Наприклад: Розробити лендінг',
                description: 'Опис*', descriptionPlaceholder: 'Детально опишіть завдання...', budget: 'Бюджет (₴)*', budgetPlaceholder: '5000',
                deadline: 'Строк виконання*', skills: 'Потрібні навички (через кому)', skillsPlaceholder: 'JavaScript, React, Node.js',
                fillRequired: 'Заповніть усі обов\'язкові поля', budgetPositive: 'Бюджет повинен бути більше нуля', setDeadline: 'Вкажіть строк виконання',
                created: 'Завдання успішно створено', createError: 'Помилка створення завдання'
            },
            app: {
                apiUnavailable: 'API недоступний', refreshPage: 'Спробуйте оновити сторінку.', turnstileDomain: 'Капча Turnstile (400020): додайте в віджет домен «',
                turnstileAdd: '». Якщо відкриваєте по 127.0.0.1 — додайте і 127.0.0.1.', genericError: 'Сталася помилка. Спробуйте оновити сторінку.',
                requestError: 'Сталася помилка при виконанні запиту.', turnstileUnavailable: 'Капча Turnstile недоступна. Додайте домен в Cloudflare: Turnstile -> ваш віджет -> Domains.'
            }
        },
        de: {
            nav: { home: 'Start', tasks: 'Aufgaben', myTasks: 'Meine Aufgaben', freelancers: 'Freelancer', messages: 'Nachrichten', profile: 'Profil', login: 'Anmelden', logout: 'Abmelden', menu: 'Menü' },
            auth: {
                loginTitle: 'Anmeldung', email: 'E-Mail', password: 'Passwort', loginBtn: 'Anmelden', noAccount: 'Noch kein Konto?', registerLink: 'Registrieren',
                registerTitle: 'Registrierung', confirmPassword: 'Passwort bestätigen', registerBtn: 'Registrieren', hasAccount: 'Bereits ein Konto?',
                emailNotVerified: 'E-Mail nicht bestätigt', resendVerifyText: 'E-Mail nicht bestätigt. Klicken Sie auf die Schaltfläche unten, um die Bestätigungs-E-Mail erneut zu senden.',
                resendBtn: 'E-Mail erneut senden', userExistsResend: 'Ein Benutzer mit dieser E-Mail existiert bereits. Möglicherweise wurde die E-Mail nicht bestätigt. Klicken Sie unten, um die E-Mail erneut zu senden.',
                loggingIn: 'Anmeldung...', registerSuccess: 'Registrierung erfolgreich! Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet. Bitte prüfen Sie Ihren Posteingang.',
                loginSuccess: 'Sie haben sich erfolgreich angemeldet!', confirmLogout: 'Möchten Sie sich wirklich abmelden?',
                passMismatch: 'Passwörter stimmen nicht überein', passMinLength: 'Das Passwort muss mindestens 6 Zeichen haben', registering: 'Registrierung...',
                pleaseCaptcha: 'Bitte bestehen Sie die Überprüfung (Captcha)', emailRequired: 'E-Mail nicht angegeben', sending: 'Wird gesendet...',
                resendSuccess: 'Bestätigungs-E-Mail wurde gesendet. Bitte prüfen Sie Ihren Posteingang.', getLinkAgain: 'Link erneut anfordern',
                emailAlreadyVerified: 'Diese E-Mail ist bereits bestätigt. Sie können sich anmelden.', invalidEmail: 'Ungültiges E-Mail-Format.',
                verifyError: 'E-Mail-Bestätigung fehlgeschlagen. Möglicherweise ist der Link abgelaufen.', verifySuccess: 'E-Mail erfolgreich bestätigt! Sie können sich jetzt anmelden.'
            },
            home: {
                title: 'Open-Lance', subtitle: 'Plattform für direkte Zusammenarbeit zwischen Auftraggebern und Freelancern',
                description: 'Ein Profil für alle: Jeder kann Aufgaben erstellen und sich bewerben. Direkte Zusammenarbeit zwischen Auftraggebern und Auftragnehmern.',
                goToTasks: 'Zu den Aufgaben', getStarted: 'Loslegen', featuresTitle: 'Plattform-Funktionen',
                feature1Title: 'Ein Profil', feature1Text: 'Ein Konto für alles: Erstellen Sie Aufgaben als Auftraggeber oder bewerben Sie sich als Freelancer',
                feature2Title: 'Bewertungssystem', feature2Text: 'Zwei getrennte Bewertungen: als Auftraggeber und als Freelancer für faire Bewertungen',
                feature3Title: 'Aufgabenverwaltung', feature3Text: 'Voller Kreislauf: Veröffentlichung → Bewerbungen → Auswahl → Abschluss → Bewertungen',
                feature4Title: 'Ehrliche Bewertungen', feature4Text: 'Bewertungen nur nach abgeschlossener Zusammenarbeit an einer Aufgabe',
                feature5Title: 'Integrierte Nachrichten', feature5Text: 'Direkte Kommunikation zwischen Teilnehmern auf der Plattform',
                feature6Title: 'Transparenz', feature6Text: 'Öffentliche Profile mit Verlauf und Bewertungen',
                howTitle: 'So funktioniert es', step1: 'Registrierung', step1Text: 'Konto erstellen und Profil ausfüllen',
                step2: 'Erstellen oder Suchen', step2Text: 'Aufgabe veröffentlichen oder passende finden', step3: 'Zusammenarbeit', step3Text: 'Kommunizieren und Bedingungen vereinbaren',
                step4: 'Durchführung', step4Text: 'Arbeiten und Bewertungen erhalten', ctaTitle: 'Bereit zu starten?', ctaText: 'Werden Sie Teil der Community',
                footerMarketplace: 'Marktplatz für Freelancer und Auftraggeber', footerAuthor: 'Autor', footerPlatform: 'Plattform', footerVersion: 'Version 3.0',
                footerTech: 'Cloudflare Workers + MongoDB Atlas', footerDeveloped: 'Entwickelt von', telegramChannel: 'Telegram-Kanal'
            },
            tasks: {
                allOpen: 'Alle offenen Aufgaben', createTask: 'Aufgabe erstellen', budget: 'Budget', deadline: 'Frist', published: 'Veröffentlicht', more: 'Details', delete: 'Löschen',
                noTasks: 'Derzeit keine offenen Aufgaben.', noName: 'Ohne Namen', loadList: 'Aufgabenliste wird geladen...',
                confirmDelete: 'Möchten Sie diese Aufgabe wirklich LÖSCHEN?', deleted: 'Aufgabe gelöscht', deleteError: 'Löschen fehlgeschlagen',
                authRequired: 'Melden Sie sich an, um die Aufgabenliste zu sehen', loadError: 'Lade Fehler',
                unauthorizedTitle: 'Anmeldung erforderlich', unauthorizedDesc: 'Die Aufgabenliste ist nur für angemeldete Benutzer verfügbar.'
            },
            myTasks: {
                title: 'Meine Aufgaben', asCustomer: 'Meine Aufgaben (als Auftraggeber)', asWorker: 'Meine Bewerbungen (als Freelancer)',
                noCreated: 'Sie haben noch keine Aufgaben erstellt', noApplications: 'Sie haben sich noch auf keine Aufgaben beworben',
                responded: 'Beworben:', yourMessage: 'Ihre Nachricht:', task: 'Aufgabe', loadMy: 'Ihre Aufgaben werden geladen...',
                authRequired: 'Melden Sie sich an, um Ihre Aufgaben zu sehen', loadError: 'Lade Fehler'
            },
            status: {
                OPEN: 'Offen', MATCHED: 'In Arbeit', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen',
                PENDING: 'Ausstehend', ACCEPTED: 'Angenommen', REJECTED: 'Abgelehnt',
                pendingReview: 'Wird geprüft', youAccepted: 'Sie wurden für die Aufgabe angenommen'
            },
            taskDetails: {
                error: 'Fehler', taskNotFound: 'Aufgabe nicht gefunden oder ID fehlt', backToTasks: 'Zurück zu den Aufgaben',
                yourResponse: 'Ihre Bewerbung', changeResponse: 'Bewerbung ändern', withdrawResponse: 'Bewerbung zurückziehen', saveChanges: 'Änderungen speichern', cancel: 'Abbrechen',
                applyToTask: 'Auf Aufgabe bewerben', messageToCustomer: 'Nachricht an Auftraggeber', sendResponse: 'Bewerbung senden',
                applyPlaceholder: 'Beschreiben Sie Ihre Erfahrung und warum Sie geeignet sind...',
                selectWorker: 'Freelancer auswählen', completeTask: 'Aufgabe abschließen', leaveReview: 'Bewertung abgeben', reviewCustomer: 'Bewertung für Auftraggeber', reviewWorker: 'Bewertung für Freelancer'
            },
            common: { authRequired: 'Anmeldung erforderlich', more: 'Details', unreadBadge: 'Ungelesene Nachrichten' },
            toast: { error: 'Fehler', success: 'Erfolg', warning: 'Achtung', info: 'Info' },
            router: { pageNotFound: 'Seite nicht gefunden', loadError: 'Fehler beim Laden der Seite' },
            messages: {
                authRequired: 'Melden Sie sich an, um Nachrichten zu sehen', loadMessages: 'Nachrichten werden geladen...',
                noInbox: 'Keine eingehenden Nachrichten', noSent: 'Sie haben noch keine Nachrichten gesendet', markRead: 'Als gelesen markieren', reply: 'Antworten',
                loadError: 'Fehler beim Laden der Nachrichten', messageRead: 'Nachricht gelesen', admin: 'Admin', noName: 'Ohne Namen',
                title: 'Private Nachrichten', inbox: 'Eingang', sent: 'Gesendet', replyTitle: 'Nachricht senden', replyPlaceholder: 'Geben Sie Ihre Nachricht ein...', sendBtn: 'Senden', enterText: 'Bitte Nachrichtentext eingeben', sentSuccess: 'Nachricht gesendet'
            },
            users: {
                confirmMakeAdmin: 'Möchten Sie diesen Benutzer wirklich zum Administrator machen?', roleUpdated: 'Rolle erfolgreich aktualisiert',
                confirmBan: 'Möchten Sie diesen Benutzer wirklich sperren?', userBanned: 'Benutzer gesperrt',
                loginToReview: 'Melden Sie sich an, um eine Bewertung abzugeben', cannotReview: 'Sie können diesem Benutzer keine Bewertung geben',
                reviewTooShort: 'Bewertung zu kurz (mind. 5 Zeichen)', reviewSent: 'Bewertung erfolgreich gesendet!', reviewError: 'Fehler beim Senden der Bewertung',
                reviewAfterAccept: 'Sie können nur nach Annahme einer Bewerbung eine Bewertung abgeben',
                pageTitle: 'Registrierte Benutzer', noUsersYet: 'Noch keine Benutzer.',
                more: 'Details', writeMessage: 'Nachricht senden', reviewBtn: 'Bewertung', leaveReviewTitle: 'Bewertung abgeben',
                reviewPlaceholder: 'Erzählen Sie von Ihrer Zusammenarbeit mit diesem Benutzer...', cancel: 'Abbrechen', publish: 'Veröffentlichen',
                roleAdmin: 'Administrator', roleClient: 'Auftraggeber', bannedBadge: 'GESPERRT', makeAdmin: 'Zum Admin machen', banUser: 'Sperren',
                noName: 'Ohne Namen', ratingClientLabel: 'Bewertung als Auftraggeber:', ratingWorkerLabel: 'Bewertung als Freelancer:', perHour: 'pro Stunde',
                specializationLabel: 'Spezialisierung:', allSpecializations: 'Alle Spezialisierungen', resetFilter: 'Zurücksetzen',
                sortBy: 'Sortieren nach:', noSort: 'Keine Sortierung', sortRatingWorker: 'Bewertung Freelancer', sortRatingClient: 'Bewertung Auftraggeber',
                sortHourlyRate: 'Stundensatz', sortDesc: 'Absteigend', sortAsc: 'Aufsteigend',
                found: 'Gefunden:', userCountOne: 'Benutzer', userCountFew: 'Benutzer', userCountMany: 'Benutzer',
                noUsersFound: 'Keine Benutzer gefunden', noUsersBySpec: 'für die gewählte Spezialisierung', tryOtherSpec: 'Wählen Sie eine andere Spezialisierung.',
                loadError: 'Fehler beim Laden der Benutzer'
            },
            profile: {
                authToEdit: 'Melden Sie sich an, um Ihr Profil zu sehen und zu bearbeiten', loading: 'Profil wird geladen...', loadError: 'Fehler beim Laden des Profils',
                saving: 'Wird gespeichert...', save: 'Speichern', hourlyRatePositive: 'Der Stundensatz muss eine positive Zahl sein', updated: 'Profil erfolgreich aktualisiert!', updateError: 'Aktualisierung fehlgeschlagen',
                fillPasswordFields: 'Bitte füllen Sie alle Felder zur Passwortänderung aus', passwordsMismatch: 'Die neuen Passwörter stimmen nicht überein', passwordMinLength: 'Neues Passwort — mind. 6 Zeichen', processing: 'Wird verarbeitet...', passwordChanged: 'Passwort erfolgreich geändert', passwordError: 'Fehler bei Passwortänderung', changePasswordBtn: 'Passwort ändern', changePasswordTitle: 'Passwort ändern',
                editTitle: 'Profil bearbeiten', cancel: 'Abbrechen', nameLabel: 'Name / Nickname', namePlaceholder: 'Max Mustermann', titleLabel: 'Beruf (Titel)', titlePlaceholder: 'Fullstack-Entwickler',
                specializationsLabel: 'Spezialisierung', specializationsHint: 'Durch Komma getrennt (z. B. JavaScript, React)', bioLabel: 'Über mich', bioPlaceholder: 'Beschreiben Sie Ihre Fähigkeiten und Erfahrung...',
                portfolioLabel: 'Portfolio-URL (Website/GitHub/Behance)', portfolioPlaceholder: 'https://github.com/username', telegramLabel: 'Telegram-Kanal-URL', telegramPlaceholder: 'https://t.me/channel',
                hourlyRateLabel: 'Stundensatz (€)', hourlyRateHint: 'Optional', currencyLabel: 'Anzeigewährung',
                ratingWorker: 'Bewertung als Freelancer', ratingClient: 'Bewertung als Auftraggeber', perHour: 'Pro Stunde',
                noName: 'Kein Name angegeben', noTitle: 'Kein Beruf angegeben', specializationsTitle: 'Spezialisierung', aboutTitle: 'Über mich', noBio: 'Noch keine Angaben.',
                portfolioLink: 'Portfolio / Website', telegramLink: 'Telegram-Kanal',
                reviewsTitle: 'Bewertungen', leaveReview: 'Bewertung abgeben', yourReview: 'Ihre Bewertung', ratingLabel: 'Bewertung', commentLabel: 'Kommentar', commentPlaceholder: 'Erzählen Sie von Ihrer Zusammenarbeit...', publish: 'Veröffentlichen',
                noReviews: 'Dieser Benutzer hat noch keine Bewertungen.', reviewer: 'Benutzer', editReview: 'Bearbeiten', rating1to5: 'Bitte Bewertung von 1 bis 5 wählen', commentTooShort: 'Kommentar zu kurz (mind. 5 Zeichen)', reviewUpdated: 'Bewertung aktualisiert', reviewSaveError: 'Fehler beim Speichern der Bewertung',
                editProfile: 'Profil bearbeiten', writeMessage: 'Nachricht senden', newMessage: 'Neue Nachricht', messagePlaceholder: 'Geben Sie Ihre Nachricht ein...', send: 'Senden', messageSent: 'Nachricht gesendet!', sendError: 'Fehler beim Senden',
                rating5: 'Ausgezeichnet', rating4: 'Gut', rating3: 'Normal', rating2: 'Schlecht', rating1: 'Sehr schlecht'
            },
            createTask: {
                title: 'Aufgabe erstellen', taskTitle: 'Aufgabentitel*', taskTitlePlaceholder: 'z.B. Landing Page erstellen',
                description: 'Beschreibung*', descriptionPlaceholder: 'Beschreiben Sie die Aufgabe...', budget: 'Budget (€)*', budgetPlaceholder: '5000',
                deadline: 'Frist*', skills: 'Erforderliche Fähigkeiten (kommagetrennt)', skillsPlaceholder: 'JavaScript, React, Node.js',
                fillRequired: 'Bitte füllen Sie alle Pflichtfelder aus', budgetPositive: 'Budget muss größer als null sein', setDeadline: 'Bitte Frist angeben',
                created: 'Aufgabe erfolgreich erstellt', createError: 'Fehler beim Erstellen der Aufgabe'
            },
            app: {
                apiUnavailable: 'API nicht verfügbar', refreshPage: 'Bitte Seite neu laden.', turnstileDomain: 'Turnstile (400020): Domain «',
                turnstileAdd: '» zum Widget hinzufügen.', genericError: 'Ein Fehler ist aufgetreten. Bitte Seite neu laden.',
                requestError: 'Bei der Anfrage ist ein Fehler aufgetreten.', turnstileUnavailable: 'Turnstile nicht verfügbar. Domain in Cloudflare hinzufügen.'
            }
        },
        en: {
            nav: { home: 'Home', tasks: 'Tasks', myTasks: 'My tasks', freelancers: 'Freelancers', messages: 'Messages', profile: 'Profile', login: 'Log in', logout: 'Log out', menu: 'Menu' },
            auth: {
                loginTitle: 'Log in', email: 'Email', password: 'Password', loginBtn: 'Log in', noAccount: "Don't have an account?", registerLink: 'Sign up',
                registerTitle: 'Sign up', confirmPassword: 'Confirm password', registerBtn: 'Sign up', hasAccount: 'Already have an account?',
                emailNotVerified: 'Email not verified', resendVerifyText: 'Email not verified. Click the button below to resend the verification email.',
                resendBtn: 'Resend email', userExistsResend: 'A user with this email already exists. The email may not have been verified. Click below to resend the email.',
                loggingIn: 'Logging in...', registerSuccess: 'Registration successful! A verification email has been sent. Please check your inbox.',
                loginSuccess: 'You have successfully logged in!', confirmLogout: 'Are you sure you want to log out?',
                passMismatch: 'Passwords do not match', passMinLength: 'Password must be at least 6 characters', registering: 'Signing up...',
                pleaseCaptcha: 'Please complete the captcha', emailRequired: 'Email not provided', sending: 'Sending...',
                resendSuccess: 'Verification email sent. Please check your inbox.', getLinkAgain: 'Get link again',
                emailAlreadyVerified: 'This email is already verified. You can log in.', invalidEmail: 'Invalid email format.',
                verifyError: 'Email verification failed. The link may have expired.', verifySuccess: 'Email verified! You can now log in.'
            },
            home: {
                title: 'Open-Lance', subtitle: 'Platform for direct collaboration between clients and freelancers',
                description: 'One profile for everyone: create tasks or apply to them. Direct interaction between clients and freelancers.',
                goToTasks: 'Go to tasks', getStarted: 'Get started', featuresTitle: 'Platform features',
                feature1Title: 'Single profile', feature1Text: 'One account: create tasks as a client or apply as a freelancer',
                feature2Title: 'Reputation system', feature2Text: 'Two separate ratings: as client and as freelancer for fair reviews',
                feature3Title: 'Task management', feature3Text: 'Full cycle: publish → applications → select freelancer → complete → reviews',
                feature4Title: 'Honest reviews', feature4Text: 'Reviews only after completed work together on a task',
                feature5Title: 'Built-in messages', feature5Text: 'Direct communication between participants on the platform',
                feature6Title: 'Transparency', feature6Text: 'Public profiles with task history and reviews',
                howTitle: 'How it works', step1: 'Sign up', step1Text: 'Create an account and fill your profile',
                step2: 'Create or search', step2Text: 'Publish a task or find one', step3: 'Collaborate', step3Text: 'Communicate and agree on terms',
                step4: 'Complete', step4Text: 'Work and get reviews', ctaTitle: 'Ready to start?', ctaText: 'Join the community of freelancers and clients',
                footerMarketplace: 'Marketplace for freelancers and clients', footerAuthor: 'Author', footerPlatform: 'Platform', footerVersion: 'Version 3.0',
                footerTech: 'Cloudflare Workers + MongoDB Atlas', footerDeveloped: 'Developed by', telegramChannel: 'Telegram channel'
            },
            tasks: {
                allOpen: 'All open tasks', createTask: 'Create task', budget: 'Budget', deadline: 'Deadline', published: 'Published', more: 'Details', delete: 'Delete',
                noTasks: 'No open tasks at the moment.', noName: 'No name', loadList: 'Loading tasks...',
                confirmDelete: 'Are you sure you want to DELETE this task?', deleted: 'Task deleted', deleteError: 'Delete failed',
                authRequired: 'Log in to view the task list', loadError: 'Load error',
                unauthorizedTitle: 'Log in required', unauthorizedDesc: 'The task list is only available to logged-in users.'
            },
            myTasks: {
                title: 'My tasks', asCustomer: 'My tasks (as client)', asWorker: 'My applications (as freelancer)',
                noCreated: 'You have no tasks created yet', noApplications: 'You have not applied to any tasks yet',
                responded: 'Applied:', yourMessage: 'Your message:', task: 'Task', loadMy: 'Loading your tasks...',
                authRequired: 'Log in to view your tasks', loadError: 'Load error'
            },
            status: {
                OPEN: 'Open', MATCHED: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
                PENDING: 'Pending', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
                pendingReview: 'Pending review', youAccepted: 'You have been accepted for this task'
            },
            taskDetails: {
                error: 'Error', taskNotFound: 'Task not found or ID missing', backToTasks: 'Back to tasks',
                yourResponse: 'Your application', changeResponse: 'Edit application', withdrawResponse: 'Withdraw application', saveChanges: 'Save changes', cancel: 'Cancel',
                applyToTask: 'Apply to task', messageToCustomer: 'Message to client', sendResponse: 'Send application',
                applyPlaceholder: 'Describe your experience and why you are a good fit...',
                selectWorker: 'Select freelancer', completeTask: 'Complete task', leaveReview: 'Leave review', reviewCustomer: 'Review client', reviewWorker: 'Review freelancer'
            },
            common: { authRequired: 'Authentication required', more: 'Details', unreadBadge: 'Unread messages' },
            toast: { error: 'Error', success: 'Success', warning: 'Warning', info: 'Info' },
            router: { pageNotFound: 'Page not found', loadError: 'Page load error' },
            messages: {
                authRequired: 'Log in to view messages', loadMessages: 'Loading messages...',
                noInbox: 'No incoming messages', noSent: 'You have not sent any messages yet', markRead: 'Mark as read', reply: 'Reply',
                loadError: 'Error loading messages', messageRead: 'Message read', admin: 'Admin', noName: 'No name',
                title: 'Messages', inbox: 'Inbox', sent: 'Sent', replyTitle: 'Send message', replyPlaceholder: 'Enter your message...', sendBtn: 'Send', enterText: 'Enter message text', sentSuccess: 'Message sent'
            },
            users: {
                confirmMakeAdmin: 'Are you sure you want to make this user an administrator?', roleUpdated: 'Role updated successfully',
                confirmBan: 'Are you sure you want to ban this user?', userBanned: 'User banned',
                loginToReview: 'Log in to leave a review', cannotReview: 'You cannot review this user',
                reviewTooShort: 'Review too short (minimum 5 characters)', reviewSent: 'Review added successfully!', reviewError: 'Error submitting review',
                reviewAfterAccept: 'You can only leave a review after your application has been accepted',
                pageTitle: 'Registered users', noUsersYet: 'No users yet.',
                more: 'Details', writeMessage: 'Send message', reviewBtn: 'Review', leaveReviewTitle: 'Leave review',
                reviewPlaceholder: 'Tell us about your experience working with this user...', cancel: 'Cancel', publish: 'Publish',
                roleAdmin: 'Administrator', roleClient: 'Client', bannedBadge: 'BANNED', makeAdmin: 'Make admin', banUser: 'Ban user',
                noName: 'No name', ratingClientLabel: 'Client rating:', ratingWorkerLabel: 'Freelancer rating:', perHour: 'per hour',
                specializationLabel: 'Specialization:', allSpecializations: 'All specializations', resetFilter: 'Reset',
                sortBy: 'Sort by:', noSort: 'No sorting', sortRatingWorker: 'Freelancer rating', sortRatingClient: 'Client rating',
                sortHourlyRate: 'Hourly rate', sortDesc: 'Descending', sortAsc: 'Ascending',
                found: 'Found:', userCountOne: 'user', userCountFew: 'users', userCountMany: 'users',
                noUsersFound: 'No users found', noUsersBySpec: 'for the selected specialization', tryOtherSpec: 'Try selecting a different specialization.',
                loadError: 'Error loading users'
            },
            profile: {
                authToEdit: 'Log in to view and edit your profile', loading: 'Loading profile...', loadError: 'Error loading profile',
                saving: 'Saving...', save: 'Save', hourlyRatePositive: 'Hourly rate must be a positive number', updated: 'Profile updated successfully!', updateError: 'Update error',
                fillPasswordFields: 'Please fill in all password change fields', passwordsMismatch: 'New passwords do not match', passwordMinLength: 'New password — at least 6 characters', processing: 'Processing...', passwordChanged: 'Password changed successfully', passwordError: 'Password change error', changePasswordBtn: 'Change password', changePasswordTitle: 'Change password',
                editTitle: 'Edit profile', cancel: 'Cancel', nameLabel: 'Name / Nickname', namePlaceholder: 'John Doe', titleLabel: 'Title / Specialty', titlePlaceholder: 'Fullstack Developer',
                specializationsLabel: 'Specializations', specializationsHint: 'Comma-separated (e.g. JavaScript, React)', bioLabel: 'About me', bioPlaceholder: 'Describe your skills and experience...',
                portfolioLabel: 'Portfolio URL (website/GitHub/Behance)', portfolioPlaceholder: 'https://github.com/username', telegramLabel: 'Telegram channel URL', telegramPlaceholder: 'https://t.me/channel',
                hourlyRateLabel: 'Hourly rate', hourlyRateHint: 'Optional', currencyLabel: 'Display currency',
                ratingWorker: 'Freelancer rating', ratingClient: 'Client rating', perHour: 'Per hour',
                noName: 'No name specified', noTitle: 'No title specified', specializationsTitle: 'Specializations', aboutTitle: 'About me', noBio: 'No information provided yet.',
                portfolioLink: 'Portfolio / Website', telegramLink: 'Telegram channel',
                reviewsTitle: 'Reviews', leaveReview: 'Leave review', yourReview: 'Your review', ratingLabel: 'Rating', commentLabel: 'Comment', commentPlaceholder: 'Tell us about your experience...', publish: 'Publish',
                noReviews: 'This user has no reviews yet.', reviewer: 'User', editReview: 'Edit', rating1to5: 'Please choose a rating from 1 to 5', commentTooShort: 'Comment too short (minimum 5 characters)', reviewUpdated: 'Review updated', reviewSaveError: 'Error saving review',
                editProfile: 'Edit profile', writeMessage: 'Send message', newMessage: 'New message', messagePlaceholder: 'Enter your message...', send: 'Send', messageSent: 'Message sent!', sendError: 'Error sending',
                rating5: 'Excellent', rating4: 'Good', rating3: 'Average', rating2: 'Poor', rating1: 'Very poor'
            },
            createTask: {
                title: 'Create task', taskTitle: 'Task title*', taskTitlePlaceholder: 'e.g. Build a landing page',
                description: 'Description*', descriptionPlaceholder: 'Describe the task in detail...', budget: 'Budget*', budgetPlaceholder: '5000',
                deadline: 'Deadline*', skills: 'Required skills (comma-separated)', skillsPlaceholder: 'JavaScript, React, Node.js',
                fillRequired: 'Please fill in all required fields', budgetPositive: 'Budget must be greater than zero', setDeadline: 'Please set a deadline',
                created: 'Task created successfully', createError: 'Error creating task'
            },
            app: {
                apiUnavailable: 'API unavailable', refreshPage: 'Try refreshing the page.', turnstileDomain: 'Turnstile (400020): add domain «',
                turnstileAdd: '» to the widget. If using 127.0.0.1, add that too.', genericError: 'An error occurred. Try refreshing the page.',
                requestError: 'An error occurred while processing the request.', turnstileUnavailable: 'Turnstile unavailable. Add domain in Cloudflare Turnstile → Domains.'
            }
        }
    };

    function getStoredLang() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && translations[stored]) return stored;
        } catch (e) {}
        return DEFAULT_LANG;
    }

    function getByPath(obj, path) {
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
            v = v && v[k];
        }
        return v;
    }

    window.i18n = {
        lang: getStoredLang(),
        t(key) {
            const v = getByPath(translations[this.lang], key);
            return v != null ? String(v) : key;
        },
        setLang(code) {
            if (!translations[code]) return;
            this.lang = code;
            localStorage.setItem(STORAGE_KEY, code);
            document.documentElement.lang = code === 'uk' ? 'uk' : code === 'de' ? 'de' : code === 'en' ? 'en' : 'ru';
            this.applyToPage();
            if (window.router && window.router.navigate && window.router.getCurrentRoute) {
                const { name, props } = window.router.getCurrentRoute();
                if (name) window.router.navigate(name, props || {}, { force: true });
            }
        },
        applyToPage() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) el.textContent = this.t(key);
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (key) el.placeholder = this.t(key);
            });
            const navToggle = document.getElementById('navToggle');
            if (navToggle) navToggle.setAttribute('aria-label', this.t('nav.menu'));
            const langBtn = document.getElementById('langBtn');
            if (langBtn) langBtn.textContent = (this.labels[this.lang] || this.lang.toUpperCase()) + ' \u25BC';
            if (document.getElementById('authBtn')) {
                document.getElementById('authBtn').textContent = window.auth && window.auth.isLoggedIn() ? this.t('nav.logout') : this.t('nav.login');
            }
            const msgLink = document.querySelector('a[data-page="messages"]');
            if (msgLink && msgLink.querySelector('.nav-unread-badge')) {
                const label = this.t('nav.messages');
                const badge = msgLink.querySelector('.nav-unread-badge').outerHTML;
                msgLink.innerHTML = label + ' ' + badge;
            } else if (msgLink) {
                msgLink.textContent = this.t('nav.messages');
            }
        },
        supported: ['ru', 'uk', 'de', 'en'],
        labels: { ru: 'Русский', uk: 'Українська', de: 'Deutsch', en: 'English' }
    };

    document.documentElement.lang = window.i18n.lang === 'uk' ? 'uk' : window.i18n.lang === 'de' ? 'de' : window.i18n.lang === 'en' ? 'en' : 'ru';
})();
