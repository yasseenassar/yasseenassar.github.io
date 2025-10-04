const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusButton = document.getElementById('statusButton');
const statusSpan = document.getElementById('status');
const usernameInput = document.getElementById('usernameInput');
const whitelistButton = document.getElementById('whitelistButton');
const whitelistForm = document.getElementById('whitelist-form');
const whitelistMessage = document.getElementById('whitelist-message');

// TODO: Replace with your actual Azure Function App URL
const azureFunctionBaseUrl = 'https://your-function-app-name.azurewebsites.net/api';
// TODO: Replace with your actual API key
const apiKey = 'YOUR_API_KEY';

const startServerUrl = `${azureFunctionBaseUrl}/start-server`;
const stopServerUrl = `${azureFunctionBaseUrl}/stop-server`;
const getServerStatusUrl = `${azureFunctionBaseUrl}/get-server-status`;
const whitelistPlayerUrl = `${azureFunctionBaseUrl}/whitelist-player`;

const fetchOptions = (method = 'GET', body = null) => {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'x-functions-key': apiKey
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return options;
};

startButton.addEventListener('click', () => {
    setStatus('Starting...');
    fetch(startServerUrl, fetchOptions('POST'))
        .then(response => response.json())
        .then(data => {
            setStatus(data.status || 'Online');
        })
        .catch(error => {
            console.error('Error starting server:', error);
            setStatus('Error');
        });
});

stopButton.addEventListener('click', () => {
    setStatus('Stopping...');
    fetch(stopServerUrl, fetchOptions('POST'))
        .then(response => response.json())
        .then(data => {
            setStatus(data.status || 'Offline');
        })
        .catch(error => {
            console.error('Error stopping server:', error);
            setStatus('Error');
        });
});

statusButton.addEventListener('click', () => {
    setStatus('Checking...');
    fetch(getServerStatusUrl, fetchOptions())
        .then(response => response.json())
        .then(data => {
            setStatus(data.status || 'Unknown');
        })
        .catch(error => {
            console.error('Error checking status:', error);
            setStatus('Error');
        });
});

whitelistButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username) {
        setWhitelistMessage('Please enter a username.', 'error');
        return;
    }

    setWhitelistMessage('Validating and whitelisting...', 'loading');

    fetch(whitelistPlayerUrl, fetchOptions('POST', { username: username }))
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Whitelist failed') });
            }
            return response.json();
        })
        .then(data => {
            setWhitelistMessage(data.message || 'Successfully whitelisted!', 'success');
            whitelistForm.style.display = 'none';
        })
        .catch(error => {
            console.error('Error whitelisting player:', error);
            setWhitelistMessage(error.message, 'error');
        });
});

function setStatus(status) {
    statusSpan.textContent = status;
    switch (status.toLowerCase()) {
        case 'online':
            statusSpan.style.color = '#66BB6A'; // Green
            break;
        case 'offline':
            statusSpan.style.color = '#FF5733'; // Red
            break;
        default:
            statusSpan.style.color = '#2196F3'; // Blue for intermediate states
            break;
    }
}

function setWhitelistMessage(message, type) {
    whitelistMessage.textContent = message;
    switch (type) {
        case 'success':
            whitelistMessage.style.color = '#66BB6A'; // Green
            break;
        case 'error':
            whitelistMessage.style.color = '#FF5733'; // Red
            break;
        case 'loading':
            whitelistMessage.style.color = '#2196F3'; // Blue
            break;
        default:
            whitelistMessage.style.color = '#FFFFFF'; // White
            break;
    }
}
