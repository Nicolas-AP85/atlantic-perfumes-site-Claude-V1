const contactForm = document.getElementById('contactForm');
if (contactForm) {
    const submitBtn = document.getElementById('contactSubmit');
    const statusEl = document.getElementById('formStatus');

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        try {
            const response = await fetch(
                'https://formsubmit.co/ajax/atlantic.perfumes1@gmail.com',
                {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: new FormData(contactForm),
                }
            );

            if (!response.ok) throw new Error('Request failed');

            contactForm.reset();
            statusEl.textContent = 'Merci, votre demande a bien été envoyée. Nous vous recontactons rapidement.';
            statusEl.classList.add('success');
        } catch (error) {
            statusEl.textContent = "Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous écrire directement à atlantic.perfumes1@gmail.com.";
            statusEl.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Être recontacté';
        }
    });
}

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// The reveal animation transforms elements far outside their normal box
// (large translateX) before they appear. That transformed geometry is what
// IntersectionObserver measures, so elements shifted past the viewport edge
// never register as "intersecting" and never reveal. offsetTop/offsetParent
// are unaffected by transform, so we use them to find each element's true
// scroll position instead, and drive visibility purely from window.scrollY.
function getDocumentTop(el) {
    let top = 0;
    let node = el;
    while (node) {
        top += node.offsetTop || 0;
        node = node.offsetParent;
    }
    return top;
}

const revealTargets = Array.from(document.querySelectorAll('.fade-in')).map((el) => ({
    el,
    top: getDocumentTop(el),
    height: el.offsetHeight,
}));

const REVEAL_MARGIN = 150;
// Fraction of the viewport height at which content reveals while scrolling
// down, and where already-revealed content exits while scrolling up - both
// centered on the middle of the screen rather than right at the edges.
const CENTER_FRACTION = 0.5;
// When bringing earlier content back into view while scrolling up, reveal
// much closer to the top edge instead of at the same CENTER_FRACTION line.
// Using the wide center-based check here too would let an element that
// just exited (crossing CENTER_FRACTION while scrolling up) immediately
// satisfy this same condition again on the very next tick - it's still
// well above that line - causing a flicker instead of a clean exit.
const TOP_ENTRY_FRACTION = 0.15;
let lastScrollY = window.scrollY;
let lastDirection = 'down';
let isInitialPass = true;

function updateReveal() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;

    if (scrollY < lastScrollY) lastDirection = 'up';
    else if (scrollY > lastScrollY) lastDirection = 'down';
    lastScrollY = scrollY;

    // Mirror the fly-in/fly-out direction to whichever way the page is
    // currently being scrolled, so elements re-appearing while scrolling up
    // arrive from the left instead of replaying the "scrolling down" motion.
    const flyX = lastDirection === 'up' ? '-320px' : '320px';

    revealTargets.forEach(({ el, top, height }) => {
        const elTop = top - scrollY;
        const elBottom = elTop + height;
        // On the very first pass (page load, possibly already scrolled to
        // a #hash), reveal anything already on screen immediately - it
        // isn't "arriving" via scroll, so there's no motion to time against
        // the middle of the viewport; waiting for it would mean it just
        // never appears at all.
        const isWithinRange = isInitialPass
            ? elBottom > -REVEAL_MARGIN && elTop < viewportHeight + REVEAL_MARGIN
            : lastDirection === 'up'
                ? elBottom > -REVEAL_MARGIN && elTop < viewportHeight * TOP_ENTRY_FRACTION
                : elBottom > -REVEAL_MARGIN && elTop < viewportHeight * CENTER_FRACTION;
        const isVisible = el.classList.contains('visible');

        if (!isVisible) {
            // Not yet revealed: keep it pre-positioned on the side matching
            // the current scroll direction, snapped instantly (no transition,
            // it's invisible so this is imperceptible), so it animates in
            // from the correct side whenever it does enter view.
            if (el.dataset.flyX !== flyX) {
                el.style.transition = 'none';
                el.style.setProperty('--fly-x', flyX);
                void el.offsetHeight;
                el.style.transition = '';
                el.dataset.flyX = flyX;
            }
            if (isWithinRange) {
                el.classList.add('visible');
            }
        } else if (
            lastDirection === 'up' &&
            el.dataset.exempt !== 'true' &&
            elTop > viewportHeight * CENTER_FRACTION
        ) {
            // Already revealed elements only ever leave while actively
            // scrolling up, once they've been pushed past the middle of the
            // screen. Elements explicitly marked "exempt" (the hero CTA)
            // never leave at all. Continuing to scroll down never hides
            // anything either way; everything stays fixed.
            el.style.setProperty('--fly-x', flyX); // '-320px': exit to the left
            el.dataset.flyX = flyX;
            el.classList.remove('visible');
        }
    });
}

let revealTicking = false;
function onScrollOrResize() {
    if (revealTicking) return;
    revealTicking = true;
    requestAnimationFrame(() => {
        updateReveal();
        revealTicking = false;
    });
}

window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', () => {
    revealTargets.forEach((target) => {
        target.top = getDocumentTop(target.el);
        target.height = target.el.offsetHeight;
    });
    updateReveal();
});
window.addEventListener('load', () => {
    revealTargets.forEach((target) => {
        target.top = getDocumentTop(target.el);
        target.height = target.el.offsetHeight;
    });
    // A #hash in the URL causes the browser's own scroll-to-anchor jump,
    // which can happen after this script has already run once - keep
    // treating this as the "initial" pass until after it's accounted for.
    updateReveal();
    isInitialPass = false;
});

updateReveal();
