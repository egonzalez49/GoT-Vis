let controller = new ScrollMagic.Controller();

var scene = new ScrollMagic.Scene({
        triggerElement: "#pinned-trigger1", // point of execution
        duration: 150, // pin element for the window height - 1
        triggerHook: 0, // don't trigger until #pinned-trigger1 hits the top of the viewport
        reverse: true // allows the effect to trigger when scrolled in the reverse direction
  })
  .setPin("#pinned-element1"); // the element we want to pin

let scene2 = new ScrollMagic.Scene({
        triggerElement: "#pinned-trigger2", // point of execution
        duration: 150 // pin the element for a total of 400px
    })
    .setPin("#pinned-element2"); // the element we want to pin

let scene3 = new ScrollMagic.Scene({
        triggerElement: "#pinned-trigger3",
        duration: 150
    })
    .setPin("#pinned-element3");

let scene4 = new ScrollMagic.Scene({
        triggerElement: "#pinned-trigger4",
        duration: 150
    })
    .addIndicators({name: "4 (duration: 150)"})
    .setPin("#pinned-element4");

controller.addScene([
    scene,
    scene2,
    scene3,
    scene4
]);

window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        document.querySelector('.scroll-container').style.visibility = 'hidden';
    } else {
        document.querySelector('.scroll-container').style.visibility = 'visible';
    }
}, {passive: true});