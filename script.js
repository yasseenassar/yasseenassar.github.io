const azureFunctionBaseUrl = 'https://bros-mc-controller.azurewebsites.net/api';

const isBackendConfigured = !azureFunctionBaseUrl.includes('<YOUR_FUNCTION_APP_NAME_HERE>');
const authEndpoints = {
    status: `${azureFunctionBaseUrl}/auth/status`,
    loginUrl: `${azureFunctionBaseUrl}/auth/login-url`,
    logout: `${azureFunctionBaseUrl}/auth/logout`
};

let minecraftFeaturesInitialized = false;

if (!isBackendConfigured) {
    console.warn('Backend URL is not configured. Network features will be disabled. Please edit azureFunctionBaseUrl in script.js.');
}

window.onload = () => {
    if (document.body.classList.contains('minecraft-body')) {
        initializeMinecraftExperience();
    }
};

function initializeMinecraftExperience() {
    setControlButtonsDisabled(true);
    initializeDiscordGate();
}

function bootstrapMinecraftFeatures() {
    if (!minecraftFeaturesInitialized) {
        initializeServerControls();
        initializeWhitelistFeature();
        minecraftFeaturesInitialized = true;
    }
    setControlButtonsDisabled(false);
}

function initializeServerControls() {
    if (!isBackendConfigured) return;
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const statusButton = document.getElementById('statusButton');
    const statusSpan = document.getElementById('status');
    const statusIndicator = document.getElementById('statusIndicator');
    const serverAddressContainer = document.getElementById('serverAddressContainer');
    const serverAddress = document.getElementById('serverAddress');

    const fetchOptions = (method = 'GET', body = null) => {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };
        if (body) options.body = JSON.stringify(body);
        return options;
    };

    startButton.addEventListener('click', () => {
        setStatus({ status: 'Starting...' });
        fetch(`${azureFunctionBaseUrl}/start-server`, fetchOptions('POST')).then(handleResponse).catch(handleError);
    });

    stopButton.addEventListener('click', () => {
        setStatus({ status: 'Stopping...' });
        fetch(`${azureFunctionBaseUrl}/stop-server`, fetchOptions('POST')).then(handleResponse).catch(handleError);
    });

    statusButton.addEventListener('click', () => {
        setStatus({ status: 'Checking...' });
        fetch(`${azureFunctionBaseUrl}/get-server-status`, fetchOptions()).then(handleResponse).catch(handleError);
    });

    function handleResponse(response) {
        if (!response.ok) return response.json().then(err => { throw new Error(err.message) });
        return response.json().then(data => setStatus(data));
    }
    function handleError(error) {
        console.error('Server control error:', error);
        setStatus({ status: 'Error' });
    }
    function setStatus(data) {
        const status = data.status || 'Unknown';
        statusSpan.textContent = status;
        const normalized = status.toLowerCase();
        let color = '#38bdf8';
        let shadow = '0 0 12px rgba(56, 189, 248, 0.6)';

        if (normalized === 'online') {
            color = '#4ade80';
            shadow = '0 0 12px rgba(74, 222, 128, 0.75)';
        } else if (normalized === 'offline') {
            color = '#f87171';
            shadow = '0 0 12px rgba(248, 113, 113, 0.7)';
        } else if (normalized === 'starting...' || normalized === 'stopping...') {
            color = '#facc15';
            shadow = '0 0 12px rgba(250, 204, 21, 0.6)';
        } else if (normalized === 'error') {
            color = '#f87171';
            shadow = '0 0 12px rgba(248, 113, 113, 0.7)';
        }

        statusSpan.style.color = color;

        if (statusIndicator) {
            statusIndicator.classList.toggle('online', normalized === 'online');
            statusIndicator.style.backgroundColor = color;
            statusIndicator.style.boxShadow = shadow;
        }

        if (normalized === 'online' && data.address) {
            serverAddress.textContent = data.address;
            serverAddressContainer.style.display = 'block';
        } else {
            serverAddressContainer.style.display = 'none';
        }
    }
}

function initializeWhitelistFeature() {
    if (!isBackendConfigured) return;
    const whitelistForm = document.getElementById('whitelist-form');
    const usernameInput = document.getElementById('usernameInput');
    const whitelistButton = document.getElementById('whitelistButton');
    const whitelistMessage = document.getElementById('whitelist-message');

    const fetchOptions = (body) => ({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'include'
    });

    whitelistButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (!username) {
            setWhitelistMessage('Please enter a username.', 'error');
            return;
        }
        setWhitelistMessage('Validating and whitelisting...', 'loading');

        fetch(`${azureFunctionBaseUrl}/whitelist-player`, fetchOptions({ action: 'add', username: username }))
        .then(response => {
            if (!response.ok) return response.json().then(err => { throw new Error(err.message) });
            return response.json();
        })
        .then(data => {
            setWhitelistMessage(data.message, 'success');
            whitelistForm.style.display = 'none';
        })
        .catch(error => {
            console.error('Whitelist error:', error);
            setWhitelistMessage(error.message, 'error');
        });
    });

    function setWhitelistMessage(message, type) {
        whitelistMessage.textContent = message;
        const palette = {
            success: '#4ade80',
            error: '#f87171',
            loading: '#38bdf8'
        };
        whitelistMessage.style.color = palette[type] || palette.loading;
    }
}

function initializeDiscordGate() {
    const gate = document.getElementById('authGate');
    if (!gate) return true;

    const loginButton = document.getElementById('discordLoginButton');
    const logoutButton = document.getElementById('discordLogoutButton');
    const statusMessage = document.getElementById('authStatusMessage');

    if (!isBackendConfigured) {
        if (statusMessage) {
            statusMessage.textContent = 'Server controls are offline. Configure azureFunctionBaseUrl to enable Discord verification.';
            statusMessage.style.color = '#f87171';
        }
        if (loginButton) {
            loginButton.disabled = true;
        }
        setControlButtonsDisabled(true);
        return false;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success' && statusMessage) {
        statusMessage.textContent = 'Discord verification complete! One moment while we prepare your controls.';
        statusMessage.style.color = '#38bdf8';
    } else if (params.get('auth') === 'error' && statusMessage) {
        statusMessage.textContent = 'Discord verification failed. Please try again.';
        statusMessage.style.color = '#f87171';
    }
    if (params.has('auth')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const applyAuthState = (authenticated, data = {}) => {
        if (authenticated) {
            gate.classList.add('auth-gate--hidden');
            if (statusMessage) {
                const username = data.username || data.user?.username;
                statusMessage.textContent = username ? `Signed in as ${username}` : 'Verified via Discord';
                statusMessage.style.color = '#a7f3d0';
            }
            if (logoutButton) {
                logoutButton.style.display = 'inline-flex';
            }
            setControlButtonsDisabled(false);
            bootstrapMinecraftFeatures();
        } else {
            gate.classList.remove('auth-gate--hidden');
            if (statusMessage) {
                statusMessage.textContent = 'Sign in with Discord to unlock the server controls.';
                statusMessage.style.color = '';
            }
            if (logoutButton) {
                logoutButton.style.display = 'none';
            }
            setControlButtonsDisabled(true);
        }
    };

    const fetchAuthStatus = async () => {
        try {
            const response = await fetch(authEndpoints.status, { credentials: 'include' });
            if (!response.ok) {
                applyAuthState(false);
                return false;
            }
            const data = await response.json();
            const authenticated = Boolean(data.authenticated);
            applyAuthState(authenticated, data);
            return authenticated;
        } catch (error) {
            console.error('Auth status check failed:', error);
            if (statusMessage) {
                statusMessage.textContent = 'We could not reach the auth service. Please refresh or try again shortly.';
                statusMessage.style.color = '#f87171';
            }
            applyAuthState(false);
            return false;
        }
    };

    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            loginButton.disabled = true;
            if (statusMessage) {
                statusMessage.textContent = 'Opening Discord...';
                statusMessage.style.color = '#38bdf8';
            }
            try {
                const response = await fetch(authEndpoints.loginUrl, { credentials: 'include' });
                if (!response.ok) throw new Error('Unable to fetch login URL');
                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error('Login URL missing in response');
                }
            } catch (error) {
                console.error('Discord login initiation failed:', error);
                if (statusMessage) {
                    statusMessage.textContent = 'Could not start Discord sign-in. Please try again.';
                    statusMessage.style.color = '#f87171';
                }
                loginButton.disabled = false;
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            logoutButton.disabled = true;
            if (statusMessage) {
                statusMessage.textContent = 'Signing out...';
                statusMessage.style.color = '#38bdf8';
            }
            try {
                await fetch(authEndpoints.logout, { method: 'POST', credentials: 'include' });
            } catch (error) {
                console.error('Discord logout failed:', error);
            } finally {
                await fetchAuthStatus();
                logoutButton.disabled = false;
            }
        });
    }

    return fetchAuthStatus();
}

function setControlButtonsDisabled(disabled) {
    const controlIds = ['startButton', 'stopButton', 'statusButton', 'whitelistButton'];
    controlIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = disabled;
            element.setAttribute('aria-disabled', String(disabled));
        }
    });
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.disabled = disabled;
        usernameInput.setAttribute('aria-disabled', String(disabled));
    }
}
