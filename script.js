const projectDisplay = document.getElementById('project-display');
const generateBtn = document.getElementById('generate-btn');

const projects = [
    'Build a personal portfolio website.',
    'Create a weather app that fetches data from an API.',
    'Develop a simple to-do list application.',
    'Build a recipe book where users can add and view recipes.',
    'Create a blog application with a simple CMS.',
    'Develop a chat application using WebSockets.',
    'Build a simple e-commerce site with a shopping cart.',
    'Create a memory game.',
    'Develop a URL shortener service.',
    'Build a simple quiz application.',
    'Create a countdown timer.',
    'Develop a simple drawing application.',
    'Build a random quote generator.',
    'Create a simple calculator.',
    'Develop a Pomodoro timer.',
];

generateBtn.addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * projects.length);
    const randomProject = projects[randomIndex];
    projectDisplay.innerHTML = `<p>${randomProject}</p>`;
});
