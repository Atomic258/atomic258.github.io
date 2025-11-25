document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');
    const searchInput = document.getElementById('search-input');
    const postIndexList = document.getElementById('post-index-list');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const fullscreenImage = document.getElementById('fullscreen-image');

    let postsData = []; // This will store the parsed data from files.json
    let scrollButtonTimeout = null;

    // Function to calculate reading time
    function calculateReadingTime(text) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = text.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTimeMinutes} min read`;
    }

    // Function to show scroll buttons and set autohide timer
    function showScrollButtonsWithAutohide() {
    // Clear existing timeout
    if (scrollButtonTimeout) {
    clearTimeout(scrollButtonTimeout);
    }

    // Show buttons based on scroll position
    if (window.scrollY > 200) {
    scrollToTopBtn.classList.remove('hidden');
    }

    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100;
    if (!isAtBottom) {
    scrollToBottomBtn.classList.remove('hidden');
    }

    // Set autohide timer for 1.5 seconds
    scrollButtonTimeout = setTimeout(() => {
    scrollToTopBtn.classList.add('hidden');
    scrollToBottomBtn.classList.add('hidden');
    }, 1500);
    }

    // Function to fetch and display posts
    async function fetchAndDisplayPosts() {
    try {
    const response = await fetch('files.json');
    const filesJson = await response.json(); // filesJson is now an array, not an object with a 'posts' key

    // Fetch content for each post
    // Iterate directly over the array of post objects
    const fetchPromises = filesJson.map(async postData => {
    const postContentResponse = await fetch(postData.contentFile); // Use postData.contentFile
    const postContent = await postContentResponse.text();
    return {
    id: postData.id,
    title: postData.title,
    images: postData.images || [],
    content: postContent,
    // No 'date' in your files.json, so we'll sort by ID
    };
    });

    postsData = await Promise.all(fetchPromises);

    // Sort posts from oldest to newest based on ID
    postsData.sort((a, b) => a.id - b.id);

    renderPosts(postsData);
    renderPostIndex(postsData);

    } catch (error) {
    console.error('Error fetching or parsing posts:', error);
    postList.innerHTML = '<p>Failed to load posts. Please try again later.</p>';
    }
    }

    // Function to render posts as cards
    function renderPosts(postsToRender) {
    postList.innerHTML = ''; // Clear existing posts
    if (postsToRender.length === 0) {
    postList.innerHTML = '<p>No posts found.</p>';
    return;
    }

    postsToRender.forEach(post => {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.id = `post-${post.id}`; // Add ID for direct linking

    const readTime = calculateReadingTime(post.content);

    postCard.innerHTML = `
    <h2>${post.title}</h2>
    <span class="read-time">${readTime}</span>
    <p>${post.content.replace(/\n/g,'<br>')}</p> <!-- Display full content, replace newlines with <br> -->
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

    // Initialize carousel if images exist
    if (post.images.length > 0) {
    const carousel = postCard.querySelector('.carousel');
    const carouselImage = carousel.querySelector('.carousel-image');
    const carouselBgImage = carousel.querySelector('.carousel-background-image');
    const prevButton = carousel.querySelector('.prev');
    const nextButton = carousel.querySelector('.next');

    let currentImageIndex = 0;

    const showImage = (index) => {
    carouselImage.src = post.images[index];
    carouselBgImage.src = post.images[index]; // Set background image source
    carouselImage.style.opacity = 1; // Ensure main image is visible
    };

    prevButton.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + post.images.length) % post.images.length;
    showImage(currentImageIndex);
    });

    nextButton.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % post.images.length;
    showImage(currentImageIndex);
    });

    // Touch swipe for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    });

    carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    if (touchEndX < touchStartX - 50) { // Swiped left
    currentImageIndex = (currentImageIndex + 1) % post.images.length;
    showImage(currentImageIndex);
    }
    if (touchEndX > touchStartX + 50) { // Swiped right
    currentImageIndex = (currentImageIndex - 1 + post.images.length) % post.images.length;
    showImage(currentImageIndex);
    }
    });

    // Fullscreen image on click
    carouselImage.addEventListener('click', () => {
    fullscreenImage.src = carouselImage.src;
    fullscreenOverlay.classList.remove('hidden');
    });

    showImage(currentImageIndex); // Display the first image
    }
    });
    }

    // Function to render the post index in the header
    function renderPostIndex(posts) {
    postIndexList.innerHTML = ''; // Clear existing index
    posts.forEach(post => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#post-${post.id}`; // Link to the post card
    link.textContent = post.title;
    listItem.appendChild(link);
    postIndexList.appendChild(listItem);
    });
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredPosts = postsData.filter(post =>
    post.title.toLowerCase().includes(searchTerm) ||
    post.content.toLowerCase().includes(searchTerm)
    );
    renderPosts(filteredPosts);
    });

    // Scroll to bottom button functionality
    scrollToBottomBtn.addEventListener('click', () => {
    const lastCard = postList.lastElementChild;
    if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    });

    // Scroll to top button functionality
    scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Show scroll buttons with autohide on scroll
    window.addEventListener('scroll', showScrollButtonsWithAutohide);

    // Close fullscreen overlay
    fullscreenOverlay.addEventListener('click', () => {
    fullscreenOverlay.classList.add('hidden');
    });

    // Initial fetch and display
    fetchAndDisplayPosts();
});
