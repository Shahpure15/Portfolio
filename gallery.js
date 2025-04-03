document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.image-gallery');
    const originalItems = document.querySelectorAll('.gallery-item');
    const prevBtn = document.querySelector('.gallery-nav.prev');
    const nextBtn = document.querySelector('.gallery-nav.next');
    const modal = document.querySelector('.modal');
    const modalImg = modal.querySelector('img');
    const closeModal = modal.querySelector('.close-modal');
    const dotsContainer = document.querySelector('.gallery-dots');
    
    // Clone items for infinite scroll
    originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('clone');
        gallery.appendChild(clone);
    });

    const items = document.querySelectorAll('.gallery-item');
    const itemCount = originalItems.length;
    let currentIndex = 0;
    let isAnimating = false;

    // Create navigation dots
    originalItems.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
            if (!isAnimating && currentIndex !== index) {
                showImage(index);
            }
        });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.gallery-dot');

    // Set initial active state
    items[currentIndex].classList.add('active');

    function updateGalleryPosition(index, instant = false) {
        const itemWidth = items[0].offsetWidth;
        const gap = 20;
        const containerWidth = gallery.parentElement.offsetWidth;
        const offset = (containerWidth - itemWidth) / 2;
        const position = index * (itemWidth + gap) - offset + gap;

        if (instant) {
            gallery.style.transition = 'none';
            gallery.style.transform = `translateX(-${position}px)`;
            gallery.offsetHeight; // Force reflow
            gallery.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            gallery.style.transform = `translateX(-${position}px)`;
        }
    }

    function showImage(index) {
        if (isAnimating) return;
        isAnimating = true;

        items.forEach(item => item.classList.remove('active'));
        
        const normalizedIndex = ((index % itemCount) + itemCount) % itemCount;
        items[normalizedIndex].classList.add('active');
        items[normalizedIndex + itemCount]?.classList.add('active');
        
        updateGalleryPosition(normalizedIndex);
        
        setTimeout(() => {
            currentIndex = normalizedIndex;
            updateDots(currentIndex);
            isAnimating = false;
        }, 600);
    }

    function updateDots(index) {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function nextImage() {
        showImage(currentIndex + 1);
    }

    function prevImage() {
        showImage(currentIndex - 1);
    }

    // Reset gallery position when reaching ends
    function checkBoundary() {
        if (currentIndex >= itemCount) {
            currentIndex = 0;
            updateGalleryPosition(currentIndex, true);
        } else if (currentIndex < 0) {
            currentIndex = itemCount - 1;
            updateGalleryPosition(currentIndex, true);
        }
    }

    // Event Listeners
    gallery.addEventListener('transitionend', () => {
        checkBoundary();
    });

    // Autoplay functionality
    let autoplayInterval;
    
    function startAutoplay() {
        if (autoplayInterval) clearInterval(autoplayInterval);
        autoplayInterval = setInterval(nextImage, 5000);
    }
    
    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    // Mouse and touch events
    gallery.addEventListener('mouseenter', stopAutoplay);
    gallery.addEventListener('mouseleave', startAutoplay);

    const handleClick = (direction) => {
        stopAutoplay();
        if (!isAnimating) {
            direction === 'next' ? nextImage() : prevImage();
        }
        setTimeout(startAutoplay, 3000);
    };

    nextBtn.addEventListener('click', () => handleClick('next'));
    prevBtn.addEventListener('click', () => handleClick('prev'));

    // Modal functionality
    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            const normalizedIndex = index % itemCount;
            if (normalizedIndex === currentIndex) {
                const img = item.querySelector('img');
                modalImg.src = img.src;
                modalImg.alt = img.alt;
                modal.classList.add('active');
            } else {
                showImage(normalizedIndex);
            }
        });
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Touch handling
    let touchStartX = 0;
    let touchStartTime = 0;
    
    gallery.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartTime = Date.now();
        stopAutoplay();
    }, { passive: true });
    
    gallery.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndTime = Date.now();
        const diffX = touchStartX - touchEndX;
        const diffTime = touchEndTime - touchStartTime;
        
        const velocity = Math.abs(diffX) / diffTime;
        
        if (Math.abs(diffX) > 30 || velocity > 0.5) {
            if (diffX > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }
        
        setTimeout(startAutoplay, 3000);
    }, { passive: true });

    // Initialize
    updateGalleryPosition(currentIndex);
    startAutoplay();

    // Window resize handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateGalleryPosition(currentIndex, true);
        }, 100);
    });
});