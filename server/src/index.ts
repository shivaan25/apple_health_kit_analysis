import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { parseHealthExport } from './services/parser';
import { generateHealthInsights } from './services/ai';
import { supabaseAdmin } from './config/supabase';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('health_data'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { days, user_id } = req.body;
  const daysNum = parseInt(days as string) || 7;
  const userId = user_id as string;

  if (!userId) {
     return res.status(401).json({ error: 'User ID required' });
  }

  try {
    // 1. Parse Data
    const metrics = await parseHealthExport(req.file.path, daysNum);
    
    // 2. Generate Insights
    const insights = await generateHealthInsights(metrics, `${daysNum}d`);

    // 3. Save to Supabase
    const { data, error } = await supabaseAdmin
      .from('health_snapshots')
      .insert({
        user_id: userId,
        date_range: `${daysNum}d`,
        metrics: metrics,
        insights: insights,
        recommendations: insights // Assuming AI returns recommendations inside
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error('Failed to save snapshot');
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, snapshot: data });

  } catch (error: any) {
    console.error('Processing Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.send('Health App Backend Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
