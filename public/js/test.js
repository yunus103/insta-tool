import { searchLocations, getPostsByLocation } from './api.js';

async function test() {
  try {
    const locations = await searchLocations("Caki Restoran");
    console.log("Locations:", locations);

    if (locations.data && locations.data.length > 0) {
      const firstId = locations.data[0].id;
      const posts = await getPostsByLocation(firstId);
      console.log("Posts:", posts);
    }
  } catch (err) {
    console.error("API test failed:", err);
  }
}

test();
