// Set current year in footer
document.addEventListener('DOMContentLoaded', function () {
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	// Smooth scroll for internal links
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			const target = document.querySelector(this.getAttribute('href'));
			if (target) {
				e.preventDefault();
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	});
});

// Simple helper to log resume clicks (non-blocking)
document.addEventListener('click', function (e) {
	const el = e.target.closest('a');
	if (!el) return;
	if (el.getAttribute('href') && el.getAttribute('href').includes('resume.pdf')) {
		console.log('Resume download initiated (assets/resume.pdf)');
	}
});
