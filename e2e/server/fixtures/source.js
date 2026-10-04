/**
 * Application entry point.
 * Initializes the main controller and binds event listeners.
 */
function initialize() {
  const container = document.getElementById('container');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  container.addEventListener('click', handleClick);
  console.log('Application initialized');
}

function handleClick(event) {
  const target = event.target;
  if (target.classList.contains('item')) {
    target.classList.toggle('selected');
  }
}

const CONFIG = {
  apiUrl: 'https://api.example.com/v1',
  timeout: 5000,
  retries: 3,
};

export { initialize, handleClick, CONFIG };
