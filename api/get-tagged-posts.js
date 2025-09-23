import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 1. Accept an optional 'cursor'
  const { username, cursor } = req.query;
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  let url = `https://instagram-social-api.p.rapidapi.com/v1/tagged?username_or_id_or_url=${username}`;

  // 2. If a cursor is provided, add it to the URL
  if (cursor) {
    url += `&pagination_token=${cursor}`;
  }
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'instagram-social-api.p.rapidapi.com'
    }
  };

  try {
    const apiRes = await fetch(url, options);
    const data = await apiRes.json();

    // 3. Send back the posts AND the token for the next page
    res.status(200).json({
      posts: data.data?.items || [],
      nextCursor: data.pagination_token || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tagged posts' });
  }
}