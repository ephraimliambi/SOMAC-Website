const toggleButton = document.querySelector('#navbar-toggle');  // Select the toggle button for the navigation menu
const navLinks = document.querySelector('#navbar-links');      // Select the navigation links container

toggleButton.addEventListener('click', () => {             // Add a click event listener to the toggle button
  navLinks.classList.toggle('active');             
  // Toggle the 'active' class on the navigation links container to show/hide the menu

  // Keep accessibility in sync: tell screen readers if menu is open
  const isExpanded = navLinks.classList.contains('active');
  toggleButton.setAttribute('aria-expanded', isExpanded);
});
