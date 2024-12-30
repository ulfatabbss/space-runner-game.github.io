const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('high_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch high scores.', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
