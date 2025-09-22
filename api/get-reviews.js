import fetch from 'node-fetch';


export default async function handler(req, res) {
  // We now expect 'businessId' and an optional 'cursor' from the frontend
  const { businessId, cursor, reviewCount } = req.query;
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!businessId) {
    return res.status(400).json({ error: 'Business ID is required' });
  }

  // If reviewCount is not provided, default to 20.
  const count = parseInt(reviewCount, 10) || 20;

  // Use Math.min() to get the smaller of the two values, effectively capping it at 1000.
  const limit = Math.min(count, 1000);


  let url = `https://local-business-data.p.rapidapi.com/business-reviews-v2?business_id=${businessId}&limit=${limit}&region=tr&language=tr`;

  // If a cursor is provided for the next page, add it to the URL
  if (cursor) {
    url += `&cursor=${cursor}`;
  }

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'local-business-data.p.rapidapi.com'
    }
  };
  // --- CHANGES END HERE ---

  try {
    const apiRes = await fetch(url, options);
    const data = await apiRes.json();

    if (data.status !== 'OK') {
      return res.status(404).json({ error: 'Could not retrieve reviews for that business' });
    }
    
    // --- RESPONSE CHANGE ---
    // Send back the reviews and the cursor for the *next* page
    res.status(200).json({
      reviews: data.data.reviews,
      nextCursor: data.data.cursor // This is for pagination
    });
    // --- RESPONSE CHANGE END ---
    
  } catch (error) {
    console.error("Error in get-reviews:", error);
    res.status(500).json({ error: 'Failed to fetch data from RapidAPI' });
  }
}