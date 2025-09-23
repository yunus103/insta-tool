import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { postId } = req.query; // Expecting the unique post ID
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  const url = `https://instagram-social-api.p.rapidapi.com/v1/likes?code_or_id_or_url=${postId}`;
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

    // API'den gelen yanıttan sadece 'items' dizisini ayıklıyoruz.
    const likers = data.data?.items || [];

    // Frontend'e sadece temizlenmiş beğenenler dizisini gönderiyoruz.
    res.status(200).json(likers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post likers' });
  }
}