const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, score } = req.body;

    try {
      const { data, error } = await supabase
        .from('high_scores')
        .insert([{ username, score }]);

      if (error) throw error;
      res.status(200).json({ message: 'High score saved!', data });
    } catch (error) {
      res.status(500).json({ message: 'Failed to save high score.', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
