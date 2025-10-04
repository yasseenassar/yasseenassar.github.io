const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusButton = document.getElementById('statusButton');
const statusSpan = document.getElementById('status');

// TODO: Replace these placeholder URLs with your actual Azure Function URLs
const azureFunctionBaseUrl = 'https://your-function-app-name.azurewebsites.net/api';
const startServerUrl = `${azureFunctionBaseUrl}/start-server`;
const stopServerUrl = `${azureFunctionBaseUrl}/stop-server`;
const getServerStatusUrl = `${azureFunctionBaseUrl}/get-server-status`;

startButton.addEventListener('click', () => {
    setStatus('Starting...');
    fetch(startServerUrl, { method: 'POST' })
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
    fetch(stopServerUrl, { method: 'POST' })
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
    fetch(getServerStatusUrl)
        .then(response => response.json())
        .then(data => {
            setStatus(data.status || 'Unknown');
        })
        .catch(error => {
            console.error('Error checking status:', error);
            setStatus('Error');
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