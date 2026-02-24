// Генерация случайных данных для постов
export function generateRandomPost() {
    const id = Math.floor(Math.random() * 1000) + 100;
    return {
        id: id,
        title: `Test Post ${id}`,
        body: `This is a test post created at ${new Date().toISOString()}`,
        userId: Math.floor(Math.random() * 10) + 1
    };
}

// Проверка ответа с детальным логированием
export function checkResponse(response, expectedStatus, operation, checks) {
    const success = checks(response, {
        [`${operation} status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
        [`${operation} has body`]: (r) => r.body && r.body.length > 0,
         [`${operation} valid JSON`]: (r) => {
            try {
                JSON.parse(r.body);
                return true;
            } catch (e) {
                return false;
            }
         }
    });

    if (!success) {
        console.error(`❌ ${operation} failed:`, {
            status: response.status,
            statusText: response.status_text,
            body: response.body ? response.body.substring(0, 200) : 'No body' 
        });
    } else {
        console.log(`✅ ${operation} successful (${response.status}) - ${response.timings.duration}ms`);
    }

    return success;
}

// Измерение времени выполнения с меткой
export function measureTime(label, fn) {
    const start = Date.now();
    const result = fn();
    const duration = Data.now() - start;
    console.log(`⏱️  ${label} took ${duration}ms`);
    return result;
}

// Случайная задержка (имитация реального пользователя)
export function randomSleep(minSeconds = 0.5, maxSeconds = 3) {
    const sleepTime = Math.random() * (maxSeconds - minSeconds) + minSeconds;
    console.log(`💤 Sleeping for ${sleepTime.toFixed(2)}s...`);
    return sleepTime
}