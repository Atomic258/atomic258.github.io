document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const postList = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const postIndexList = document.getElementById('post-index-list');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    
    // Fullscreen Elements
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const fullscreenImage = document.getElementById('fullscreen-image');
    const fullscreenPrevBtn = document.getElementById('fullscreen-prev');
    const fullscreenNextBtn = document.getElementById('fullscreen-next');
    const fullscreenCloseBtn = document.getElementById('fullscreen-close');
    
    const themeToggle = document.getElementById('theme-toggle');

    let postsData = []; 
    let scrollButtonTimeout = null;

    // Fullscreen State
    let currentFullscreenImages = [];
    let currentFullscreenIndex = 0;

    // --- Theme Logic ---
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }

    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    initTheme();

    // --- Helpers ---
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; 
        const wordCount = text.split(/\s+/).length;
        const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
        return `${readingTimeMinutes} MIN READ`;
    }

    function showScrollButtonsWithAutohide() {
        if (scrollButtonTimeout) clearTimeout(scrollButtonTimeout);

        // Show buttons (remove invisible class)
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.remove('invisible');
        } else {
            scrollToTopBtn.classList.add('invisible');
        }

        const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
        if (!isAtBottom) {
            scrollToBottomBtn.classList.remove('invisible');
        } else {
            scrollToBottomBtn.classList.add('invisible');
        }

        // Autohide (fade out) after 2 seconds
        scrollButtonTimeout = setTimeout(() => {
            scrollToTopBtn.classList.add('invisible');
            scrollToBottomBtn.classList.add('invisible');
        }, 2000);
    }

    // --- Fetching ---
    async function fetchAndDisplayPosts() {
        try {
            const response = await fetch('files.json');
            if (!response.ok) throw new Error('Failed to load files.json');
            const filesJson = await response.json(); 

            const fetchPromises = filesJson.map(async postData => {
                try {
                    const postContentResponse = await fetch(postData.contentFile);
                    if (!postContentResponse.ok) return null;
                    const postContent = await postContentResponse.text();
                    return {
                        id: postData.id,
                        title: postData.title,
                        images: postData.images || [],
                        content: postContent,
                    };
                } catch (e) {
                    console.warn('Skipping post due to error:', postData.title);
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);
            postsData = results.filter(p => p !== null).sort((a, b) => a.id - b.id);

            renderPosts(postsData);
            renderPostIndex(postsData);

        } catch (error) {
            console.error('Error:', error);
            postList.innerHTML = '<div class="post-card"><p>Could not load posts. Ensure files.json exists.</p></div>';
        }
    }

    // --- Rendering ---
    function renderPosts(postsToRender) {
        postList.innerHTML = ''; 
        if (postsToRender.length === 0) {
            postList.innerHTML = '<div class="post-card"><p>No posts match your search.</p></div>';
            return;
        }

        postsToRender.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.id = `post-${post.id}`;

            const readTime = calculateReadingTime(post.content);

            // Conditional rendering for carousel buttons
            const showButtons = post.images.length > 1;

            postCard.innerHTML = `
                <h2>${post.title}</h2>
                <span class="read-time">${readTime}</span>
                <p>${post.content.replace(/\n/g,'<br>')}</p>
                ${post.images.length > 0 ? `
                <div class="carousel" data-post-id="${post.id}">
                    <img src="" alt="Background" class="carousel-background-image">
                    <img src="" alt="Post Content" class="carousel-image">
                    ${showButtons ? `<button class="carousel-button prev">&lt;</button>` : ''}
                    ${showButtons ? `<button class="carousel-button next">&gt;</button>` : ''}
                </div>
                ` : ''}
            `;
            postList.appendChild(postCard);

            if (post.images.length > 0) {
                setupCarousel(postCard, post.images);
            }
        });
    }

    // --- Carousel Logic ---
    function setupCarousel(card, images) {
        const carouselImage = card.querySelector('.carousel-image');
        const carouselBgImage = card.querySelector('.carousel-background-image');
        const prevButton = card.querySelector('.prev');
        const nextButton = card.querySelector('.next');

        let currentImageIndex = 0;

        const showImage = (index) => {
            const nextIndex = (index + 1) % images.length;
            const preloadImg = new Image();
            preloadImg.src = images[nextIndex];

            carouselImage.style.opacity = '0.8'; 
            setTimeout(() => {
                carouselImage.src = images[index];
                carouselBgImage.src = images[index];
                carouselImage.style.opacity = '1';
            }, 100);
        };

        // Only attach listeners if buttons exist
        if (prevButton && nextButton) {
            prevButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Critical for mobile
                e.preventDefault(); // Prevent ghost clicks
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                showImage(currentImageIndex);
            });

            nextButton.addEventListener('click', (e) => {
                e.stopPropagation(); 
                e.preventDefault();
                currentImageIndex = (currentImageIndex + 1) % images.length;
                showImage(currentImageIndex);
            });
        }

        // Swipe support (Works alongside buttons)
        let touchStartX = 0;
        const carousel = card.querySelector('.carousel');
        
        if (images.length > 1) {
            carousel.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
            carousel.addEventListener('touchend', e => {
                const touchEndX = e.changedTouches[0].clientX;
                // Only trigger if swipe is significant (>50px)
                if (touchEndX < touchStartX - 50) {
                    currentImageIndex = (currentImageIndex + 1) % images.length;
                    showImage(currentImageIndex);
                }
                if (touchEndX > touchStartX + 50) {
                    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                    showImage(currentImageIndex);
                }
            });
        }

        // Open Fullscreen
        carouselImage.addEventListener('click', () => {
            openFullscreen(images, currentImageIndex);
        });

        // Initialize
        carouselImage.src = images[0];
        carouselBgImage.src = images[0];
    }

    // --- Fullscreen Logic ---
    function openFullscreen(images, startIndex) {
        currentFullscreenImages = images;
        currentFullscreenIndex = startIndex;
        
        fullscreenImage.src = images[currentFullscreenIndex];
        fullscreenOverlay.classList.remove('hidden-overlay');

        // Hide prev/next if only 1 image
        if (images.length <= 1) {
            fullscreenPrevBtn.style.display = 'none';
            fullscreenNextBtn.style.display = 'none';
        } else {
            fullscreenPrevBtn.style.display = 'flex';
            fullscreenNextBtn.style.display = 'flex';
        }
    }

    function closeFullscreen() {
        fullscreenOverlay.classList.add('hidden-overlay');
        fullscreenImage.src = ""; // Clear src to stop memory leaks/flickers
    }

    function nextFullscreenImage(e) {
        if(e) e.stopPropagation();
        currentFullscreenIndex = (currentFullscreenIndex + 1) % currentFullscreenImages.length;
        fullscreenImage.src = currentFullscreenImages[currentFullscreenIndex];
    }

    function prevFullscreenImage(e) {
        if(e) e.stopPropagation();
        currentFullscreenIndex = (currentFullscreenIndex - 1 + currentFullscreenImages.length) % currentFullscreenImages.length;
        fullscreenImage.src = currentFullscreenImages[currentFullscreenIndex];
    }

    // Fullscreen Event Listeners
    fullscreenPrevBtn.addEventListener('click', prevFullscreenImage);
    fullscreenNextBtn.addEventListener('click', nextFullscreenImage);
    fullscreenCloseBtn.addEventListener('click', closeFullscreen);
    
    // Close on background click (but not image click)
    fullscreenOverlay.addEventListener('click', (e) => {
        if (e.target === fullscreenOverlay) {
            closeFullscreen();
        }
    });

    // Keyboard support for fullscreen
    document.addEventListener('keydown', (e) => {
        if (fullscreenOverlay.classList.contains('hidden-overlay')) return;
        
        if (e.key === 'Escape') closeFullscreen();
        if (e.key === 'ArrowRight') nextFullscreenImage();
        if (e.key === 'ArrowLeft') prevFullscreenImage();
    });

    // --- Index Links ---
    function renderPostIndex(posts) {
        postIndexList.innerHTML = '';
        posts.forEach(post => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#post-${post.id}`;
            link.textContent = post.title;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(`post-${post.id}`);
                if (target) {
                    target.scrollIntoView({behavior: 'smooth'});
                }
            });
            listItem.appendChild(link);
            postIndexList.appendChild(listItem);
        });
    }

    // --- Search & Scroll ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPosts = postsData.filter(post =>
            post.title.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm)
        );
        renderPosts(filteredPosts);
    });

    scrollToBottomBtn.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', showScrollButtonsWithAutohide);
    
    // Initial fetch
    fetchAndDisplayPosts();
});
