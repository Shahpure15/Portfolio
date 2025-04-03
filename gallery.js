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
    
    // Create navigation dots (only for original items)
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

    function smoothTransform(element, start, end, duration, onComplete) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smoother easing function
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const current = start + (end - start) * easeProgress;
            element.style.transform = `translateX(${-current}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                isAnimating = false;
                if (onComplete) onComplete();
            }
        }
        
        requestAnimationFrame(update);
    }

    function updateDots(index) {
        const normalizedIndex = index % itemCount;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === normalizedIndex);
        });
    }

    function resetPosition() {
        const itemWidth = items[0].offsetWidth;
        const gap = 20;
        
        if (currentIndex >= itemCount) {
            currentIndex = 0;
            gallery.style.transition = 'none';
            const resetPos = currentIndex * (itemWidth + gap);
            gallery.style.transform = `translateX(-${resetPos}px)`;
            gallery.offsetHeight;
            gallery.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        } else if (currentIndex < 0) {
            currentIndex = itemCount - 1;
            gallery.style.transition = 'none';
            const resetPos = currentIndex * (itemWidth + gap);
            gallery.style.transform = `translateX(-${resetPos}px)`;
            gallery.offsetHeight;
            gallery.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }

    function showImage(index, direction = 0) {
        if (isAnimating) return;
        isAnimating = true;

        items.forEach(item => item.classList.remove('active'));
        
        // Activate both original and cloned items for smooth transition
        const normalizedIndex = ((index % itemCount) + itemCount) % itemCount;
        items[normalizedIndex].classList.add('active');
        items[normalizedIndex + itemCount]?.classList.add('active');
        
        const itemWidth = items[0].offsetWidth;
        const gap = 20;
        const containerWidth = gallery.parentElement.offsetWidth;
        const scrollPosition = normalizedIndex * (itemWidth + gap) - (containerWidth - itemWidth) / 2;
        
        smoothTransform(gallery, currentIndex * (itemWidth + gap), scrollPosition, 600, () => {
            currentIndex = normalizedIndex;
            updateDots(currentIndex);
            resetPosition();
        });
    }

    function nextImage() {
        showImage(currentIndex + 1, 1);
    }

    function prevImage() {
        showImage(currentIndex - 1, -1);
    }

    // Automatic sliding
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

    // Event listeners
    gallery.addEventListener('mouseenter', stopAutoplay);
    gallery.addEventListener('mouseleave', startAutoplay);

    // Update click handlers with debouncing
    let clickTimeout;
    const handleClick = (direction) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        stopAutoplay();
        clickTimeout = setTimeout(() => {
            if (!isAnimating) {
                direction === 'next' ? nextImage() : prevImage();
            }
        }, 50);
        setTimeout(startAutoplay, 3000);
    };

    nextBtn.addEventListener('click', () => handleClick('next'));
    prevBtn.addEventListener('click', () => handleClick('prev'));

    // Modal functionality
    originalItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (index === currentIndex % itemCount) {
                const img = item.querySelector('img');
                modalImg.src = img.src;
                modalImg.alt = img.alt;
                modal.classList.add('active');
            } else {
                showImage(index);
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

    // Keyboard navigation
    let keyTimeout;
    document.addEventListener('keydown', (e) => {
        if (keyTimeout) return;
        keyTimeout = setTimeout(() => {
            keyTimeout = null;
            if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            } else if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        }, 50);
    });

    // Touch handling with improved sensitivity
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
        
        // Calculate swipe velocity for more responsive touch
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

    // Start autoplay on load
    startAutoplay();
    
    // Initial positioning
    resetPosition();
});