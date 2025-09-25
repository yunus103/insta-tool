import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { name } = req.query;
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!name) {
    return res.status(400).json({ error: 'Missing required location info' });
  }

  // The 'zoom' parameter can help improve search accuracy
  const url = `https://local-business-data.p.rapidapi.com/search?query=${encodeURIComponent(name)}&zoom=13&language=tr&region=tr`;

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'local-business-data.p.rapidapi.com'
    }
  };

  try {
    const apiRes = await fetch(url, options);
    const data = await apiRes.json();

    // **THE FIX IS HERE**
    // This now correctly checks for the "OK" status provided in your sample response,
    // as well as ensuring the data array is not empty.
    if (data.status !== 'OK' || !data.data || data.data.length === 0) {
      console.error('API returned a non-OK status or no data:', data);
      return res.status(404).json({ error: 'Location not found on the API' });
    }

    res.status(200).json(data);
    
  } catch (error) {
    console.error("Error in find-place:", error);
    res.status(500).json({ error: 'Failed to fetch data from RapidAPI' });
  }
}