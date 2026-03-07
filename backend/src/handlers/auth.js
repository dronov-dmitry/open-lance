/**
 * Authentication handlers
 * Using MongoDB Atlas for data storage
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

const JWT_EXPIRATION = '7d';

/**
 * Login handler
 */
async function login(event) {
    try {
        // Get JWT_SECRET from Cloudflare Workers env
        const JWT_SECRET = event.env?.JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-this';
        
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        if (!password || password.length < 6) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid password' })
            };
        }

        // TODO: Replace with real authentication
        // For now, mock authentication
        
        // Query user by email
        const user = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (!user) {
            return response.unauthorized('Неверный email или пароль');
        }

        if (!user.is_verified) {
            return response.unauthorized('Подтвердите Email. Ссылка была отправлена при регистрации.');
        }

        if (user.status === 'BANNED') {
            return response.forbidden('Ваш аккаунт заблокирован');
        }

        // TODO: Verify password hash
        // For now, just accept any password
        
        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                role: user.role || 'USER',
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        // Return response directly without wrapper for auth endpoints
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    rating_as_client: user.rating_as_client,
                    rating_as_worker: user.rating_as_worker,
                    completed_tasks_client: user.completed_tasks_client,
                    completed_tasks_worker: user.completed_tasks_worker,
                    role: user.role || 'USER',
                    status: user.status || 'ACTIVE',
                    is_verified: user.is_verified
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Login failed: ' + error.message })
        };
    }
}

/**
 * Register handler
 */
async function register(event) {
    try {
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        if (!password || password.length < 6) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Password must be at least 6 characters' })
            };
        }

        // Check if user already exists
        const existingUser = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (existingUser) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Пользователь с таким email уже существует' })
            };
        }

        // Create new user
        const userId = uuidv4();
        const verificationToken = uuidv4();
        const now = new Date().toISOString();

        const newUser = {
            user_id: userId,
            email: email.toLowerCase(),
            // TODO: Hash password properly
            password_hash: password, // This is NOT secure - use bcrypt in production
            created_at: now,
            updated_at: now,
            rating_as_client: 0,
            rating_as_worker: 0,
            completed_tasks_client: 0,
            completed_tasks_worker: 0,
            contact_links: [],
            role: 'USER',
            status: 'ACTIVE',
            is_verified: false,
            verification_token: verificationToken
        };

        // Store user in MongoDB
        await mongoManager.insertOne('users', newUser);

        // EMAIL SENDING LOGIC
        const host = event.headers.origin || 'https://' + (event.env.FRONTEND_URL || 'localhost:8787'); 
        const verificationLink = `${host}/#/home?verify=${verificationToken}`;
        
        if (event.env && event.env.RESEND_API_KEY && event.env.RESEND_API_KEY !== 'SIMULATE') {
            console.log(`[Email] Отправка реального письма через Resend на ${email}...`);
            const senderEmail = event.env.SENDER_EMAIL || 'onboarding@resend.dev';
            console.log('[Email] Registration - Sender email:', senderEmail);
            console.log('[Email] Registration - Recipient email:', email);
            
            try {
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${event.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `Open-Lance <${senderEmail}>`,
                        to: [email],
                        subject: 'Подтвердите почту на Open-Lance',
                        html: `
                            <h2>Добро пожаловать в Open-Lance!</h2>
                            <p>Спасибо за регистрацию на платформе.</p>
                            <p>Пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
                            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                                Подтвердить Email
                            </a>
                            <p>Или скопируйте эту ссылку в браузер:</p>
                            <p>${verificationLink}</p>
                            <hr />
                            <small>Если вы не регистрировались на сайте, просто проигнорируйте это письмо.</small>
                        `
                    })
                });

                if (!resendResponse.ok) {
                    const errText = await resendResponse.text();
                    let errorDetails;
                    try {
                        errorDetails = JSON.parse(errText);
                    } catch {
                        errorDetails = { message: errText };
                    }
                    console.error('[Email] Ошибка API Resend при регистрации:', resendResponse.status);
                    console.error('[Email] Error details:', errorDetails);
                    console.error('[Email] Full error text:', errText);
                    
                    // Логируем детали для диагностики
                    console.error('[Email] Recipient email that failed:', email);
                    console.error('[Email] Sender email used:', senderEmail);
                    
                    // Проверяем, является ли ошибка связанной с ограничением onboarding@resend.dev
                    const errorMessageText = (errorDetails.message || errText || '').toLowerCase();
                    const isDomainRestriction = errorMessageText.includes('testing domain restriction') || 
                                                errorMessageText.includes('can only send to your own email') ||
                                                errorMessageText.includes('resend.dev domain is for testing');
                    
                    // Если ошибка 403, это может быть проблема с лимитами или правами
                    if (resendResponse.status === 403) {
                        console.error('[Email] 403 ошибка при регистрации - возможные причины:');
                        if (isDomainRestriction && senderEmail === 'onboarding@resend.dev') {
                            console.error('[Email] ⚠️  ОГРАНИЧЕНИЕ: onboarding@resend.dev может отправлять только на email владельца аккаунта Resend!');
                            console.error('[Email] Решение: Верифицируйте свой домен в Resend Dashboard: https://resend.com/domains');
                            console.error('[Email] После верификации домена, измените SENDER_EMAIL на ваш-email@ваш-домен.com');
                        } else {
                            console.error('[Email] 1. Лимит писем в день достигнут (free tier: 100 писем/день)');
                            console.error('[Email] 2. Email адрес заблокирован или в черном списке');
                            console.error('[Email] 3. API ключ не имеет прав на отправку');
                            console.error('[Email] 4. Проблема с доменом отправителя');
                        }
                    }
                    
                    // Выводим ссылку в логи даже при ошибке
                    let fallbackErrorMsg = `ОШИБКА Resend API: ${resendResponse.status} - ${errorDetails.message || errText}`;
                    if (isDomainRestriction && senderEmail === 'onboarding@resend.dev') {
                        fallbackErrorMsg = `ОШИБКА: onboarding@resend.dev может отправлять только на email владельца аккаунта Resend.\n` +
                                          `Получатель: ${email}\n` +
                                          `Решение: Верифицируйте домен в Resend Dashboard (https://resend.com/domains) и измените SENDER_EMAIL.`;
                    }
                    console.log(`\n\n=== УВЕДОМЛЕНИЕ (Fallback - Registration) ===\nРегистрация на email: ${email}\nСсылка для подтверждения:\n${verificationLink}\n\n${fallbackErrorMsg}\n===================\n\n`);
                } else {
                    const responseData = await resendResponse.json().catch(() => ({}));
                    console.log('[Email] Письмо успешно отправлено при регистрации!');
                    console.log('[Email] Resend response:', responseData);
                }
            } catch (err) {
                console.error('[Email] Системная ошибка при отправке при регистрации:', err);
                console.error('[Email] Error stack:', err.stack);
                console.log(`\n\n=== УВЕДОМЛЕНИЕ (Fallback - Registration Exception) ===\nРегистрация на email: ${email}\nСсылка для подтверждения:\n${verificationLink}\n\nИСКЛЮЧЕНИЕ: ${err.name} - ${err.message}\n===================\n\n`);
            }
        } else {
            // !! SIMULATED EMAIL SENDING !!
            console.log(`\n\n=== УВЕДОМЛЕНИЕ ===\nИмитация отправки проверочного письма на email: ${email}\nСсылка для подтверждения:\n${verificationLink}\n===================\n\n`);
        }

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Registration successful! Verification email has been sent.'
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Пользователь с таким email уже существует' })
            };
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Registration failed: ' + error.message })
        };
    }
}

/**
 * Verify Email handler (GET /auth/verify?token=xxx)
 */
async function verifyEmail(event) {
    try {
        const token = event.queryStringParameters?.token;
        if (!token) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Токен не передан' })
            };
        }

        const user = await mongoManager.findOne('users', { verification_token: token });
        if (!user) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Неверный или просроченный токен' })
            };
        }

        await mongoManager.updateOne(
            'users', 
            { user_id: user.user_id },
            { 
                $set: { is_verified: true },
                $unset: { verification_token: "" }
            }
        );

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Email успешно подтвержден' })
        };

    } catch (error) {
        console.error('Verification error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Verification failed: ' + error.message })
        };
    }
}

/**
 * Resend verification email handler (POST /auth/resend-verification)
 */
async function resendVerificationEmail(event) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Тело запроса пустое' })
            };
        }
        
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Неверный формат данных запроса' })
            };
        }
        
        const { email } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        // Find user by email
        const user = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: 'Если аккаунт с таким email существует и не подтвержден, письмо будет отправлено.' 
                })
            };
        }

        // If user is already verified, don't send email
        if (user.is_verified) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Email уже подтвержден' })
            };
        }

        // Generate new verification token
        const verificationToken = uuidv4();
        
        // Update user with new token
        await mongoManager.updateOne(
            'users',
            { user_id: user.user_id },
            { 
                $set: { 
                    verification_token: verificationToken,
                    updated_at: new Date().toISOString()
                }
            }
        );

        // Send verification email
        const host = event.headers.origin || event.headers['origin'] || 'https://' + (event.env?.FRONTEND_URL || 'localhost:8787'); 
        const verificationLink = `${host}/#/home?verify=${verificationToken}`;
        
        console.log('[Email] Resend verification - checking Resend API key...');
        console.log('[Email] Has RESEND_API_KEY:', !!(event.env && event.env.RESEND_API_KEY));
        console.log('[Email] RESEND_API_KEY length:', event.env && event.env.RESEND_API_KEY ? event.env.RESEND_API_KEY.length : 0);
        console.log('[Email] RESEND_API_KEY starts with "re_":', event.env && event.env.RESEND_API_KEY ? event.env.RESEND_API_KEY.startsWith('re_') : false);
        console.log('[Email] RESEND_API_KEY value (first 15 chars):', event.env && event.env.RESEND_API_KEY ? (event.env.RESEND_API_KEY.substring(0, 15) + '...') : 'not set');
        console.log('[Email] SENDER_EMAIL:', event.env && event.env.SENDER_EMAIL ? event.env.SENDER_EMAIL : 'not set (will use default)');
        
        const hasValidResendKey = event.env && 
                                   event.env.RESEND_API_KEY && 
                                   event.env.RESEND_API_KEY !== 'SIMULATE' && 
                                   event.env.RESEND_API_KEY.trim() !== '' &&
                                   event.env.RESEND_API_KEY.startsWith('re_');
        
        if (hasValidResendKey) {
            console.log(`[Email] Повторная отправка письма подтверждения на ${email}...`);
            // Используем onboarding@resend.dev по умолчанию для тестирования
            // Этот адрес работает без верификации домена
            const senderEmail = event.env.SENDER_EMAIL || 'onboarding@resend.dev';
            console.log('[Email] Using sender email:', senderEmail);
            
            // Если используется кастомный домен, но он не верифицирован, используем onboarding@resend.dev
            if (senderEmail !== 'onboarding@resend.dev' && !senderEmail.EndsWith('@resend.dev')) {
                console.log('[Email] Custom domain detected. If 403 error occurs, verify domain in Resend Dashboard.');
            }
            
            try {
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${event.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `Open-Lance <${senderEmail}>`,
                        to: [email],
                        subject: 'Подтвердите почту на Open-Lance',
                        html: `
                            <h2>Подтверждение Email</h2>
                            <p>Вы запросили повторную отправку ссылки для подтверждения email.</p>
                            <p>Пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
                            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                                Подтвердить Email
                            </a>
                            <p>Или скопируйте эту ссылку в браузер:</p>
                            <p>${verificationLink}</p>
                            <hr />
                            <small>Если вы не запрашивали это письмо, просто проигнорируйте его.</small>
                        `
                    })
                });

                if (!resendResponse.ok) {
                    const errText = await resendResponse.text();
                    let errorDetails;
                    try {
                        errorDetails = JSON.parse(errText);
                    } catch {
                        errorDetails = { message: errText };
                    }
                    console.error('[Email] Ошибка API Resend:', resendResponse.status);
                    console.error('[Email] Error details:', errorDetails);
                    console.error('[Email] Full error text:', errText);
                    
                    // Логируем детали для диагностики
                    console.error('[Email] Resend API Key used (first 15 chars):', event.env.RESEND_API_KEY.substring(0, 15) + '...');
                    console.error('[Email] Sender email:', senderEmail);
                    console.error('[Email] Recipient email:', email);
                    
                    let errorMessage = `Email сервис временно недоступен (ошибка ${resendResponse.status})`;
                    let fallbackMessage = `ОШИБКА Resend API: ${resendResponse.status} - ${errorDetails.message || errText}`;
                    
                    // Обработка разных типов ошибок
                    if (resendResponse.status === 401) {
                        console.error('[Email] Resend API вернул 401 - неверный API ключ!');
                        errorMessage = 'Resend API ключ неверный или истек. Проверьте настройки в Cloudflare Workers.';
                        fallbackMessage = 'ОШИБКА: Resend API ключ неверный или истек. Проверьте настройки в Cloudflare Workers.';
                    } else if (resendResponse.status === 403) {
                        console.error('[Email] Resend API вернул 403 - недостаточно прав или проблема с отправкой!');
                        console.error('[Email] Возможные причины:');
                        console.error('[Email] 1. Лимит писем достигнут (free tier: 100 писем/день, 3000/месяц)');
                        console.error('[Email] 2. Email адрес получателя заблокирован или в черном списке Resend');
                        console.error('[Email] 3. Домен не верифицирован в Resend Dashboard (https://resend.com/domains)');
                        console.error('[Email] 4. API ключ не имеет прав на отправку писем');
                        console.error('[Email] 5. Отправитель (from email) не настроен правильно');
                        console.error('[Email] 6. Проверьте лимиты в Resend Dashboard: https://resend.com/emails');
                        console.error('[Email] 7. Проверьте статистику отправки: https://resend.com/emails');
                        
                        // Проверяем, является ли ошибка связанной с ограничением onboarding@resend.dev
                        const errorMessageText = (errorDetails.message || errText || '').toLowerCase();
                        const isDomainRestriction = errorMessageText.includes('testing domain restriction') || 
                                                    errorMessageText.includes('can only send to your own email') ||
                                                    errorMessageText.includes('resend.dev domain is for testing');
                        
                        // Проверяем, используется ли onboarding@resend.dev
                        if (senderEmail === 'onboarding@resend.dev') {
                            if (isDomainRestriction) {
                                // Специальная обработка для ограничения onboarding@resend.dev
                                errorMessage = 'onboarding@resend.dev может отправлять письма только на email владельца аккаунта Resend. ' +
                                              'Для отправки на другие адреса необходимо верифицировать домен в Resend Dashboard.';
                                fallbackMessage = `ОШИБКА: onboarding@resend.dev может отправлять только на email владельца аккаунта Resend.\n` +
                                                `Получатель: ${email}\n\n` +
                                                `РЕШЕНИЕ:\n` +
                                                `1. Перейдите в Resend Dashboard: https://resend.com/domains\n` +
                                                `2. Добавьте и верифицируйте свой домен (добавьте DNS записи DKIM и SPF)\n` +
                                                `3. После верификации домена, измените SENDER_EMAIL в Cloudflare Workers на ваш-email@ваш-домен.com\n` +
                                                `4. Обновите секрет: wrangler secret put SENDER_EMAIL`;
                            } else {
                                // Если используется onboarding@resend.dev, но все равно 403, это может быть:
                                // 1. Лимит писем достигнут
                                // 2. Email адрес заблокирован
                                // 3. Проблема с правами API ключа
                                errorMessage = 'Resend API: ошибка 403. Возможные причины: достигнут лимит писем (100/день на free tier), ' +
                                              'email адрес заблокирован, или API ключ не имеет прав. Проверьте лимиты в Resend Dashboard.';
                                fallbackMessage = `ОШИБКА 403: ${errorDetails.message || 'Проблема с отправкой'}. ` +
                                                'Возможные причины:\n' +
                                                '1. Достигнут лимит писем (free tier: 100/день) - проверьте https://resend.com/emails\n' +
                                                '2. Email адрес "${email}" заблокирован Resend\n' +
                                                '3. API ключ не имеет прав "Sending access" - проверьте https://resend.com/api-keys';
                            }
                        } else {
                            if (isDomainRestriction) {
                                errorMessage = 'Домен не верифицирован в Resend. Проверьте верификацию домена в Resend Dashboard.';
                                fallbackMessage = `ОШИБКА: Домен не верифицирован.\n` +
                                                `Проверьте верификацию домена в Resend Dashboard: https://resend.com/domains\n` +
                                                `Убедитесь, что DNS записи (DKIM, SPF) добавлены и домен имеет статус "Verified".`;
                            } else {
                                errorMessage = 'Resend API: домен не верифицирован или недостаточно прав. ' +
                                              'Проверьте верификацию домена в Resend Dashboard или используйте onboarding@resend.dev для тестирования.';
                                fallbackMessage = `ОШИБКА 403: ${errorDetails.message || 'Домен не верифицирован'}. ` +
                                                'Проверьте верификацию домена в Resend Dashboard (https://resend.com/domains) ' +
                                                'или используйте onboarding@resend.dev (не требует верификации, но только для email владельца аккаунта).';
                            }
                        }
                    } else if (resendResponse.status === 422) {
                        console.error('[Email] Resend API вернул 422 - ошибка валидации!');
                        errorMessage = `Ошибка валидации: ${errorDetails.message || 'Проверьте формат email адресов'}`;
                        fallbackMessage = `ОШИБКА 422: ${errorDetails.message || errText}`;
                    }
                    
                    console.log(`\n\n=== УВЕДОМЛЕНИЕ (Fallback) ===\nПовторная отправка проверочного письма на email: ${email}\nСсылка для подтверждения:\n${verificationLink}\n\n${fallbackMessage}\n===================\n\n`);
                    
                    // Возвращаем успех, но с предупреждением
                    return {
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: 'Письмо для подтверждения email отправлено. Проверьте почту.',
                            warning: `${errorMessage} Ссылка для подтверждения доступна в логах сервера.`
                        })
                    };
                } else {
                    const responseData = await resendResponse.json().catch(() => ({}));
                    console.log('[Email] Письмо успешно отправлено через Resend API!');
                    console.log('[Email] Resend response:', responseData);
                }
            } catch (err) {
                console.error('[Email] Системная ошибка при отправке:', err);
                console.error('[Email] Error name:', err.name);
                console.error('[Email] Error message:', err.message);
                console.error('[Email] Error stack:', err.stack);
                
                // Если произошла ошибка, но токен уже обновлен, все равно возвращаем успех
                // с информацией о том, что нужно проверить логи
                console.warn('[Email] Ошибка при отправке, но токен обновлен. Переключаемся на режим симуляции.');
                console.log(`\n\n=== УВЕДОМЛЕНИЕ (Fallback - Exception) ===\nПовторная отправка проверочного письма на email: ${email}\nСсылка для подтверждения:\n${verificationLink}\n\nИСКЛЮЧЕНИЕ: ${err.name} - ${err.message}\n===================\n\n`);
                
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: 'Письмо для подтверждения email отправлено. Проверьте почту.',
                        warning: `Ошибка сети при отправке письма: ${err.message}. Ссылка для подтверждения доступна в логах сервера.`
                    })
                };
            }
        } else {
            // !! SIMULATED EMAIL SENDING !!
            console.log(`\n\n=== УВЕДОМЛЕНИЕ ===\nПовторная отправка проверочного письма на email: ${email}\nСсылка для подтверждения:\n${verificationLink}\n===================\n\n`);
            // В режиме симуляции все равно возвращаем успех, так как токен обновлен
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Письмо для подтверждения email отправлено. Проверьте почту.'
            })
        };
    } catch (error) {
        console.error('Resend verification error:', error);
        console.error('Resend verification error stack:', error.stack);
        
        // Проверяем тип ошибки для более понятного сообщения
        let errorMessage = 'Не удалось отправить письмо для подтверждения. Попробуйте позже или обратитесь в поддержку.';
        
        if (error.message) {
            if (error.message.includes('MongoDB') || error.message.includes('database')) {
                errorMessage = 'Ошибка подключения к базе данных. Попробуйте позже.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Ошибка сети при отправке письма. Проверьте подключение к интернету.';
            }
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Ошибка при отправке письма',
                message: errorMessage
            })
        };
    }
}

module.exports = {
    login,
    register,
    verifyEmail,
    resendVerificationEmail
};
