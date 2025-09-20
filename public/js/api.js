// api.js - frontend helper functions to call our backend

// Search for locations by name
export async function searchLocations(query) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Search failed with status ${res.status}`);
    }
    return await res.json(); // JSON with location results
  } catch (err) {
    console.error("Error in searchLocations:", err);
    throw err;
  }
}

// Get posts by location ID
export async function getPostsByLocation(locationId, paginationToken = '') {
  try {
    const url = `/api/posts/${encodeURIComponent(locationId)}${paginationToken ? `?pagination_token=${encodeURIComponent(paginationToken)}` : ''}`;

    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Fetching posts failed with status ${res.status}`);
    }

    const data = await res.json();

    return {
      items: data?.data?.items || [],
      paginationToken: data?.pagination_token || null // <-- top-level token
    };
  } catch (err) {
    console.error("Error in getPostsByLocation:", err);
    throw err;
  }
}
