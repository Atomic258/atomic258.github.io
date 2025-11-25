document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const postIndexList = document.getElementById('post-index-list');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const fullscreenImage = document.getElementById('fullscreen-image');

    let postsData = []; 
    let scrollButtonTimeout = null;

    // Function to calculate reading time
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; 
        const wordCount = text.split(/\s+/).length;
        const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
        return `${readingTimeMinutes} MIN READ`; // Uppercase for the new badge style
    }

    // Function to show scroll buttons and set autohide timer
    function showScrollButtonsWithAutohide() {
        if (scrollButtonTimeout) clearTimeout(scrollButtonTimeout);

        if (window.scrollY > 300) {
            scrollToTopBtn.classList.remove('hidden');
        } else {
            scrollToTopBtn.classList.add('hidden');
        }

        const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
        if (!isAtBottom) {
            scrollToBottomBtn.classList.remove('hidden');
        } else {
            scrollToBottomBtn.classList.add('hidden');
        }

        // Autohide after 2 seconds
        scrollButtonTimeout = setTimeout(() => {
            scrollToTopBtn.classList.add('hidden');
            scrollToBottomBtn.classList.add('hidden');
        }, 2000);
    }

    async function fetchAndDisplayPosts() {
        try {
            // Note: Ensure files.json is in the same directory
            const response = await fetch('files.json');
            const filesJson = await response.json(); 

            const fetchPromises = filesJson.map(async postData => {
                try {
                    const postContentResponse = await fetch(postData.contentFile);
                    if (!postContentResponse.ok) throw new Error('File not found');
                    const postContent = await postContentResponse.text();
                    return {
                        id: postData.id,
                        title: postData.title,
                        images: postData.images || [],
                        content: postContent,
                    };
                } catch (e) {
                    console.warn(`Could not load content for ${postData.title}`);
                    return null;
                }
            });

            // Filter out failed loads
            const results = await Promise.all(fetchPromises);
            postsData = results.filter(p => p !== null);

            // Sort posts (Oldest ID first)
            postsData.sort((a, b) => a.id - b.id);

            renderPosts(postsData);
            renderPostIndex(postsData);

        } catch (error) {
            console.error('Error fetching or parsing posts:', error);
            postList.innerHTML = '<div class="post-card"><p style="text-align:center">Failed to load posts. Please ensure files.json is correct.</p></div>';
        }
    }

    function renderPosts(postsToRender) {
        postList.innerHTML = ''; 
        if (postsToRender.length === 0) {
            postList.innerHTML = '<div class="post-card"><p>No posts found.</p></div>';
            return;
        }

        postsToRender.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.id = `post-${post.id}`;

            const readTime = calculateReadingTime(post.content);

            // Using CSS classes for styling instead of inline line-breaks
            postCard.innerHTML = `
                <h2>${post.title}</h2>
                <span class="read-time">${readTime}</span>
                <div class="post-content"><p>${post.content.replace(/\n/g,'<br>')}</p></div>
                ${post.images.length > 0 ? `
                <div class="carousel" data-post-id="${post.id}">
                    <img src="" alt="Blurred background" class="carousel-background-image">
                    <img src="" alt="Post image" class="carousel-image">
                    <button class="carousel-button prev">&lt;</button>
                    <button class="carousel-button next">&gt;</button>
                </div>
                ` : ''}
            `;
            postList.appendChild(postCard);

            if (post.images.length > 0) {
                setupCarousel(postCard, post.images);
            }
        });
    }

    function setupCarousel(card, images) {
        const carouselImage = card.querySelector('.carousel-image');
        const carouselBgImage = card.querySelector('.carousel-background-image');
        const prevButton = card.querySelector('.prev');
        const nextButton = card.querySelector('.next');

        let currentImageIndex = 0;

        const showImage = (index) => {
            carouselImage.src = images[index];
            carouselBgImage.src = images[index];
        };

        prevButton.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            showImage(currentImageIndex);
        });

        nextButton.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            showImage(currentImageIndex);
        });

        // Simple Swipe Detection
        let touchStartX = 0;
        card.querySelector('.carousel').addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
        card.querySelector('.carousel').addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchEndX < touchStartX - 50) {
                currentImageIndex = (currentImageIndex + 1) % images.length;
                showImage(currentImageIndex);
            }
            if (touchEndX > touchStartX + 50) {
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                showImage(currentImageIndex);
            }
        });

        carouselImage.addEventListener('click', () => {
            fullscreenImage.src = carouselImage.src;
            fullscreenOverlay.classList.remove('hidden');
        });

        showImage(0);
    }

    function renderPostIndex(posts) {
        postIndexList.innerHTML = '';
        posts.forEach(post => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#post-${post.id}`;
            link.textContent = post.title;
            // Smooth scroll on click for the index links
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(`post-${post.id}`).scrollIntoView({behavior: 'smooth'});
            });
            listItem.appendChild(link);
            postIndexList.appendChild(listItem);
        });
    }

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
    fullscreenOverlay.addEventListener('click', () => fullscreenOverlay.classList.add('hidden'));

    fetchAndDisplayPosts();
});
