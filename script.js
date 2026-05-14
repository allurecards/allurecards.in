/* ============================================================
   ALLURE – SCRIPTS
   Preloader + header scroll state + mobile nav + portfolio
   ============================================================ */

window.addEventListener("load", () => {
    setTimeout(() => {
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.classList.add("hide");
        }
    }, 1600);
});

const header = document.getElementById("site-header");
if (header) {
    window.addEventListener("scroll", () => {
        header.classList.toggle("scrolled", window.scrollY > 60);
    }, { passive: true });
}

/* ============================================================
   MOBILE NAV – HAMBURGER TOGGLE
   ============================================================ */
(function () {
    const navToggle  = document.getElementById('nav-toggle');
    const mobileNav  = document.getElementById('mobile-nav');
    const navLinks   = mobileNav ? mobileNav.querySelectorAll('a') : [];

    if (!navToggle || !mobileNav) return;

    function openMenu() {
        navToggle.classList.add('open');
        mobileNav.classList.add('open');
        mobileNav.setAttribute('aria-hidden', 'false');
        navToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navToggle.classList.remove('open');
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', () => {
        navToggle.classList.contains('open') ? closeMenu() : openMenu();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMenu();
    }, { passive: true });
})();

/* ============================================================
   PORTFOLIO & MODAL FUNCTIONALITY
   ============================================================ */
(function () {
    'use strict';

    const WHATSAPP_NUMBER  = '919526577999';
    const DEFAULT_DESC     = 'Experience the timeless elegance of this design. Crafted on premium materials with exquisite detailing.';
    const ITEMS_PER_PAGE   = 12;

    const productContainer  = document.getElementById('product-container');
    const showMoreBtn       = document.getElementById('show-more-btn');
    const filterContainer   = document.getElementById('filter-container');
    const categoryGrid      = document.getElementById('category-grid');

    const modal             = document.getElementById('quick-view-modal');
    const closeModalBtn     = document.getElementById('close-modal');
    const modalImg          = document.getElementById('modal-main-img');
    const thumbnailRow      = document.getElementById('modal-thumbnails');
    const modalTitle        = document.getElementById('modal-title');
    const modalUnitPrice    = document.getElementById('modal-unit-price');
    const modalCategoryLbl  = document.getElementById('modal-category-label');
    const modalDescText     = document.getElementById('modal-desc-text');

    const modalDetails      = document.getElementById('modal-details');
    const modalExtraCharges = document.getElementById('modal-extra-charges');

    const qtySelect         = document.getElementById('modal-qty-select');
    const calcCardCost      = document.getElementById('calc-card-cost');
    const calcPrintingVal   = document.getElementById('calc-printing-val');
    const printingRow       = document.getElementById('printing-row');
    const discountRow       = document.getElementById('discount-row');
    const calcDiscountVal   = document.getElementById('calc-discount-val');
    const savingsRow        = document.getElementById('savings-row');
    const calcSavingsVal    = document.getElementById('calc-savings-val');
    const calcFinalTotal    = document.getElementById('calc-final-total');
    const whatsappBtn       = document.getElementById('modal-whatsapp-btn');

    const galleryOverlay    = document.getElementById('gallery-overlay');
    const galleryImg        = document.getElementById('gallery-img');
    const galleryClose      = document.getElementById('gallery-close');
    const galleryPrev       = document.getElementById('gallery-prev');
    const galleryNext       = document.getElementById('gallery-next');
    const galleryCounter    = document.getElementById('gallery-counter');

    let allProducts         = [];
    let filteredProducts    = [];
    let visibleCount        = 0;
    let currentFilter       = 'All';
    let currentImages       = [];
    let currentGalleryIndex = 0;
    let currentUnitPrice    = 0;
    let currentProductName  = '';
    let currentProductCat   = '';
    let currentMinOrder     = 100;
    let currentExtraCharges = [];

    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    function getUniqueCategories() {
        return [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    fetch('./data/cards.json')
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            allProducts = data.map(p => ({
                ...p,
                images:      (p.images && p.images.length > 0) ? p.images : ['assets/cards/placeholder.jpg'],
                featured:    p.featured  || false,
                minOrder:    p.minOrder  || 100,
                description: p.description || DEFAULT_DESC
            }));

            buildCategoryMenu();
            buildFilterButtons();
            applyFilter('All');
        })
        .catch(err => {
            console.error('Failed to load cards.json:', err);
            if (productContainer) {
                productContainer.innerHTML = '<p class="no-products">Unable to load designs. Please try again later.</p>';
            }
        });

    const CATEGORY_DESCRIPTIONS = {
        Heritage: 'Rich, traditional luxury',
        Minimal:  'Understated elegance',
        Floral:   "Nature's romantic touch",
        Modern:   'Contemporary & bold'
    };

    function buildCategoryMenu() {
        const cats = getUniqueCategories();
        categoryGrid.innerHTML = cats.map(cat => `
            <div class="category-card" data-category="${escapeHtml(cat)}" role="button" tabindex="0"
                 aria-label="View ${escapeHtml(cat)} collection">
                <h3>${escapeHtml(cat)}</h3>
                <p>${escapeHtml(CATEGORY_DESCRIPTIONS[cat] || 'Explore our exclusive collection')}</p>
            </div>
        `).join('');

        categoryGrid.addEventListener('click', onCategoryClick);
        categoryGrid.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') onCategoryClick(e);
        });
    }

    function onCategoryClick(e) {
        const card = e.target.closest('.category-card');
        if (!card) return;
        const cat = card.dataset.category;
        setActiveFilter(cat);
        applyFilter(cat);
        document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
    }

    function buildFilterButtons() {
        filterContainer.querySelectorAll('.filter-btn:not([data-filter="All"])').forEach(b => b.remove());
        getUniqueCategories().forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = cat;
            btn.textContent = cat;
            filterContainer.appendChild(btn);
        });
    }

    filterContainer.addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        setActiveFilter(btn.dataset.filter);
        applyFilter(btn.dataset.filter);
    });

    function setActiveFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.filter === filter);
        });
        document.querySelectorAll('.category-card').forEach(c => {
            c.classList.toggle('active', c.dataset.category === filter);
        });
    }

    function applyFilter(filter) {
        currentFilter = filter;
        filteredProducts = filter === 'All'
            ? [...allProducts]
            : allProducts.filter(p => p.category === filter);

        filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        visibleCount = Math.min(ITEMS_PER_PAGE, filteredProducts.length);
        productContainer.innerHTML = '';

        if (filteredProducts.length === 0) {
            productContainer.innerHTML = '<p class="no-products">No designs found in this collection.</p>';
        } else {
            productContainer.innerHTML = filteredProducts
                .slice(0, visibleCount)
                .map(createCardHTML)
                .join('');
        }
        updateShowMoreBtn();
    }

    // Product card: only ID and price (no size/material)
    function createCardHTML(product) {
        const productJson  = encodeURIComponent(JSON.stringify(product));
        const featuredBadge = product.featured
            ? '<span class="featured-badge">Featured</span>'
            : '';
        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    ${featuredBadge}
                    <img src="${escapeHtml(product.images[0])}"
                         alt="${escapeHtml(product.id)} card design"
                         loading="lazy">
                    <div class="quick-view-overlay">
                        <button class="quick-view-btn"
                                data-product="${productJson}"
                                aria-label="Quick view ${escapeHtml(product.id)}">
                            Quick View
                        </button>
                    </div>
                </div>
                <h4 class="product-id">${escapeHtml(product.id)}</h4>
                <p class="product-price">Rs. ${product.price} / card</p>
            </div>
        `;
    }

    productContainer.addEventListener('click', e => {
        const btn = e.target.closest('.quick-view-btn');
        if (!btn) return;
        try {
            const product = JSON.parse(decodeURIComponent(btn.getAttribute('data-product')));
            openProductModal(product);
        } catch (err) {
            console.error('Could not parse product data:', err);
        }
    });

    showMoreBtn.addEventListener('click', () => {
        const nextCount = Math.min(visibleCount + ITEMS_PER_PAGE, filteredProducts.length);
        const newHTML = filteredProducts
            .slice(visibleCount, nextCount)
            .map(createCardHTML)
            .join('');
        productContainer.insertAdjacentHTML('beforeend', newHTML);
        visibleCount = nextCount;
        updateShowMoreBtn();
    });

    function updateShowMoreBtn() {
        showMoreBtn.style.display = visibleCount < filteredProducts.length ? 'inline-block' : 'none';
    }

    function openProductModal(product) {
        currentProductName  = product.id;               // used for WhatsApp message
        currentProductCat   = product.category;
        currentUnitPrice    = product.price;
        currentMinOrder     = product.minOrder || 100;
        currentImages       = product.images || [];
        currentExtraCharges = product.extraCharges || [];

        // Modal title is now the card ID
        modalTitle.textContent       = product.id;
        modalCategoryLbl.textContent = product.category
            ? `Allure ${product.category} Collection`
            : 'Allure Collection';
        modalUnitPrice.textContent   = `Rs. ${product.price} / card`;
        modalDescText.textContent    = product.description || DEFAULT_DESC;

        // Size & material line
        if (modalDetails) {
            const parts = [];
            if (product.size) parts.push(`Size: ${product.size}`);
            if (product.material) parts.push(`Material: ${product.material}`);
            modalDetails.textContent = parts.join(' · ');
        }

        // Extra charges list
        if (modalExtraCharges) {
            modalExtraCharges.innerHTML = '';
            if (currentExtraCharges.length > 0) {
                currentExtraCharges.forEach(ch => {
                    const li = document.createElement('li');
                    li.textContent = `${ch.name}: Rs. ${ch.price}`;
                    modalExtraCharges.appendChild(li);
                });
            }
        }

        modalImg.src = currentImages[0] || '';
        modalImg.alt = product.id;

        thumbnailRow.innerHTML = '';
        if (currentImages.length > 1) {
            currentImages.forEach((src, idx) => {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = `thumb${idx === 0 ? ' active' : ''}`;
                thumbDiv.innerHTML = `<img src="${escapeHtml(src)}" alt="Thumbnail ${idx + 1}">`;
                thumbDiv.addEventListener('click', () => {
                    modalImg.style.opacity = '0.5';
                    setTimeout(() => {
                        modalImg.src = src;
                        modalImg.style.opacity = '1';
                    }, 160);
                    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                    thumbDiv.classList.add('active');
                });
                thumbnailRow.appendChild(thumbDiv);
            });
        }

        populateQtyDropdown(currentMinOrder);
        qtySelect.removeEventListener('change', calculateTotal);
        qtySelect.addEventListener('change', calculateTotal);
        calculateTotal();

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeModalBtn.focus();
    }

    function closeModal() {
        closeGallery(true);
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    }

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    function populateQtyDropdown(minOrder) {
        qtySelect.innerHTML = '';
        for (let qty = minOrder; qty <= 1500; qty += 50) {
            const opt = document.createElement('option');
            opt.value = qty;
            opt.textContent = qty.toLocaleString() + ' cards';
            if (qty === minOrder) opt.selected = true;
            qtySelect.appendChild(opt);
        }
    }

function calculateTotal() {
    const qty           = parseInt(qtySelect.value, 10);
    const cardCost      = qty * currentUnitPrice;
    const printingFee   = qty < 200 ? 600 : 0;
    const printingWaived = printingFee === 0 ? 600 : 0;

    const extraTotal = currentExtraCharges.reduce((sum, ch) => sum + ch.price, 0);

    let factor = 1.0;
    let discountPct = 0;
    if      (qty >= 1000) { factor = 0.90; discountPct = 10; }
    else if (qty >= 500)  { factor = 0.95; discountPct = 5;  }

    const discountAmt = Math.round(cardCost * (1 - factor));
    const finalTotal  = Math.round(cardCost * factor) + printingFee + extraTotal;
    const totalSavings = printingWaived + discountAmt;

    // 1. Card Cost
    calcCardCost.textContent = `Rs. ${cardCost.toLocaleString()}`;

    // 2. Printing Cost (only when charged)
    if (printingFee > 0) {
        printingRow.style.display = 'flex';
        calcPrintingVal.innerHTML = 'Rs. 600';
    } else {
        printingRow.style.display = 'none';   // completely hidden when free
    }

    // 3. Volume Discount (if any)
    discountRow.style.display = discountPct > 0 ? 'flex' : 'none';
    if (discountPct > 0) {
        calcDiscountVal.innerHTML = `− Rs. ${discountAmt.toLocaleString()} (${discountPct}% off)`;
        calcDiscountVal.style.color = '#2e7d32';  // professional green
        // no background, no other highlights
    }

    // 4. Extra Charges Breakdown (by name)
    const calcSummary = document.querySelector('.calc-summary');
    calcSummary.querySelectorAll('.extra-charge-item, .extra-charge-subtotal').forEach(el => el.remove());

    if (currentExtraCharges.length > 0) {
        const insertBefore = savingsRow;
        currentExtraCharges.forEach(ch => {
            const row = document.createElement('div');
            row.className = 'summary-row extra-charge-item';
            row.innerHTML = `<span>${escapeHtml(ch.name)}</span><span>Rs. ${ch.price.toLocaleString()}</span>`;
            calcSummary.insertBefore(row, insertBefore);
        });

        if (currentExtraCharges.length > 1) {
            const subtotalRow = document.createElement('div');
            subtotalRow.className = 'summary-row extra-charge-subtotal';
            subtotalRow.innerHTML = `<span>Total Extra Charges</span><span>Rs. ${extraTotal.toLocaleString()}</span>`;
            calcSummary.insertBefore(subtotalRow, insertBefore);
        }
    }

    // 5. You Save
    savingsRow.style.display = totalSavings > 0 ? 'flex' : 'none';
    if (totalSavings > 0) {
        let parts = [];
        if (printingWaived > 0) parts.push(`Printing free (Rs. ${printingWaived})`);
        if (discountAmt > 0) parts.push(`${discountPct}% discount (Rs. ${discountAmt.toLocaleString()})`);
        calcSavingsVal.innerHTML = parts.join('<br>');
        // keep it clean – no background
    }

    // 6. Final Estimate
    calcFinalTotal.textContent = `Rs. ${finalTotal.toLocaleString()}`;

    // 7. WhatsApp message with full breakdown
    const breakdownLines = [
        `*Design:* ${currentProductName} (${currentProductCat} Collection)`,
        `*Quantity:* ${qty}`,
        ``,
        `*Price Breakdown:*`,
        `Card Cost: Rs. ${cardCost.toLocaleString()}`
    ];

    if (printingFee > 0) {
        breakdownLines.push(`Printing Charge: Rs. ${printingFee}`);
    } else {
        breakdownLines.push(`Printing Charge: FREE (saved Rs. 600)`);
    }

    if (currentExtraCharges.length > 0) {
        currentExtraCharges.forEach(ch => {
            breakdownLines.push(`${ch.name}: Rs. ${ch.price}`);
        });
        if (currentExtraCharges.length > 1) {
            breakdownLines.push(`Total Extra Charges: Rs. ${extraTotal.toLocaleString()}`);
        }
    }

    if (discountAmt > 0) {
        breakdownLines.push(`Volume Discount (${discountPct}%): – Rs. ${discountAmt.toLocaleString()}`);
    }

    breakdownLines.push(`───`);
    breakdownLines.push(`*Final Estimate: Rs. ${finalTotal.toLocaleString()}*`);
    breakdownLines.push(``);
    breakdownLines.push(`Please let me know how to proceed.`);

    const message = breakdownLines.join('\n');
    whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

    /* Lightbox */
    modalImg.addEventListener('click', () => {
        if (!currentImages.length) return;
        const activeSrc = modalImg.getAttribute('src');
        const idx = currentImages.indexOf(activeSrc);
        openGallery(idx >= 0 ? idx : 0);
    });

    function openGallery(index) {
        if (!currentImages.length) return;
        currentGalleryIndex = index;
        updateGalleryImage();
        galleryOverlay.classList.add('active');
        galleryClose.focus();
    }

    function updateGalleryImage() {
        galleryImg.src = currentImages[currentGalleryIndex];
        galleryImg.alt = `Image ${currentGalleryIndex + 1} of ${currentImages.length}`;
        const multiple = currentImages.length > 1;
        galleryCounter.textContent = multiple
            ? `${currentGalleryIndex + 1} / ${currentImages.length}`
            : '';
        galleryPrev.style.display = multiple ? 'block' : 'none';
        galleryNext.style.display = multiple ? 'block' : 'none';
    }

    function closeGallery(fromModal = false) {
        galleryOverlay.classList.remove('active');
        if (!fromModal && !modal.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
    }

    galleryClose.addEventListener('click', () => closeGallery());
    galleryOverlay.addEventListener('click', e => {
        if (e.target === galleryOverlay) closeGallery();
    });

    galleryPrev.addEventListener('click', e => {
        e.stopPropagation();
        if (!currentImages.length) return;
        currentGalleryIndex = (currentGalleryIndex - 1 + currentImages.length) % currentImages.length;
        updateGalleryImage();
    });

    galleryNext.addEventListener('click', e => {
        e.stopPropagation();
        if (!currentImages.length) return;
        currentGalleryIndex = (currentGalleryIndex + 1) % currentImages.length;
        updateGalleryImage();
    });

    document.addEventListener('keydown', e => {
        if (!galleryOverlay.classList.contains('active')) return;
        switch (e.key) {
            case 'Escape':
                closeGallery();
                break;
            case 'ArrowLeft':
                if (currentImages.length > 1) {
                    currentGalleryIndex = (currentGalleryIndex - 1 + currentImages.length) % currentImages.length;
                    updateGalleryImage();
                }
                break;
            case 'ArrowRight':
                if (currentImages.length > 1) {
                    currentGalleryIndex = (currentGalleryIndex + 1) % currentImages.length;
                    updateGalleryImage();
                }
                break;
        }
    });

})();
