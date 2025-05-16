// Utility function to generate descriptions for images based on room type
export async function generateImageDescription(
  imageUrl: string,
  roomName: string
): Promise<string> {
  // Convert roomName to lowercase for case-insensitive matching
  const roomNameLower = roomName.toLowerCase();
  
  // Generate different descriptions based on room type
  let description = '';
  
  // Check for different room types to generate relevant descriptions
  if (roomNameLower.includes('bedroom')) {
    const items = [
      'bed with decorative pillows',
      'nightstand with lamp',
      'wardrobe with sliding doors',
      'desk with chair',
      'dresser with mirror',
      'window with curtains',
      'bedside lighting fixture',
      'walk-in closet'
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    description = `${randomItem} in ${roomName}`;
  } 
  else if (roomNameLower.includes('bathroom')) {
    const items = [
      'shower enclosure',
      'freestanding bathtub',
      'dual sink vanity',
      'toilet',
      'mirror cabinet',
      'towel rack',
      'spa bath',
      'bathroom storage unit'
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    description = `${randomItem} in ${roomName}`;
  } 
  else if (roomNameLower.includes('kitchen')) {
    const items = [
      'kitchen island with bar stools',
      'refrigerator',
      'gas stove',
      'oven',
      'sink with faucet',
      'microwave',
      'dishwasher',
      'cabinets and storage',
      'kitchen counter'
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    description = `${randomItem} in ${roomName}`;
  } 
  else if (roomNameLower.includes('living') || roomNameLower.includes('lounge')) {
    const items = [
      'comfortable sofa set',
      'coffee table',
      'TV stand with entertainment system',
      'bookshelf',
      'armchair',
      'fireplace',
      'side tables',
      'decorative lighting'
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    description = `${randomItem} in ${roomName}`;
  } 
  else if (roomNameLower.includes('dining')) {
    const items = [
      'dining table with chairs',
      'buffet cabinet',
      'china cabinet',
      'serving table',
      'wine rack',
      'pendant lighting',
      'dining set'
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    description = `${randomItem} in ${roomName}`;
  }
  else if (roomNameLower.includes('office') || roomNameLower.includes('study')) {
    const items = [
      'desk with computer',
      'office chair',
      'bookcase',
      'filing cabinet',
      'desk lamp',
      'stationery organizer',
      'whiteboard'
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    description = `${randomItem} in ${roomName}`;
  }
  else {
    // For any other room type
    description = `View of ${roomName}`;
  }

  // In a real implementation, you would call an AI service here
  // const response = await fetch('your-ai-image-recognition-api', {
  //   method: 'POST',
  //   body: JSON.stringify({ image: imageUrl }),
  //   headers: { 'Content-Type': 'application/json' }
  // });
  // const data = await response.json();
  // description = data.description;

  return description;
}