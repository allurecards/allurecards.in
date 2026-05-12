document.addEventListener("DOMContentLoaded", () => {

    // 1. Preloader
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        }, 800);
    });

    // 2. Constants
    const whatsappNumber = "919526577999";
    const DEFAULT_DESCRIPTION = "Experience the timeless elegance of this design. Crafted on premium materials with exquisite detailing.";
    const ITEMS_PER_PAGE = 12;

    // DOM elements
    const productContainer = document.getElementById('product-container');
    const showMoreBtn = document.getElementById('show-more-btn');
    const filterContainer = document.getElementById('filter-container');
    const categoryGrid = document.getElementById('category-grid');

    // Modal elements
    const modal = document.getElementById('quick-view-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImg = document.getElementById('modal-main-img');
    const thumbnailContainer = document.getElementById('modal-thumbnails');
    const modalTitle = document.getElementById('modal-title');
    const modalUnitPrice = document.getElementById('modal-unit-price');
    const modalCategoryLabel = document.getElementById('modal-category-label');
    const modalDescText = document.getElementById('modal-desc-text');

    // Calculator elements
    const qtySelect = document.getElementById('modal-qty-select');
    const calcCardCost = document.getElementById('calc-card-cost');
    const calcPrintingVal = document.getElementById('calc-printing-val');
    const printingRow = document.getElementById('printing-row');
    const discountRow = document.getElementById('discount-row');
    const calcDiscountVal = document.getElementById('calc-discount-val');
    const savingsRow = document.getElementById('savings-row');
    const calcSavingsVal = document.getElementById('calc-savings-val');
    const calcFinalTotal = document.getElementById('calc-final-total');
    const whatsappBtn = document.getElementById('modal-whatsapp-btn');

    // Full‑screen gallery elements
    const galleryOverlay = document.getElementById('gallery-overlay');
    const galleryImg = document.getElementById('gallery-img');
    const galleryClose = document.getElementById('gallery-close');
    const galleryPrev = document.getElementById('gallery-prev');
    const galleryNext = document.getElementById('gallery-next');
    const galleryCounter = document.getElementById('gallery-counter');

    // Gallery state
    let currentImages = [];
    let currentGalleryIndex = 0;

    // State
    let allProducts = [];
    let filteredProducts = [];
    let visibleCount = 0;
    let currentFilter = 'All';

    // ---------------------------------------------------------------------
    // 3. Fetch data and initialise
    // ---------------------------------------------------------------------
    fetch('./data/cards.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.map(p => ({
                ...p,
                images: (p.images && p.images.length > 0) ? p.images : ['assets/cards/placeholder.jpg'],
                featured: p.featured || false,
                minOrder: p.minOrder || 100,
                description: p.description || DEFAULT_DESCRIPTION
            }));

            buildCategoryMenu();
            buildFilterButtons();
            applyFilter('All');
            updateShowMoreButton();
        })
        .catch(err => {
            console.error('Failed to load cards.json', err);
            productContainer.innerHTML = '<p class="no-products" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-light);">Unable to load designs. Please try again later.</p>';
        });

    // ---------------------------------------------------------------------
    // 4. Build category cards
    // ---------------------------------------------------------------------
    function buildCategoryMenu() {
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        categoryGrid.innerHTML = categories.map(cat => `
            <div class="category-card" data-category="${cat}">
                <h3>${cat}</h3>
                <p>${cat === 'Heritage' ? 'Rich, traditional luxury' : 
                     cat === 'Minimal' ? 'Understated elegance' :
                     cat === 'Floral' ? "Nature's romantic touch" :
                     cat === 'Modern' ? 'Contemporary & bold' :
                     'Explore our exclusive collection'}</p>
            </div>
        `).join('');

        categoryGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.category-card');
            if (!card) return;
            const cat = card.dataset.category;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === cat) btn.classList.add('active');
            });
            applyFilter(cat);
            document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ---------------------------------------------------------------------
    // 5. Dynamic filter buttons
    // ---------------------------------------------------------------------
    function buildFilterButtons() {
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        filterContainer.querySelectorAll('.filter-btn:not([data-filter="All"])').forEach(btn => btn.remove());

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = cat;
            btn.textContent = cat;
            filterContainer.appendChild(btn);
        });

        filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.dataset.filter);
        });
    }

    // ---------------------------------------------------------------------
    // 6. Apply filter & render first batch
    // ---------------------------------------------------------------------
    function applyFilter(filterCat) {
        currentFilter = filterCat;
        filteredProducts = filterCat === 'All'
            ? [...allProducts]
            : allProducts.filter(p => p.category === filterCat);

        filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

        visibleCount = Math.min(ITEMS_PER_PAGE, filteredProducts.length);
        productContainer.innerHTML = '';

        if (filteredProducts.length === 0) {
            productContainer.innerHTML = '<p class="no-products" style="grid-column:1/-1; text-align:center; color:var(--text-light); padding:40px;">No designs found in this collection.</p>';
        } else {
            const initialItems = filteredProducts.slice(0, visibleCount);
            productContainer.innerHTML = initialItems.map(product => createCardHTML(product)).join('');
        }

        updateShowMoreButton();
    }

    // ---------------------------------------------------------------------
    // 7. Create card HTML (unchanged)
    // ---------------------------------------------------------------------
    function createCardHTML(product) {
        const productJson = encodeURIComponent(JSON.stringify(product));
        const featuredBadge = product.featured ? '<span class="featured-badge">Featured</span>' : '';
        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    ${featuredBadge}
                    <img src="${product.images[0]}" alt="${product.id}" loading="lazy">
                    <div class="quick-view-overlay">
                        <button class="quick-view-btn" data-product="${productJson}">Quick View</button>
                    </div>
                </div>
                <h4 class="product-id">${product.id}</h4>
                <p class="product-price">Rs. ${product.price} / card</p>
            </div>
        `;
    }

    // ---------------------------------------------------------------------
    // 8. Show more items
    // ---------------------------------------------------------------------
    function showMoreItems() {
        const nextCount = Math.min(visibleCount + ITEMS_PER_PAGE, filteredProducts.length);
        const newItems = filteredProducts.slice(visibleCount, nextCount);
        if (newItems.length > 0) {
            const cardsHTML = newItems.map(product => createCardHTML(product)).join('');
            productContainer.insertAdjacentHTML('beforeend', cardsHTML);
        }
        visibleCount = nextCount;
        updateShowMoreButton();
    }

    function updateShowMoreButton() {
        showMoreBtn.style.display = (visibleCount < filteredProducts.length) ? 'inline-block' : 'none';
    }

    // ---------------------------------------------------------------------
    // 9. Quick View event delegation
    // ---------------------------------------------------------------------
    productContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-view-btn');
        if (!btn) return;
        const product = JSON.parse(decodeURIComponent(btn.getAttribute('data-product')));
        openProductModal(product);
    });

    showMoreBtn.addEventListener('click', showMoreItems);

    // ---------------------------------------------------------------------
    // 10. MODAL – Clean discount banner + full‑screen lightbox
    // ---------------------------------------------------------------------
    let currentUnitPrice = 0;
    let currentProductName = "";
    let currentProductCategory = "";
    let currentMinOrder = 100;

    function openProductModal(product) {
        currentProductName = product.id;
        currentProductCategory = product.category;
        currentUnitPrice = product.price;
        currentMinOrder = product.minOrder || 100;

        // Store images for lightbox
        currentImages = product.images || [];

        modalTitle.textContent = product.name || product.id;
        modalCategoryLabel.textContent = `Allure ${product.category} Collection`;
        modalUnitPrice.textContent = `Rs. ${product.price} / card`;
        modalDescText.textContent = product.description || DEFAULT_DESCRIPTION;

        // Main image
        modalImg.src = currentImages[0];
        modalImg.alt = product.name || product.id;

        // Thumbnails
        thumbnailContainer.innerHTML = '';
        if (currentImages.length > 1) {
            currentImages.forEach((imgSrc, index) => {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = `thumb ${index === 0 ? 'active' : ''}`;
                thumbDiv.innerHTML = `<img src="${imgSrc}" alt="Thumbnail ${index + 1}">`;

                thumbDiv.addEventListener('click', () => {
                    modalImg.style.opacity = '0.5';
                    setTimeout(() => {
                        modalImg.src = imgSrc;
                        modalImg.style.opacity = '1';
                    }, 150);
                    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                    thumbDiv.classList.add('active');
                });

                thumbnailContainer.appendChild(thumbDiv);
            });
        }

        // Populate dropdown
        populateQtyDropdown(currentMinOrder);

        // Bind change event
        qtySelect.removeEventListener('change', calculateTotal);
        qtySelect.addEventListener('change', calculateTotal);
        calculateTotal();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function populateQtyDropdown(minOrder) {
        qtySelect.innerHTML = '';
        for (let qty = minOrder; qty <= 1500; qty += 50) {
            const option = document.createElement('option');
            option.value = qty;
            option.textContent = qty.toLocaleString() + ' cards';
            if (qty === minOrder) option.selected = true;
            qtySelect.appendChild(option);
        }
    }

    function calculateTotal() {
        const qty = parseInt(qtySelect.value, 10);
        const cardCost = qty * currentUnitPrice;

        const printingCharge = qty < 200 ? 600 : 0;
        const printingWaived = printingCharge === 0 ? 600 : 0;

        let factor = 1.0;
        let discountPercent = 0;
        if (qty >= 1000) {
            factor = 0.90;
            discountPercent = 10;
        } else if (qty >= 500) {
            factor = 0.95;
            discountPercent = 5;
        }
        const discountAmount = Math.round(cardCost * (1 - factor));
        const finalTotal = Math.round(cardCost * factor) + printingCharge;
        const totalSavings = printingWaived + discountAmount;

        // Update DOM
        calcCardCost.textContent = `Rs. ${cardCost.toLocaleString()}`;

        if (printingCharge > 0) {
            calcPrintingVal.innerHTML = `Rs. 600`;
        } else {
            calcPrintingVal.innerHTML = `<span class="waived">Rs. 600</span> <span class="saved-text">FREE</span>`;
        }

        if (discountPercent > 0) {
            discountRow.style.display = 'flex';
            calcDiscountVal.innerHTML = `− Rs. ${discountAmount.toLocaleString()} (${discountPercent}% off)`;
            calcDiscountVal.style.color = '#2e7d32';
        } else {
            discountRow.style.display = 'none';
        }

        if (totalSavings > 0) {
            savingsRow.style.display = 'flex';
            calcSavingsVal.textContent = `Rs. ${totalSavings.toLocaleString()}`;
        } else {
            savingsRow.style.display = 'none';
        }

        calcFinalTotal.textContent = `Rs. ${finalTotal.toLocaleString()}`;

        const message = `Hello Impressions! I would like to inquire about an Allure card design.\n\n` +
                        `*Design:* ${currentProductName} (${currentProductCategory} Collection)\n` +
                        `*Quantity:* ${qty}\n` +
                        `*Estimated Total:* Rs. ${finalTotal.toLocaleString()}\n\n` +
                        `Please let me know how to proceed.`;
        whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    }

    // ---------------------------------------------------------------------
    // 11. LIGHTBOX – Full screen image viewer with arrow navigation
    // ---------------------------------------------------------------------
    // Click on main image in modal opens the lightbox
    modalImg.addEventListener('click', (e) => {
        if (currentImages.length === 0) return;
        // Start at the currently displayed image (match src)
        const src = modalImg.getAttribute('src');
        const idx = currentImages.indexOf(src);
        openGallery(idx >= 0 ? idx : 0);
    });

    function openGallery(index) {
        if (currentImages.length === 0) return;
        currentGalleryIndex = index;
        updateGalleryImage();
        galleryOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function updateGalleryImage() {
        galleryImg.src = currentImages[currentGalleryIndex];
        if (currentImages.length > 1) {
            galleryCounter.textContent = `${currentGalleryIndex + 1} / ${currentImages.length}`;
            galleryPrev.style.display = 'block';
            galleryNext.style.display = 'block';
        } else {
            galleryCounter.textContent = '';
            galleryPrev.style.display = 'none';
            galleryNext.style.display = 'none';
        }
    }

    function closeGallery() {
        galleryOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    galleryClose.addEventListener('click', closeGallery);
    galleryOverlay.addEventListener('click', (e) => {
        if (e.target === galleryOverlay) closeGallery();
    });

    galleryPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentImages.length > 0) {
            currentGalleryIndex = (currentGalleryIndex - 1 + currentImages.length) % currentImages.length;
            updateGalleryImage();
        }
    });

    galleryNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentImages.length > 0) {
            currentGalleryIndex = (currentGalleryIndex + 1) % currentImages.length;
            updateGalleryImage();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!galleryOverlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeGallery();
        if (e.key === 'ArrowLeft') {
            currentGalleryIndex = (currentGalleryIndex - 1 + currentImages.length) % currentImages.length;
            updateGalleryImage();
        }
        if (e.key === 'ArrowRight') {
            currentGalleryIndex = (currentGalleryIndex + 1) % currentImages.length;
            updateGalleryImage();
        }
    });

    // ---------------------------------------------------------------------
    // 12. Close modal (includes resetting body scroll)
    // ---------------------------------------------------------------------
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // ---------------------------------------------------------------------
    // 13. Footer year
    // ---------------------------------------------------------------------
    document.getElementById('currentYear').textContent = new Date().getFullYear();

});
