const leftPupil = document.getElementById('leftPupil');
const rightPupil = document.getElementById('rightPupil');
const leftEye = document.querySelector('.eye.left');
const rightEye = document.querySelector('.eye.right');

let hasMouseMoved = false;
let animationFrame;
let animationOffset = 0;

// Handle mouse movement
document.addEventListener('mousemove', (event) => {
    hasMouseMoved = true;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    const leftEyeRect = leftEye.getBoundingClientRect();
    const rightEyeRect = rightEye.getBoundingClientRect();
    
    // Calculate positions for left eye
    const leftDx = event.clientX - (leftEyeRect.left + leftEyeRect.width / 2);
    const leftDy = event.clientY - (leftEyeRect.top + leftEyeRect.height / 2);
    const leftAngle = Math.atan2(leftDy, leftDx);
    const leftDistance = Math.min(Math.sqrt(leftDx * leftDx + leftDy * leftDy), 10);
    
    // Calculate positions for right eye
    const rightDx = event.clientX - (rightEyeRect.left + rightEyeRect.width / 2);
    const rightDy = event.clientY - (rightEyeRect.top + rightEyeRect.height / 2);
    const rightAngle = Math.atan2(rightDy, rightDx);
    const rightDistance = Math.min(Math.sqrt(rightDx * rightDx + rightDy * rightDy), 10);
    
    // Move pupils
    leftPupil.style.transform = `translate(calc(-50% + ${Math.cos(leftAngle) * leftDistance}px), calc(-50% + ${Math.sin(leftAngle) * leftDistance}px))`;
    rightPupil.style.transform = `translate(calc(-50% + ${Math.cos(rightAngle) * rightDistance}px), calc(-50% + ${Math.sin(rightAngle) * rightDistance}px))`;
});

// Idle animation
function animate() {
    if (!hasMouseMoved) {
        animationOffset += 0.02;
        const xOffset = Math.sin(animationOffset) * 15;
        
        leftPupil.style.transform = `translate(calc(-50% + ${xOffset}px), -50%)`;
        rightPupil.style.transform = `translate(calc(-50% + ${xOffset}px), -50%)`;
        
        animationFrame = requestAnimationFrame(animate);
    }
}

// Start idle animation
animate();

document.addEventListener('mouseleave', () => {
    hasMouseMoved = false;
    animate();
});