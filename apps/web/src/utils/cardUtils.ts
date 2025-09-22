import html2canvas from 'html2canvas';
import type { User } from '../pages/DashboardPage';

/**
 * Formats user name with proper capitalization
 */
export const formatUserName = (user?: User): string => {
  if (!user) return '';
  const parts = [user.firstName, user.lastName.toUpperCase()];
  if (user.secondLastName) {
    parts.push(user.secondLastName.toUpperCase());
  }
  return parts.join(' ');
};

/**
 * Formats date to Mexican locale (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-MX');
};

/**
 * Calculates age from date of birth
 */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
};

/**
 * Formats phone number with dashes (XXX-XXX-XXXX)
 */
export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};

/**
 * Gets formatted vigency date from user
 */
export const getVigencyDate = (user: User): string => {
  if (!user || !user.vigencia) return '';
  return formatDate(user.vigencia);
};

/**
 * Gets photo URL for user with cache busting
 */
export const getPhotoUrl = (user: User): string | null => {
  if (!user.id || !user.photoPath) return null;
  return `/api/v1/users/${user.id}/photo?t=${Date.now()}`;
};

/**
 * Gets signature URL for user with cache busting
 */
export const getSignatureUrl = (user: User): string | null => {
  if (!user.id || !user.signaturePath) return null;
  return `/storage/${user.signaturePath}?t=${Date.now()}`;
};

/**
 * Creates a canvas element that properly crops an image with object-fit: cover behavior
 */
const createObjectCoverCanvas = (
  img: HTMLImageElement, 
  containerWidth: number, 
  containerHeight: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  canvas.className = img.className;
  canvas.style.cssText = img.style.cssText;
  
  // Calculate crop dimensions for object-fit: cover behavior
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const containerAspect = containerWidth / containerHeight;
  
  let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;
  
  if (imgAspect > containerAspect) {
    // Image is wider, crop sides
    drawHeight = containerHeight;
    drawWidth = drawHeight * imgAspect;
    offsetX = (containerWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image is taller, crop top/bottom
    drawWidth = containerWidth;
    drawHeight = drawWidth / imgAspect;
    offsetX = 0;
    offsetY = (containerHeight - drawHeight) / 2;
  }
  
  // Draw the properly cropped image
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  
  return canvas;
};

/**
 * Converts canvas image data to grayscale
 */
const convertCanvasToGrayscale = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green  
    data[i + 2] = gray; // Blue
    // Alpha channel (data[i + 3]) stays the same
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Handles the printing of credential cards using html2canvas
 */
export const handleCardPrint = async (user?: User): Promise<void> => {
  try {
    // Get the front and back card elements
    const frontCard = document.querySelector('.print-front-card') as HTMLElement;
    const backCard = document.querySelector('.print-back-card') as HTMLElement;
    
    if (!frontCard || !backCard) {
      console.error('Could not find card elements');
      return;
    }

    // Hide the FRENTE/REVERSO labels before capturing
    const frontLabel = frontCard.querySelector('h3') as HTMLElement;
    const backLabel = backCard.querySelector('h3') as HTMLElement;
    
    if (frontLabel) frontLabel.style.display = 'none';
    if (backLabel) backLabel.style.display = 'none';

    // Temporarily remove borders and border radius from screen cards for printing
    const frontScreenCard = frontCard.querySelector('.screen-card') as HTMLElement;
    const backScreenCard = backCard.querySelector('.screen-card') as HTMLElement;
    
    let originalFrontClasses = '';
    let originalBackClasses = '';
    
    if (frontScreenCard) {
      originalFrontClasses = frontScreenCard.className;
      frontScreenCard.className = frontScreenCard.className
        .replace(/border[\w-]*|rounded[\w-]*|shadow[\w-]*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    if (backScreenCard) {
      originalBackClasses = backScreenCard.className;
      backScreenCard.className = backScreenCard.className
        .replace(/border[\w-]*|rounded[\w-]*|shadow[\w-]*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Temporarily scale up the cards for much higher quality capture
    const originalTransform = frontCard.style.transform;
    const originalTransformBack = backCard.style.transform;
    const originalTransformOrigin = frontCard.style.transformOrigin;
    const originalTransformOriginBack = backCard.style.transformOrigin;
    
    // Scale up 3x for capture
    frontCard.style.transformOrigin = '0 0';
    frontCard.style.transform = 'scale(3)';
    backCard.style.transformOrigin = '0 0';
    backCard.style.transform = 'scale(3)';

    // Wait a moment for the transform to take effect
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fix object-cover issue by temporarily replacing img with canvas
    const userPhoto = frontCard.querySelector('.print-photo') as HTMLImageElement;
    let originalPhotoParent: HTMLElement | null = null;
    let photoCanvas: HTMLCanvasElement | null = null;
    
    if (userPhoto && userPhoto.complete && userPhoto.naturalWidth > 0) {
      originalPhotoParent = userPhoto.parentElement;
      
      if (originalPhotoParent) {
        // Get the container dimensions (photo box size) - scaled up
        const containerWidth = 64 * 3;
        const containerHeight = 80 * 3;
        
        // Create canvas with proper object-fit: cover behavior
        photoCanvas = createObjectCoverCanvas(userPhoto, containerWidth, containerHeight);
        
        // Replace the img with our canvas
        originalPhotoParent.replaceChild(photoCanvas, userPhoto);
      }
    }

    // Convert back card logos to grayscale for printing
    const backCardLogos = backCard.querySelectorAll('img[alt="CTM Logo"]') as NodeListOf<HTMLImageElement>;
    const originalLogos: { element: HTMLImageElement; parent: HTMLElement; canvas: HTMLCanvasElement }[] = [];
    
    for (const logo of backCardLogos) {
      if (logo.complete && logo.naturalWidth > 0 && logo.parentElement) {
        // Create a canvas from the logo
        const logoCanvas = document.createElement('canvas');
        const ctx = logoCanvas.getContext('2d');
        
        if (ctx) {
          logoCanvas.width = logo.offsetWidth * 3; // Match the scale factor
          logoCanvas.height = logo.offsetHeight * 3;
          logoCanvas.className = logo.className;
          logoCanvas.style.cssText = logo.style.cssText;
          
          // Draw the logo to canvas
          ctx.drawImage(logo, 0, 0, logoCanvas.width, logoCanvas.height);
          
          // Convert to grayscale
          const grayscaleCanvas = convertCanvasToGrayscale(logoCanvas);
          
          // Store original for restoration
          originalLogos.push({
            element: logo,
            parent: logo.parentElement,
            canvas: grayscaleCanvas
          });
          
          // Replace with grayscale canvas
          logo.parentElement.replaceChild(grayscaleCanvas, logo);
        }
      }
    }

    // Calculate CR-80 aspect ratio dimensions for capture
    // CR-80: 85.6mm × 53.98mm = 1.586:1 aspect ratio
    const cr80AspectRatio = 85.6 / 53.98;
    const captureWidth = 960; // High resolution width
    const captureHeight = Math.round(captureWidth / cr80AspectRatio);

    // Convert to images with ultra-high quality settings and correct aspect ratio
    const frontCanvas = await html2canvas(frontCard, {
      width: captureWidth,
      height: captureHeight,
      scale: 2,
      backgroundColor: '#ffffff',
      removeContainer: true,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 0,
      logging: false,
    });

    const backCanvas = await html2canvas(backCard, {
      width: captureWidth,
      height: captureHeight,
      scale: 2,
      backgroundColor: '#ffffff',
      removeContainer: true,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 0,
      logging: false,
    });

    // Restore original photo if we replaced it with canvas
    if (photoCanvas && originalPhotoParent && userPhoto) {
      originalPhotoParent.replaceChild(userPhoto, photoCanvas);
    }

    // Restore original logos
    for (const logoData of originalLogos) {
      logoData.parent.replaceChild(logoData.element, logoData.canvas);
    }

    // Restore original transforms and labels
    frontCard.style.transform = originalTransform;
    frontCard.style.transformOrigin = originalTransformOrigin;
    backCard.style.transform = originalTransformBack;
    backCard.style.transformOrigin = originalTransformOriginBack;
    
    if (frontLabel) frontLabel.style.display = '';
    if (backLabel) backLabel.style.display = '';

    // Restore original classes for screen cards
    if (frontScreenCard && originalFrontClasses) {
      frontScreenCard.className = originalFrontClasses;
    }
    if (backScreenCard && originalBackClasses) {
      backScreenCard.className = originalBackClasses;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate custom filename based on user's name
    const customTitle = user 
      ? `CTM_Credencial_${formatUserName(user).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`
      : 'CTM_Credencial';

    // Set up the print page with exact CR-80 sizing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${customTitle}</title>
          <style>
            @page {
              size: 85.6mm 53.98mm;
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            
            .page {
              width: 85.6mm;
              height: 53.98mm;
              display: flex;
              align-items: center;
              justify-content: center;
              page-break-after: always;
              box-sizing: border-box;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
            
            .card-image {
              width: 85.6mm;
              height: 53.98mm;
              object-fit: cover;
              object-position: center;
            }
            
            .card-image.back {
              transform: rotate(180deg);
            }
          </style>
        </head>
        <body>
          <div class="page">
            <img src="${frontCanvas.toDataURL('image/png', 1.0)}" alt="Front Card" class="card-image" />
          </div>
          <div class="page">
            <img src="${backCanvas.toDataURL('image/png', 1.0)}" alt="Back Card" class="card-image back" />
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait a bit for images to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);

  } catch (error) {
    console.error('Error generating print images:', error);
    // Fallback to regular print
    window.print();
  }
};
