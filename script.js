const clientId = '1423890573563002933';
const redirectUri = 'https://yasseenassar.github.io';

const azureFunctionBaseUrl = 'https://bros-mc-controller.azurewebsites.net/api';


const isBackendConfigured = !azureFunctionBaseUrl.includes('<YOUR_FUNCTION_APP_NAME_HERE>');
if (!isBackendConfigured) {
    console.warn('Backend URL is not configured. Network features will be disabled. Please edit azureFunctionBaseUrl in script.js.');
}


const loggedOutView = document.getElementById('loggedOutView');
const loggedInView = document.getElementById('loggedInView');
const loginButton = document.getElementById('loginButton');
const welcomeMessage = document.getElementById('welcomeMessage');


window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        
        
        window.history.replaceState({}, document.title, "/");
        exchangeCodeForToken(code);
    } else {
        const accessToken = sessionStorage.getItem('discord_access_token');
        if (accessToken) {
            initializeLoggedInView(accessToken);
        }
    }
};


loginButton.addEventListener('click', () => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify email`;
    window.location.href = discordAuthUrl;
});

function exchangeCodeForToken(code) {
    if (!isBackendConfigured) return;
    fetch(`${azureFunctionBaseUrl}/auth-discord`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to exchange code for token.');
        return response.json();
    })
    .then(data => {
        const accessToken = data.access_token;
        sessionStorage.setItem('discord_access_token', accessToken);
        initializeLoggedInView(accessToken);
    })
    .catch(error => {
        console.error('Token exchange error:', error);
        alert('There was an error logging you in. Please try again.');
    });
}


function initializeLoggedInView(accessToken) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';

    
    fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => response.json())
    .then(user => {
        welcomeMessage.textContent = `Welcome, ${user.username}!`;
        
        setupServerControls(accessToken);
        setupWhitelistFeature(accessToken, user.id);
    });
}

function setupServerControls(accessToken) {
    if (!isBackendConfigured) return;
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const statusButton = document.getElementById('statusButton');
    const statusSpan = document.getElementById('status');
    const serverAddressContainer = document.getElementById('serverAddressContainer');
    const serverAddress = document.getElementById('serverAddress');

    const fetchOptions = (method = 'GET', body = null) => {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
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
        statusSpan.style.color = status === 'Online' ? '#66BB6A' : (status === 'Offline' ? '#FF5733' : '#2196F3');

        if (status === 'Online' && data.address) {
            serverAddress.textContent = data.address;
            serverAddressContainer.style.display = 'block';
        } else {
            serverAddressContainer.style.display = 'none';
        }
    }
}

function setupWhitelistFeature(accessToken, discordId) {
    if (!isBackendConfigured) return;
    const whitelistSection = document.getElementById('whitelistSection');
    const whitelistForm = document.getElementById('whitelist-form');
    const usernameInput = document.getElementById('usernameInput');
    const whitelistButton = document.getElementById('whitelistButton');
    const whitelistMessage = document.getElementById('whitelist-message');

    const fetchOptions = (body) => ({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
    });

    
    fetch(`${azureFunctionBaseUrl}/whitelist-player`, fetchOptions({ action: 'check' }))
    .then(res => res.json())
    .then(data => {
        if (data.isWhitelisted) {
            whitelistSection.innerHTML = `<p>You have already whitelisted the Minecraft account: <strong>${data.minecraftUsername}</strong></p>`;
        }
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
        whitelistMessage.style.color = type === 'success' ? '#66BB6A' : (type === 'error' ? '#FF5733' : '#2196F3');
    }
}
