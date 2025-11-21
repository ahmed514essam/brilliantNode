/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/*===== MENU SHOW =====*/
/* Validate if constant exists */
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show-menu')
    })
}

/*===== MENU HIDDEN =====*/
/* Validate if constant exists */
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show-menu')
    })
}

/*=============== REMOVE MENU MOBILE ===============*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*=============== HOME SWIPER ===============*/
let homeSwiper = new Swiper(".home-swiper", {
    spaceBetween: 30,
    loop: 'true',
    
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
})

/*=============== CHANGE BACKGROUND HEADER ===============*/
function scrollHeader(){
    const header = document.getElementById('header')
    // When the scroll is greater than 50 viewport height, add the scroll-header class to the header tag
    if(this.scrollY >= 50) header.classList.add('scroll-header'); else header.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)

/*=============== NEW SWIPER ===============*/
let newSwiper = new Swiper(".new-swiper", {
    centeredSlides: true,
    slidesPerView: "auto",
    loop: 'true',
    spaceBetween: 16,
});

/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight,
              sectionTop = current.offsetTop - 58,
              sectionId = current.getAttribute('id')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.add('active-link')
        }else{
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*=============== SHOW SCROLL UP ===============*/ 
function scrollUp(){
    const scrollUp = document.getElementById('scroll-up');
    // When the scroll is higher than 460 viewport height, add the show-scroll class to the a tag with the scroll-top class
    if(this.scrollY >= 460) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)

/*=============== SCROLL REVEAL ANIMATION ===============*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2500,
    delay: 400,
    // reset: true
})

sr.reveal(`.home-swiper, .new-swiper, .newsletter__container`)
sr.reveal(`.category__data, .trick__content, .footer__content`,{interval: 100})
sr.reveal(`.about__data, .discount__img`,{origin: 'left'})
sr.reveal(`.about__img, .discount__data`,{origin: 'right'})
/*=============== SHOW CART ===============*/
const cart = document.getElementById('cart'),
    cartShop = document.getElementById('cart-shop'),
    cartClose = document.getElementById('cart-close')

/*===== CART SHOW =====*/
/* Validate if constant exists */
if(cartShop){
    cartShop.addEventListener('click', () =>{
        cart.classList.add('show-cart')
    })
}

/*===== CART HIDDEN =====*/
/* Validate if constant exists */
if(cartClose){
    cartClose.addEventListener('click', () =>{
        cart.classList.remove('show-cart')
    })
}

    const plusButtons = document.querySelectorAll('.plus');
    const minusButtons = document.querySelectorAll('.minus');
    const totalEl = document.getElementById('cart-total');

    function updateTotal() {
        let total = 0;
        document.querySelectorAll('.cart__card').forEach(card => {
            const priceText = card.querySelector('.cart__price').textContent;
            const price = parseFloat(priceText.replace('LE', '').trim());
            const qty = parseInt(card.querySelector('.cart__amount-number').textContent);
            total += price * qty;
        });
        totalEl.textContent = total + ' LE';
    }

    updateTotal();

/*=============== EVENT DELEGATION FOR CART BUTTONS ===============*/
document.addEventListener('click', (e) => {
    if (e.target.closest('.plus')) {
        const numberEl = e.target.closest('.cart__amount-content').querySelector('.cart__amount-number');
        numberEl.textContent = parseInt(numberEl.textContent) + 1;
        updateTotal();
    }

   if (e.target.closest('.minus')) {
    const card = e.target.closest('.cart__card');
    const numberEl = card.querySelector('.cart__amount-number');
    let current = parseInt(numberEl.textContent);

    if (current > 1) {
        numberEl.textContent = current - 1;
    } else {
        // لو وصلت صفر، احذف المنتج
        card.remove();
    }
    updateTotal();
}


    if (e.target.closest('.cart__amount-trash')) {
        e.target.closest('.cart__card').remove();
        updateTotal();
    }
});
// ===== إضافة المنتج إلى الكارت =====
const addToCartButtons = document.querySelectorAll('.new__button');
const cartContainer = document.querySelector('.cart__container');

addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
        const product = button.closest('.new__content');
        const title = product.querySelector('.new__title').textContent;
        const priceText = product.querySelector('.new__discount') 
                        ? product.querySelector('.new__discount').textContent 
                        : product.querySelector('.new__price').textContent;
        const price = parseFloat(priceText.replace('LE', '').trim());
        const imgSrc = product.querySelector('.new__img').getAttribute('src');

        const existingItem = Array.from(document.querySelectorAll('.cart__title'))
            .find(el => el.textContent === title);

        if (existingItem) {
            const numberEl = existingItem.closest('.cart__details').querySelector('.cart__amount-number');
            numberEl.textContent = parseInt(numberEl.textContent) + 1;
        } else {
            const newItem = document.createElement('article');
            newItem.classList.add('cart__card');
            newItem.innerHTML = `
                <div class="cart__box">
                    <img src="${imgSrc}" alt="${title}" class="cart__img">
                </div>
                <div class="cart__details">
                    <h3 class="cart__title">${title}</h3>
                    <span class="cart__price">${price} LE</span>
                    <div class="cart__amount">
                        <div class="cart__amount-content">
                            <span class="cart__amount-box minus">
                                <i class='bx bx-minus'></i>
                            </span>
                            <span class="cart__amount-number">1</span>
                            <span class="cart__amount-box plus">
                                <i class='bx bx-plus'></i>
                            </span>
                        </div>
                        <i class='bx bx-trash-alt cart__amount-trash'></i>
                    </div>
                </div>
            `;
            cartContainer.appendChild(newItem);
        }

        updateTotal();
        // فتح الكارت تلقائيًا بعد إضافة المنتج
        cart.classList.add('show-cart');
    });
});


    


